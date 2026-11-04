import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { PersonForm, getEmptyPersonForm } from '../../../functions/person-form-functions';
import { FormGroup, FormGroupDirective, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonContextService } from '../../../services/person-context.service';
import { CreatePersonDto } from 'src/app/api/work/dtos/CreatePersonDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ShowErrorPipe } from '../../../../../shared/form-field/show-error.pipe';

@Component({
    selector: 'app-add-person',
    templateUrl: './add-person.component.html',
    styleUrls: ['./add-person.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FormsModule, ReactiveFormsModule, MatIcon, MatProgressSpinner, ShowErrorPipe]
})
export class AddPersonComponent implements OnInit {
  private snackbar = inject(MatSnackBar);
  private router = inject(Router);
  private personContextService = inject(PersonContextService);

  
  form: FormGroup<PersonForm>;

  isSaving: boolean = false;
  
  constructor() {
    this.form = getEmptyPersonForm();
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isSaving = true;

    const dto = this.createDtoFromForm();

    this.personContextService.createPerson(dto).subscribe(
      {
        next: _ => {
          this.isSaving = false;
          this.router.navigateByUrl('work/person')
        },
        error: _ => {
          this.isSaving = false;
          openErrorSnackbar('Eintrag konnte nicht gespeichert werden.', this.snackbar);
        } 
      }
    );
  }

  private createDtoFromForm(): CreatePersonDto {
    const controls = this.form.controls;

    return {
      name: controls.name.value,
      hourlyRate: controls.hourlyRate.value,
      notes: controls.notes?.value ?? undefined
    }
  }
}
