import { ExceptionFilter, Catch, ArgumentsHost } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { ConflictError, NotFoundError } from "./app.exception";

@Catch(NotFoundError)
export class NotFoundErrorFilter implements ExceptionFilter {
  catch(error: NotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    response.status(404).send({
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
    const response = ctx.getResponse<FastifyReply>();

    response.status(409).send({
      statusCode: 409,
      error: error.name,
      message: error.message,
    });
  }
}
