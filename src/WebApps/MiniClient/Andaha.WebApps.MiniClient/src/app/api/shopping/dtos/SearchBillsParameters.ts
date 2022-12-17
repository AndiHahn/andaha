import { HttpParam } from "../../common-dtos/HttpParam";
import { getPagingHttpParams, PagingParameters } from "../../common-dtos/PagingParameters";

export interface SearchBillsParameters extends PagingParameters {
  search?: string;
  categoryFilter?: string[];
}

export function getSearchBillsHttpParams(parameters: SearchBillsParameters): HttpParam[] {
  return getCategoryFilterParameters(parameters.categoryFilter)
    .concat(getSearchTextFilterParameter(parameters.search ?? ''))
    .concat(getPagingHttpParams(parameters));
}

function getSearchTextFilterParameter(search: string): HttpParam {
  return {
    key: 'search',
    value: search ?? ''
  }
}

function getCategoryFilterParameters(categoryFilters?: string[]): HttpParam[] {
  const categoryFilterParameters = categoryFilters?.map(category => getCategoryFilterParameter(category));
  if (!categoryFilterParameters) {
    return [];
  }

  return categoryFilterParameters;
}

function getCategoryFilterParameter(category: string): HttpParam {
  return {
    key: 'categoryFilter',
    value: category
  }
}
