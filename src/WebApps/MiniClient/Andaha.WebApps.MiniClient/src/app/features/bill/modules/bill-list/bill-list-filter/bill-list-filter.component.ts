import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { distinctUntilChanged, debounceTime, tap } from 'rxjs/operators';

@Component({
  selector: 'app-bill-list-filter',
  templateUrl: './bill-list-filter.component.html',
  styleUrls: ['./bill-list-filter.component.scss']
})
export class BillListFilterComponent implements OnInit, AfterViewInit {
  @ViewChild('searchTerm') searchInput!: ElementRef;
  
  @Input()
  deactivate: boolean = false;
  
  @Output()
  triggerLoading = new EventEmitter<string>();

  isLoading: boolean = false;
  searchBoxKeyup = new EventEmitter<string>();
  
  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.searchBoxKeyup.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((searchText) => this.triggerLoading.next(searchText))
    ).subscribe();
  }

  searchBoxKeyDown(event: any) {
    event.stopImmediatePropagation();
  }

  onClearSearch(): void {
    this.searchInput.nativeElement.value = '';
    this.triggerLoading.next('');
  }
}
