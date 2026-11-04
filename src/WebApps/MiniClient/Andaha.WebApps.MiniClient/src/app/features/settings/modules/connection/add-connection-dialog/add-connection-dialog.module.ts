import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddConnectionDialogComponent } from './add-connection-dialog.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { DialogModule } from "src/app/shared/dialog/dialog.module";
import { ShowErrorModule } from "src/app/shared/form-field/show-error.module";
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        ReactiveFormsModule,
        FormsModule,
        BrowserAnimationsModule,
        MatProgressSpinnerModule,
        DialogModule,
        ShowErrorModule,
        MatDialogModule,
        AddConnectionDialogComponent
    ],
    providers: []
})
export class AddConnectionDialogModule { }
