import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-user-data',
    templateUrl: './user-data.component.html',
    styleUrls: ['./user-data.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager
})
export class UserDataComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
