import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-worktime',
  templateUrl: './worktime.component.html',
  styleUrls: ['./worktime.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class WorktimeComponent implements OnInit {

  

  constructor() { }

  ngOnInit(): void {
  }

}
