import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-color-item',
  templateUrl: './color-item.component.html',
  styleUrls: ['./color-item.component.scss']
})
export class ColorItemComponent implements OnInit {

  @Input()
  color!: string;

  constructor() { }

  ngOnInit(): void {
    if (!this.color) {
      throw new Error('Color must be provided in order to use this component.');
    }
  }

}
