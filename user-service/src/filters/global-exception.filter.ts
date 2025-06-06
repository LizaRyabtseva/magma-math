import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ValidationError,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from './error-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(exception),
      error: exception instanceof HttpException ? exception.name : 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const validationErrors = (response as any).message;

        if (Array.isArray(validationErrors)) {
          errorResponse.details = this.formatValidationErrors(validationErrors);
        }
      }
    }

    this.logError(exception, errorResponse);

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null) {
        return (response as any).message || exception.message;
      }
      return exception.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }

  private formatValidationErrors(errors: ValidationError[]): Record<string, any> {
    const formattedErrors: Record<string, any> = {};

    errors.forEach(error => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
      if (error.children?.length) {
        formattedErrors[error.property] = this.formatValidationErrors(error.children);
      }
    });

    return formattedErrors;
  }

  private logError(exception: unknown, errorResponse: ErrorResponse): void {
    const logMessage = {
      timestamp: errorResponse.timestamp,
      path: errorResponse.path,
      method: errorResponse.method,
      statusCode: errorResponse.statusCode,
      message: errorResponse.message,
      error: errorResponse.error,
    };

    if (!(exception instanceof HttpException)) {
      this.logger.error('Unhandled exception occurred', logMessage);
    } else if (errorResponse.statusCode >= 500) {
      this.logger.error('Server error occurred', logMessage);
    } else {
      this.logger.warn('Client error occurred', logMessage);
    }
  }
}
