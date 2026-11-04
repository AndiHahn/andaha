import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-budgetplan',
    templateUrl: './budgetplan.component.html',
    styleUrls: ['./budgetplan.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon]
})
export class BudgetplanComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
