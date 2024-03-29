import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { Response } from "express";
import { ConflictError, NotFoundError } from "./app.exception";

@Catch(NotFoundError)
export class NotFoundErrorFilter implements ExceptionFilter {
  catch(error: NotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(404).json({
      statusCode: 404,
      error: error.name,
      message: error.message,
    });
  }
}

@Catch(ConflictError)
export class ConflictErrorFilter implements ExceptionFilter {
  catch(error: ConflictError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(409).json({
      statusCode: 409,
      error: error.name,
      message: error.message,
    });
  }
}
