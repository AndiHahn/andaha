import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { BillDto } from 'src/app/api/shopping/models/BillDto';
import { BillContextService } from '../../services/bill-context.service';

@Component({
  selector: 'app-bill-list',
  templateUrl: './bill-list.component.html',
  styleUrls: ['./bill-list.component.scss']
})
export class BillListComponent implements OnInit {

  bills?: BillDto[];

  pageSize?: number;
  totalResults?: number;

  constructor(private billListContextService: BillContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }

  onPageChange(event: PageEvent): void {
    this.billListContextService.setPageIndex(event.pageIndex);
    this.billListContextService.setPageSize(event.pageSize);
  }

  private initSubscriptions(): void {
    this.billListContextService.bills().subscribe(
      {
        next: result => this.bills = result
      }
    );

    this.billListContextService.totalResults().subscribe(
      {
        next: totalRresults => this.totalResults = totalRresults
      }
    );

    this.billListContextService.pageSize().subscribe(
      {
        next: pageSize => this.pageSize = pageSize
      }
    );
  }
}
