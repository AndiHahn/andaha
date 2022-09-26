import { HttpParam } from "../../common-dtos/HttpParam";
import { getPagingHttpParams, PagingParameters } from "../../common-dtos/PagingParameters";

export interface SearchBillsParameters extends PagingParameters {
  search?: string;
}

export function getSearchBillsHttpParams(parameters: SearchBillsParameters): HttpParam[] {
  const pagingHttpParams = getPagingHttpParams(parameters)
  
  return [
    {
      key: 'search',
      value: parameters.search ?? ''
    }
  ].concat(pagingHttpParams);
}
