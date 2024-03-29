import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Observable } from "rxjs";
import { switchMap } from "rxjs/operators";

@Injectable()
export class ResponseValidationInterceptor<T extends object>
  implements NestInterceptor<unknown, T>
{
  private logger = new Logger("ResponseValidationInterceptor");
  constructor(private readonly dto: new () => T) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      switchMap(async (data) => {
        const transformedData = plainToInstance(
          this.dto,
          instanceToPlain(data)
        );
        const errors = await validate(transformedData);

        if (errors.length > 0) {
          this.logger.error("Invalid data", errors);
          throw new InternalServerErrorException();
        }
        return transformedData;
      })
    );
  }
}
