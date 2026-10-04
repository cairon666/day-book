import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost(): { host: ArgumentsHost; json: ReturnType<typeof vi.fn>; status: ReturnType<typeof vi.fn> } {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, json, status };
}

describe('AllExceptionsFilter', () => {
  it('форматирует HttpException со строковым телом', () => {
    const filter = new AllExceptionsFilter();
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('Запись не найдена'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'Запись не найдена',
      error: 'Not Found',
    });
  });

  it('склеивает массив message (формат валидации) в одну строку', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = createHost();

    filter.catch(new BadRequestException(['поле a невалидно', 'поле b невалидно']), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'поле a невалидно; поле b невалидно',
      }),
    );
  });

  it('не раскрывает детали неизвестного исключения (500 без стектрейса)', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = createHost();
    const boom = new Error('secret SQL: select * from users');

    filter.catch(boom, host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
    const payload = JSON.stringify(json.mock.calls[0][0]);
    expect(payload).not.toContain('secret');
    expect(payload).not.toContain('stack');
  });

  it('обрабатывает не-Error значения (например, строку)', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = createHost();

    filter.catch('что-то упало', host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' }),
    );
  });
});
