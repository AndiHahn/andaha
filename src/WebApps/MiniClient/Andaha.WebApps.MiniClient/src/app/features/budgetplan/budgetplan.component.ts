import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AreaTabsComponent } from 'src/app/core/navigation/area-tabs/area-tabs.component';
import { navArea } from 'src/app/core/navigation/nav-areas';
import { TabSwipeDirective } from 'src/app/core/navigation/tab-swipe.directive';

@Component({
    selector: 'app-budgetplan',
    templateUrl: './budgetplan.component.html',
    styleUrls: ['./budgetplan.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, AreaTabsComponent, TabSwipeDirective]
})
export class BudgetplanComponent {
  readonly area = navArea('budgetplan');
}
