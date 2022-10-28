import { HttpParams } from "@angular/common/http";
import { HttpParam } from "../common-dtos/HttpParam";

export function createHttpParameters(params: HttpParam[]): HttpParams {
  let httpParameters = new HttpParams();
  
  params.forEach(param => httpParameters = httpParameters.append(param.key, param.value));

  return httpParameters;
}

export function generateGuid() : string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
