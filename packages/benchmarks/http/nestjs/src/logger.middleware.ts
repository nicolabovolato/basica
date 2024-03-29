import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, path, httpVersion } = request;
    const time = new Date();

    response.on("finish", () => {
      const contentLength = response.get("Content-Length") ?? 0;
      const { statusCode } = response;
      this.logger.log(
        `${ip} - - [${time.toISOString()}] "${method} ${path} HTTP/${httpVersion}" ${statusCode} ${contentLength}`
      );
    });

    next();
  }
}
