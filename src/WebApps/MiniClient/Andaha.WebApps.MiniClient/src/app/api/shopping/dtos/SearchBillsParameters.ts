import * as moment from "moment";
import { HttpParam } from "../../common-dtos/HttpParam";
import { getPagingHttpParams, PagingParameters } from "../../common-dtos/PagingParameters";

export interface SearchBillsParameters extends PagingParameters {
  search?: string;
  categoryFilter?: string[];
  fromDateFilter?: Date;
  untilDateFilter?: Date;
}

export function getSearchBillsHttpParams(parameters: SearchBillsParameters): HttpParam[] {
  return getCategoryFilterParameters(parameters.categoryFilter)
    .concat(getSearchTextFilterParameter(parameters.search ?? ''))
    .concat(getPagingHttpParams(parameters))
    .concat(getDateFilterParameter('fromDateFilter', parameters.fromDateFilter))
    .concat(getDateFilterParameter('untilDateFilter',parameters.untilDateFilter));
}

function getSearchTextFilterParameter(search?: string): HttpParam[] {
  if (!search) {
    return [];
  }

  return [{
    key: 'search',
    value: search ?? ''
  }];
}

function getDateFilterParameter(paramKey: string, date?: Date): HttpParam[] {
  if (!date) {
    return [];
  }

  return [
    {
      key: paramKey,
      value: moment(date).format('YYYY-MM-DD')
    }
  ];
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
