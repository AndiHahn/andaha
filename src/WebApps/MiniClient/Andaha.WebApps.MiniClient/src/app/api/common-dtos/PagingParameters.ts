import { HttpParam } from "./HttpParam";

export interface PagingParameters {
  pageSize: number;
  pageIndex: number;
}

export function getPagingHttpParams(pagingParams: PagingParameters): HttpParam[] {
  return [
    {
      key: 'pageSize',
      value: pagingParams.pageSize.toString()
    },
    {
      key: 'pageIndex',
      value: pagingParams.pageIndex.toString()
    }
  ];
}
