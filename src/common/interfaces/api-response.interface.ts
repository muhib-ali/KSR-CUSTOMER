export interface ApiResponse<T = any> {
  statusCode: number;
  status: boolean;
  message: string;
  heading: string;
  data: T;
}

export interface PaginatedData<T = any> {
  [key: string]:
    | T[]
    | {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
        nextPage: number | null;
        prevPage: number | null;
      };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

export interface PaginatedApiResponse<T = any>
  extends ApiResponse<PaginatedData<T>> {}
