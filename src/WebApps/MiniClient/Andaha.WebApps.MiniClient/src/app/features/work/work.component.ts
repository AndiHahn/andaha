import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class WorkComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
