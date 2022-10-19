import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-category-item',
  templateUrl: './category-item.component.html',
  styleUrls: ['./category-item.component.scss']
})
export class CategoryItemComponent implements OnInit, OnChanges {

  @Input()
  editing: boolean = false;

  @Input()
  isDefault: boolean = false;

  @Input()
  categoryNameControl!: FormControl;

  @Input()
  categoryColorControl!: FormControl;

  @Output()
  deleteCategory: EventEmitter<void> = new EventEmitter();

  colors: string[];
  selectedColor: string = '';

  constructor() {
    this.colors = [
      'indigo',
      'lemonchiffon',
      'khaki',
      'darkkhaki',
      'gold',
      'yellow',
      'darksalmon',
      'indianred',
      'chocolate',
      'orange',
      'darkorange',
      'brown',
      'deeppink',
      'pink',
      'purple',
      'red',
      'darkred',
      'blueviolet',
      'darkviolet',
      'magenta',
      'darkmagenta',
      'aliceblue',
      'aquamarine',
      'cadetblue',
      'darkturquoise',
      'darkcyan',
      'aqua',
      'deepskyblue',
      'cornflowerblue',
      'blue',
      'darkblue',
      'darkseagreen',
      'darkolivegreen',
      'greenyellow',
      'chartreuse',
      'green',
      'darkgreen',
      'grey',
      'darkslategray',
      'darkgray',
    ]
  }
  
  ngOnInit(): void {
    if (!this.categoryNameControl) {
      throw new Error("Category name control is required in order to use this component");
    }

    if (!this.categoryColorControl) {
      throw new Error("Category color control is required in order to use this component");
    }

    this.selectedColor = this.categoryColorControl.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['editing'] && changes['editing'].currentValue != changes['editing'].previousValue) {
      this.refreshFormControls();
    }

    if (changes && changes['isDefault'] && changes['isDefault'].currentValue != changes['isDefault'].previousValue) {
      this.refreshFormControls();
    }
  }

  onDeleteClick(): void {
    if (this.editing && !this.isDefault) {
      this.deleteCategory.emit();
    }
  }

  private refreshFormControls() : void {
    if (this.editing && !this.isDefault) {
      this.enableFormControls();
    } else {
      this.disableFormControls();
    }
  }

  private enableFormControls(): void {
    this.categoryNameControl.enable();
    this.categoryColorControl.enable();
  }

  private disableFormControls(): void {
    this.categoryNameControl.disable();
    this.categoryColorControl.disable();
  }
}
