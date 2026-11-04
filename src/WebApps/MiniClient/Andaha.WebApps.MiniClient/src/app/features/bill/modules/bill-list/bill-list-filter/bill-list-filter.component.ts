import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { merge, of, Subject, timer } from 'rxjs';
import { distinctUntilChanged, map, skip, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CategoryDto } from 'src/app/api/shopping/dtos/CategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillListFilterDialogService } from './bill-list-filter-dialog/bill-list-filter-dialog.service';
import { BillListFilterDialogData } from './bill-list-filter-dialog/BillListFilterDialogData';
import { BillListDateFilter } from './BillListDateFilter';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';

interface CategorySelection {
  selected: boolean;
  displayName: string;
  category?: CategoryDto;
}

@Component({
    selector: 'app-bill-list-filter',
    templateUrl: './bill-list-filter.component.html',
    styleUrls: ['./bill-list-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatIcon, DatePipe]
})
export class BillListFilterComponent implements OnInit, OnDestroy {
  @ViewChild('searchTerm') searchInput!: ElementRef;
  
  @Input()
  deactivate: boolean = false;

  @Input()
  initialSearchText?: string;

  @Input()
  initialCategoryFilters?: string[];

  @Input()
  initialDateFilter?: BillListDateFilter;
  
  @Output()
  searchTextChanged = new EventEmitter<string>();

  @Output()
  categoryFilterChanged = new EventEmitter<CategoryDto[]>();

  @Output()
  dateFilterChanged = new EventEmitter<BillListDateFilter>();

  isLoading: boolean = false;

  readonly searchDebounceMs = 600;
  private readonly typedSearch = new Subject<string>();
  private readonly immediateSearch = new Subject<string>();
  private readonly destroyed = new Subject<void>();

  inputFieldValue: string = '';

  categories?: CategorySelection[];

  fromDateFilter?: Date;
  untilDateFilter?: Date;
  
  constructor(
    private billListFilterDialogService: BillListFilterDialogService,
    private billCategoryContextService: BillCategoryContextService) { }

  ngOnInit(): void {
    if (this.initialSearchText) {
      this.inputFieldValue = this.initialSearchText;
    }

    this.fromDateFilter = this.initialDateFilter?.fromDate;
    this.untilDateFilter = this.initialDateFilter?.untilDate;

    this.loadBillCategories();

    // A newer event (typed, enter, clear) cancels a pending delayed search.
    merge(
      this.typedSearch.pipe(map(value => ({ value, immediate: value === '' }))),
      this.immediateSearch.pipe(map(value => ({ value, immediate: true })))
    ).pipe(
      switchMap(event => event.immediate
        ? of(event.value)
        : timer(this.searchDebounceMs).pipe(map(() => event.value))),
      startWith(this.initialSearchText?.trim() ?? ''),
      distinctUntilChanged(),
      skip(1),
      takeUntil(this.destroyed)
    ).subscribe(searchText => this.searchTextChanged.emit(searchText));
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  onSearchInput(value: string): void {
    this.typedSearch.next(value.trim());
  }

  onSearchEnter(value: string): void {
    this.immediateSearch.next(value.trim());
  }

  searchBoxKeyDown(event: any) {
    event.stopImmediatePropagation();
  }

  onClearSearch(): void {
    this.searchInput.nativeElement.value = '';
    this.immediateSearch.next('');
  }

  onFilterClick(): void {
    const data: BillListFilterDialogData = {
      from: this.fromDateFilter,
      until: this.untilDateFilter
    };

    this.billListFilterDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: result => {
          if (!result) {
            return;
          }
          
          const dateChanged = this.fromDateFilter?.getTime() != result?.from?.getTime() ||
                              this.untilDateFilter?.getTime() != result?.until?.getTime();

          this.fromDateFilter = result?.from;
          this.untilDateFilter = result?.until;
          
          if (dateChanged) {
            this.triggerDateFilterChanged();
          }
        }
      }
    ));
  }

  onChipClick(index: number): void {
    if (!this.categories) {
      return;
    }

    this.categories[index].selected = true;

    this.deselectAllExcept(index);
    
    this.triggerCategorySelection();
  }

  private deselectAllExcept(index: number): void {
    if (!this.categories) {
      return;
    }

    const allExceptGiven = this.categories.filter((_, idx) => idx != index);
    allExceptGiven.forEach(category => category.selected = false);
  }

  onFromDateFilterRemoveClick(): void {
    this.fromDateFilter = undefined;
    this.triggerDateFilterChanged();
  }

  onUntilDateFilterRemoveClick(): void {
    this.untilDateFilter = undefined;
    this.triggerDateFilterChanged();
  }

  private triggerCategorySelection(): void {
    if (!this.categories) {
      return;
    }

    const selectedCategories = this.categories
      .filter(category => category.selected && category.category)
      .map(category => category.category!);

    this.categoryFilterChanged.emit(selectedCategories);
  }

  private triggerDateFilterChanged(): void {
    const dateFilter: BillListDateFilter = {
      fromDate: this.fromDateFilter,
      untilDate: this.untilDateFilter
    }

    this.dateFilterChanged.emit(dateFilter);
  }

  private loadBillCategories() {
    this.billCategoryContextService.categories().subscribe({
      next: categories => {
        if (categories.length <= 0) {
          return;
        }

        const options: CategorySelection[] = [];

        categories.forEach(category => options.push({
          selected: this.getSelectedValue(category),
          displayName: category.name,
          category: category
        }));

        options.splice(0, 0, {
          selected: !options.some(option => option.selected),
          displayName: 'Alle'
        });

        this.categories = options;
      }
    })
  }

  private getSelectedValue(category: CategoryDto): boolean {
    if (!this.categories && this.initialCategoryFilters) {
      return this.initialCategoryFilters?.some(initialFilter => initialFilter == category.name);
    }

    return false;
  }
}
