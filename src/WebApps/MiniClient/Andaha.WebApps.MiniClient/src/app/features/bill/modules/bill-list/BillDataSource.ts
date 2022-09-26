import { CollectionViewer } from "@angular/cdk/collections";
import { DataSource } from '@angular/cdk/table';
import { BehaviorSubject, Observable } from "rxjs";
import { BillDto } from "src/app/api/shopping/dtos/BillDto";

export class BillDataSource extends DataSource<BillDto> {

  private dataStream = new BehaviorSubject<BillDto[]>([]);
  
  update(bills: BillDto[]) {
    this.dataStream.next(bills);
  }

  connect(collectionViewer: CollectionViewer): Observable<BillDto[]> {
    return this.dataStream;
  }

  disconnect(collectionViewer: CollectionViewer): void {
  }
}
