export interface PagedResultDto<T> {
  values: T[];
  totalCount: number;
}
