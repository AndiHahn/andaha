import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';
import { AnalyzedBillContextService } from '../../services/analyzed-bill-context.service';
import { getParametersFromRouteRecursive } from 'src/app/shared/utils/routing-helper';

@Component({
  selector: 'app-analyzed-bill-details',
  templateUrl: './analyzed-bill-details.component.html',
  styleUrls: ['./analyzed-bill-details.component.scss']
})
export class AnalyzedBillDetailsComponent implements OnInit, OnDestroy {
  bill!: BillAnalyzedDto;
  isLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analyzedContext: AnalyzedBillContextService
  ) {
    const params = getParametersFromRouteRecursive(this.route.snapshot);
    const billId = params['id'];
    if (!billId) {
      throw new Error('No billId available.');
    }

    const bill = this.analyzedContext.getBillById ? this.analyzedContext.getBillById(billId) : undefined;
    if (!bill) {
      // if not available in context, we still show an error for now
      throw new Error('Analyzed bill with id: ' + billId + ' is not available.');
    }

    this.bill = bill;
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
