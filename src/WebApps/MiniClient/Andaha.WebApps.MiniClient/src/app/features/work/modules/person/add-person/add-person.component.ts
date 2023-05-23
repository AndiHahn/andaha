import { Component, OnInit } from '@angular/core';
import { PersonForm, getEmptyForm } from '../../../functions/person-form-functions';
import { FormGroup, FormGroupDirective } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PersonContextService } from '../../../services/person-context.service';
import { CreatePersonDto } from 'src/app/api/work/dtos/CreatePersonDto';
import { openErrorSnackbar } from 'src/app/shared/snackbar/snackbar-functions';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-person',
  templateUrl: './add-person.component.html',
  styleUrls: ['./add-person.component.scss']
})
export class AddPersonComponent implements OnInit {
  
  form: FormGroup<PersonForm>;

  isSaving: boolean = false;
  
  constructor(
    private snackbar: MatSnackBar,
    private router: Router,
    private personContextService: PersonContextService
  ) {
    this.form = getEmptyForm();
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
