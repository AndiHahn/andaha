import { HttpParams } from "@angular/common/http";
import { HttpParam } from "../common-dtos/HttpParam";

export function createHttpParameters(params: HttpParam[]): HttpParams {
  let httpParameters = new HttpParams();
  
  params.forEach(param => httpParameters = httpParameters.append(param.key, param.value));

  return httpParameters;
}
