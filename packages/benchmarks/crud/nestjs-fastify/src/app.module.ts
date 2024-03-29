import { APP_FILTER, APP_PIPE } from "@nestjs/core";
import { MiddlewareConsumer, Module, ValidationPipe } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import * as joi from "joi";
import { TodosModule } from "./todos/todos.module";
import {
  ConflictErrorFilter,
  NotFoundErrorFilter,
} from "./http-exception.filter";

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: joi.object({
        DB_CONNECTIONSTRING: joi.string().required(),
        DB_CONNECTIONTIMEOUTMILLIS: joi.number().required(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get("DB_CONNECTIONSTRING"),
        connectTimeoutMS: configService.get("DB_CONNECTIONTIMEOUTMILLIS"),
        logging: ["schema", "error", "warn", "info", "log", "migration"],
        autoLoadEntities: true,
        migrations: [__dirname + "/../migrations/*.js"],
        migrationsRun: true,
      }),
    }),
    TodosModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ConflictErrorFilter,
    },
  ],
})
export class AppModule {}
