import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { CategoryForm, createSubCategoryForm, SubCategoryForm } from '../functions/form-functions';

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
  categoryForm!: FormGroup<CategoryForm>;

  @Output()
  deleteCategory: EventEmitter<void> = new EventEmitter();

  colors: string[];
  selectedColor: string = '';

  subCategoryForms!: FormArray<FormGroup<SubCategoryForm>>;

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
    if (!this.categoryForm) {
      throw new Error("CategoryForm is required in order to use this component");
    }

    this.subCategoryForms = this.categoryForm.controls.subCategories;

    this.selectedColor = this.categoryForm.controls.color.value;
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

  onDeleteSubCategoryClick(index: number): void {
    if (!this.editing) {
      return;
    }

    this.subCategoryForms.removeAt(index);
  }

  onAddSubCategoryClick(): void {
    this.subCategoryForms.push(createSubCategoryForm(''));
  }

  drop(event: CdkDragDrop<string[]>) {
    if (!this.subCategoryForms) {
      return;
    }
    
    const movedItem = this.subCategoryForms.at(event.previousIndex);
    this.subCategoryForms.removeAt(event.previousIndex);
    this.subCategoryForms.insert(event.currentIndex, movedItem);
  }

  private refreshFormControls() : void {
    if (this.editing && !this.isDefault) {
      this.enableFormControls();
    } else {
      this.disableFormControls();
    }
  }

  private enableFormControls(): void {
    this.categoryForm.enable();
  }

  private disableFormControls(): void {
    this.categoryForm.disable();
  }
}
