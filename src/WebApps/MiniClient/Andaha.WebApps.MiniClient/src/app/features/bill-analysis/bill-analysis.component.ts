import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-bill-analysis',
    templateUrl: './bill-analysis.component.html',
    styleUrls: ['./bill-analysis.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon]
})
export class BillAnalysisComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}
