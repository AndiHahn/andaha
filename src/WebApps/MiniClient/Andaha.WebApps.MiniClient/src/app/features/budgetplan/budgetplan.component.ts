import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-budgetplan',
  templateUrl: './budgetplan.component.html',
  styleUrls: ['./budgetplan.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class BudgetplanComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
