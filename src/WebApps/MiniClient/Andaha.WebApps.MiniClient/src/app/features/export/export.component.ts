import { Component, OnInit } from '@angular/core';
import { ExpenseContextService } from '../bill/services/expense-context.service';

@Component({
  selector: 'app-export',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {

  isExporting: boolean = false;

  constructor(private expenseContextService: ExpenseContextService) { }

  ngOnInit(): void {
  }

  onExportExpensesClick() {
    this.isExporting = true;

    this.expenseContextService.downloadExpenses().subscribe(
      {
        next: _ => this.isExporting = false,
        error: _ => this.isExporting = false
      }
    );
  }
  
}
