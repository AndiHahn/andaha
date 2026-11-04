import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GERMAN_DATE_PROVIDERS } from 'src/app/shared/date-picker/german-date-providers';
import { MatDatepickerInput, MatDatepickerToggle, MatDatepickerToggleIcon, MatDatepicker } from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import { ShowErrorPipe } from '../../form-field/show-error.pipe';
import { PanelBackDirective } from 'src/app/core/overlay/panel-back.directive';

@Component({
    selector: 'app-date-picker-form-field',
    templateUrl: './date-picker-form-field.component.html',
    styleUrls: ['./date-picker-form-field.component.scss'],
    providers: GERMAN_DATE_PROVIDERS,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [PanelBackDirective, MatDatepickerInput, FormsModule, ReactiveFormsModule, MatDatepickerToggle, MatIcon, MatDatepickerToggleIcon, MatDatepicker, ShowErrorPipe]
})
export class DatePickerFormFieldComponent implements OnInit {

  @Input()
  control!: FormControl;

  @Input()
  label!: string;
  
  constructor(
  ) { }

  ngOnInit(): void {
  }

}
