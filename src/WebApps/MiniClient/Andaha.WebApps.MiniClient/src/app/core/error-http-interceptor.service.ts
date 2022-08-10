import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHttpInterceptor implements HttpInterceptor {

  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      tap(
        (_: HttpEvent<any>) => {
        },
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            throwError(() => new Error(err.error));
          }
        }
      )
    )
  }
}
