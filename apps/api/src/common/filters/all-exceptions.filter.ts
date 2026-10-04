import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorPayload {
  statusCode: number;
  message: string;
  error: string;
}

/**
 * Единый JSON-формат ошибок: { statusCode, message, error }.
 * Необработанные исключения логируются целиком, но наружу отдаётся
 * только общий текст — без стектрейсов и внутренних деталей.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const payload = this.normalize(exception);

    if (payload.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception: ${String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(payload.statusCode).json(payload);
  }

  private normalize(exception: unknown): ErrorPayload {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        return { statusCode, message: body, error: exception.name };
      }

      const record = (body ?? {}) as Record<string, unknown>;
      const rawMessage = record.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.map(String).join('; ')
        : String(rawMessage ?? exception.message);

      return {
        statusCode,
        message,
        error: String(record.error ?? exception.name),
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }
}
