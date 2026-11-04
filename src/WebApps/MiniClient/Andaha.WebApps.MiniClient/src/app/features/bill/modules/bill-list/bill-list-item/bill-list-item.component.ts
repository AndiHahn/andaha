import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';
import { NgTemplateOutlet, DecimalPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bill-list-item',
    templateUrl: './bill-list-item.component.html',
    styleUrls: ['./bill-list-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgTemplateOutlet, MatIcon, DecimalPipe, DatePipe]
})
export class BillListItemComponent implements OnInit {

  @Input()
  bill!: BillDto;
  
  constructor() { }

  ngOnInit(): void {
    if (!this.bill) {
      throw new Error("Bill is required in order to use this component");
    }
  }

}
