import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AreaTabsComponent } from 'src/app/core/navigation/area-tabs/area-tabs.component';
import { navArea } from 'src/app/core/navigation/nav-areas';

@Component({
    selector: 'app-work',
    templateUrl: './work.component.html',
    styleUrls: ['./work.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, AreaTabsComponent]
})
export class WorkComponent {
  readonly area = navArea('work');
}
