import { CollectionViewer } from "@angular/cdk/collections";
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable } from "rxjs";
import { BillAnalyzedDto } from 'src/app/api/shopping/dtos/BillAnalyzedDto';

export class AnalyzedBillDataSource extends DataSource<BillAnalyzedDto> {
  private dataStream = new BehaviorSubject<BillAnalyzedDto[]>([]);

  update(bills: BillAnalyzedDto[]) {
    this.dataStream.next(bills);
  }

  connect(collectionViewer: CollectionViewer): Observable<BillAnalyzedDto[]> {
    return this.dataStream;
  }

  disconnect(collectionViewer: CollectionViewer): void {}
}
