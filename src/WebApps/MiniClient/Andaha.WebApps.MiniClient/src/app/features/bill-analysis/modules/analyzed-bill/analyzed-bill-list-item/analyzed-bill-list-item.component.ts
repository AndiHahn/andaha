import { Component, Input, OnInit } from '@angular/core';
import { BillDto } from 'src/app/api/shopping/dtos/BillDto';

@Component({
  selector: 'app-analyzed-bill-list-item',
  templateUrl: './analyzed-bill-list-item.component.html',
  styleUrls: ['./analyzed-bill-list-item.component.scss']
})
export class AnalyzedBillListItemComponent implements OnInit {

  @Input()
  bill!: BillDto;
  
  constructor() { }

  ngOnInit(): void {
    if (!this.bill) {
      throw new Error("Bill is required in order to use this component");
    }
  }

}
