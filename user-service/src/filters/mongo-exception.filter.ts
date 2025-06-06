import {
  ExceptionFilter,
  Catch,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { MongoServerError } from 'mongodb';

enum MongoErrorCode {
  DuplicateKey = 11000,
  DocumentValidation = 121,
  UnauthorizedAccess = 13,
  AuthenticationFailed = 18,
}

@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoServerError) {
    switch (exception.code) {
      case MongoErrorCode.DuplicateKey:
        const field = Object.keys(exception.keyPattern || {})[0];
        const value = exception.keyValue?.[field];
        this.logger.warn(`Duplicate key error on field "${field}" with value "${value}"`);

        throw new ConflictException(`Record with ${field} "${value}" already exists`);

      case MongoErrorCode.DocumentValidation:
        this.logger.warn('Document validation failed', exception.errmsg);

        throw new BadRequestException('Invalid data provided', { cause: exception.errmsg });

      case MongoErrorCode.UnauthorizedAccess:
        this.logger.error('MongoDB unauthorized access');

        throw new InternalServerErrorException('MongoDB access error', {
          cause: 'Unauthorized access',
        });

      case MongoErrorCode.AuthenticationFailed:
        this.logger.error('MongoDB authentication failed');

        throw new InternalServerErrorException('MongoDB authentication error', {
          cause: 'Authentication failed',
        });

      default:
        this.logger.error(`MongoDB error occurred: ${exception.code}`, {
          code: exception.code,
          message: exception.message,
          stack: exception.stack,
        });

        throw new InternalServerErrorException('MongoDB error occurred', {
          cause: exception.message,
        });
    }
  }
}
