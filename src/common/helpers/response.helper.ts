import {
  ApiResponse,
  PaginatedApiResponse,
  PaginatedData,
} from "../interfaces/api-response.interface";

export class ResponseHelper {
  static success<T>(
    data: T,
    message: string = "Operation successful",
    heading: string = "Success",
    statusCode: number = 200
  ): ApiResponse<T> {
    return {
      statusCode,
      status: true,
      message,
      heading,
      data,
    };
  }

  static error(
    message: string = "Operation failed",
    heading: string = "Error",
    data: any = null
  ): ApiResponse<any> {
    return {
      statusCode: 400,
      status: false,
      message,
      heading,
      data,
    };
  }

  static errorWithStatus(
    statusCode: number,
    message: string = "Operation failed",
    heading: string = "Error",
    data: any = null
  ) {
    return {
      statusCode,
      status: false,
      message,
      heading,
      data,
    };
  }

  static paginated<T>(
    items: T[],
    page: number,
    limit: number,
    total: number,
    dataKey: string,
    message: string = "Data retrieved successfully",
    heading: string = "Success"
  ): PaginatedApiResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const nextPage = hasNext ? page + 1 : null;
    const prevPage = hasPrev ? page - 1 : null;

    const paginatedData: PaginatedData<T> = {
      [dataKey]: items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
        nextPage,
        prevPage,
      },
    };

    return {
      statusCode: 200,
      status: true,
      message,
      heading,
      data: paginatedData,
    };
  }
}
