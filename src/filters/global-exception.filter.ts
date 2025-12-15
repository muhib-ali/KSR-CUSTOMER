import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ResponseHelper } from "../common/helpers/response.helper";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object") {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        method: request.method,
        url: request.url,
        userAgent: request.get("user-agent"),
        ip: request.ip,
        userId: (request as any).user?.id,
      }
    );

    // Determine heading based on request path
    const heading = this.getHeadingFromPath(request.url);

    // Create standardized error response using ResponseHelper
    const errorResponse = ResponseHelper.errorWithStatus(
      status,
      message,
      heading,
      null
    );

    response.status(status).json(errorResponse);
  }

  private getHeadingFromPath(path: string): string {
    // Extract module name from path
    if (path.includes("/auth/")) {
      return "Authentication";
    } else if (path.includes("/roles/")) {
      return "Role";
    } else if (path.includes("/users/")) {
      return "User";
    } else if (path.includes("/health")) {
      return "Health";
    } else {
      return "Error";
    }
  }
}
