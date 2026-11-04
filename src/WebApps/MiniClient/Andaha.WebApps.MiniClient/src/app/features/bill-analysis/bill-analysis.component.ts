import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-bill-analysis',
  templateUrl: './bill-analysis.component.html',
  styleUrls: ['./bill-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class BillAnalysisComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}
