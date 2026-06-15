export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GenericPaginatedResponse<T> {
  data: T[];
  metadata: PaginationMeta;
}
