import { Component, OnInit } from '@angular/core';
import { TimeRange, mapTimeRangeDto } from 'src/app/shared/models/TimeRange';
import { StatisticsContextService } from '../../services/statistics-context.service';
import { StatisticsDto } from 'src/app/api/work/dtos/StatisticsDto';
import { Time } from '@angular/common';
import { createTimeDisplayName } from '../../functions/date-time-functions';
import { DateType } from 'src/app/features/bill/modules/expenses/timerange-selection/DateType';
import { FullStatisticsDto } from 'src/app/api/work/dtos/FullStatisticsDto';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit {

  availableTimeRange?: TimeRange;
  statistics?: StatisticsDto;
  fullStatistics?: FullStatisticsDto;
  isLoading: boolean = false;

  selectedTimeRange?: TimeRange;

  dateType = DateType;

  constructor(
    private contextService: StatisticsContextService
  ) {
    this.initSubscriptions();
  }

  ngOnInit(): void {
  }

  timeSelectionChanged(timeRange: TimeRange): void {
    this.isLoading = true;
    this.selectedTimeRange = timeRange;

    if (timeRange.dateType == DateType.Total) {
      this.contextService.loadFullStatistics();
    } else {
      this.contextService.loadStatistics(timeRange);
    }
  }

  getTimeDisplayString(time: Time): string {
    return createTimeDisplayName(time);
  }

  truncate(decimals: number, value?: number): number {
    if (value) {
      return Number(value.toFixed(decimals));
    }

    return 0.0;
  }

  private initSubscriptions(): void {
    this.contextService.loading().subscribe(
      {
        next: loading => this.isLoading = loading
      }
    );
    
    this.contextService.availableTimeRange().subscribe(
      {
        next: timeRange => {
          if (timeRange) {
            this.availableTimeRange = mapTimeRangeDto(timeRange);
          }
        } 
      }
    );

    this.contextService.statistics().subscribe(
      {
        next: statistics => {
          if (statistics) {
            this.statistics = statistics;
          }
        }
      }
    );

    this.contextService.fullStatistics().subscribe(
      {
        next: statistics => {
          if (statistics) {
            this.fullStatistics = statistics;
          }
        }
      }
    );
  }
}
