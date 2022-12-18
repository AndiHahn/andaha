import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatChip } from '@angular/material/chips';
import { distinctUntilChanged, debounceTime, tap } from 'rxjs/operators';
import { BillCategoryDto } from 'src/app/api/shopping/dtos/BillCategoryDto';
import { BillCategoryContextService } from 'src/app/services/bill-category-context.service';
import { BillListFilterDialogService } from './bill-list-filter-dialog/bill-list-filter-dialog.service';
import { BillListFilterDialogData } from './bill-list-filter-dialog/BillListFilterDialogData';
import { BillListDateFilter } from './BillListDateFilter';

interface CategorySelection {
  selected: boolean;
  displayName: string;
  category?: BillCategoryDto;
}

@Component({
  selector: 'app-bill-list-filter',
  templateUrl: './bill-list-filter.component.html',
  styleUrls: ['./bill-list-filter.component.scss']
})
export class BillListFilterComponent implements OnInit, AfterViewInit {
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
  categoryFilterChanged = new EventEmitter<BillCategoryDto[]>();

  @Output()
  dateFilterChanged = new EventEmitter<BillListDateFilter>();

  isLoading: boolean = false;
  searchBoxKeyup = new EventEmitter<string>();

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
  }

  ngAfterViewInit(): void {
    this.searchBoxKeyup.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((searchText) => this.searchTextChanged.next(searchText))
    ).subscribe();
  }

  searchBoxKeyDown(event: any) {
    event.stopImmediatePropagation();
  }

  onClearSearch(): void {
    this.searchInput.nativeElement.value = '';
    this.searchTextChanged.next('');
  }

  onFilterClick(): void {
    const data: BillListFilterDialogData = {
      from: this.fromDateFilter,
      until: this.untilDateFilter
    };

    this.billListFilterDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: result => {
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

  onChipClick(chip: MatChip, newSelectedValue: boolean, index: number): void {
    if (!this.categories) {
      return;
    }
    
    // chip 'Alle' clicked
    if (index == 0) {
      if (newSelectedValue) {
        // deselect all other chips
        chip.select();
        this.categories[index].selected = true;

        const selectedCategoriesWithoutAllSelection = this.categories.slice(1);
        selectedCategoriesWithoutAllSelection.forEach(category => category.selected = false);

        this.triggerCategorySelection();

        return;
      }

      // if 'Alle' is deselected -> do nothing
      return;
    }

    if (this.categories[index].selected) {
      chip.deselect();
    } else {
      chip.select();
    }

    this.categories[index].selected = newSelectedValue;

    const selectedCategoriesWithoutAllSelection = this.categories.slice(1);
    const anySelected = selectedCategoriesWithoutAllSelection.some(category => category.selected);
    this.categories[0].selected = !anySelected;

    this.triggerCategorySelection();
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

  private getSelectedValue(category: BillCategoryDto): boolean {
    if (!this.categories && this.initialCategoryFilters) {
      return this.initialCategoryFilters?.some(initialFilter => initialFilter == category.name);
    }

    return false;
  }
}
