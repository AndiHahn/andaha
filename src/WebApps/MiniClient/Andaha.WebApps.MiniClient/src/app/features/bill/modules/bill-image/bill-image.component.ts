import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { ImageSnippet } from '../add-bill-image-dialog/add-bill-image-dialog.component';
import { AddBillImageDialogService } from '../add-bill-image-dialog/add-bill-image-dialog.service';
import { BillImageDialogService } from '../bill-image-dialog/bill-image-dialog.service';
import { BillImageDialogData } from '../bill-image-dialog/BillImageDialogData';

@Component({
  selector: 'app-bill-image',
  templateUrl: './bill-image.component.html',
  styleUrls: ['./bill-image.component.scss']
})
export class BillImageComponent implements OnInit {

  @Input()
  bill!: BillDto;

  @Input()
  editing: boolean = false;

  @Input()
  saving: boolean = false;

  @Output()
  imageSelected: EventEmitter<ImageSnippet> = new EventEmitter();
  
  constructor(
    private imageDialogService: BillImageDialogService,
    private addImageDialogService: AddBillImageDialogService) { }

  ngOnInit(): void {
    if (!this.bill) {
      throw new Error("Bill is required in order to use this component.");
    }
  }

  onAddImageClick(): void {
    this.addImageDialogService.openDialog().then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: image => {
          if (image) {
            this.imageSelected.emit(image);
          }
        }
      }
    ));
  }

  onShowImageClick(): void {
    const data: BillImageDialogData = {
      bill: this.bill
    };

    this.imageDialogService.openDialog(data).then(dialogRef => dialogRef.afterClosed().subscribe(
      {
        next: deleted => {
          if (deleted) {
            this.bill.imageAvailable = false;
          }
        }
      }
    ));
  }
}
