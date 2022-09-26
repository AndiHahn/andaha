import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BillContextService } from 'src/app/services/bill-context.service';
import { BillOptionsDialogData } from './BillOptionsDialogData';

@Component({
  selector: 'app-bill-options-dialog',
  templateUrl: './bill-options-dialog.component.html',
  styleUrls: ['./bill-options-dialog.component.scss']
})
export class BillOptionsDialogComponent implements OnInit {

  isDeleting: boolean = false;

  constructor(
    private billContextService: BillContextService,
    private dialogRef: MatDialogRef<BillOptionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: BillOptionsDialogData 
  ) { }

  ngOnInit(): void {
  }

  onDeleteClick(): void {
    this.isDeleting = true;

    this.billContextService.deleteBill(this.data.billId).subscribe(
      {
        next: _ => {
          this.dialogRef.close(true);
          this.isDeleting = false;
        },
        error: _ => this.isDeleting = false
      }
    );
  }
}
