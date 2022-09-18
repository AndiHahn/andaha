import { Component, Input, OnInit } from '@angular/core';
import { BillDto } from 'src/app/api/shopping/models/BillDto';

@Component({
  selector: 'app-bill-list-item',
  templateUrl: './bill-list-item.component.html',
  styleUrls: ['./bill-list-item.component.scss']
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
