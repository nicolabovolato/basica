const time = process.hrtime();

import fs from "fs/promises";
import path from "path";

import fastify from "fastify";
import {
  FileMigrationProvider,
  Kysely,
  Migrator,
  PostgresDialect,
} from "kysely";
import { Pool } from "pg";

import { ConflictError, NotFoundError, TodoService } from "./service";
import { Database } from "./db";
import { routes } from "./routes";

const connectionString = process.env.DB_CONNECTIONSTRING;
const connectionTimeoutMillis = Number(process.env.DB_CONNECTIONTIMEOUTMILLIS);

if (!connectionString) {
  throw new Error("Missing DB_CONNECTIONSTRING");
}
if (Number.isNaN(connectionTimeoutMillis)) {
  throw new Error("Missing DB_CONNECTIONTIMEOUTMILLIS");
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString,
      connectionTimeoutMillis,
    }),
  }),
});

const service = new TodoService(db);

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: __dirname + "/../migrations",
  }),
});

const server = fastify({ logger: true }).register(async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof NotFoundError) {
      return reply.status(404).send({
        statusCode: 404,
        error: error.name,
        message: error.message,
      });
    }
    if (error instanceof ConflictError) {
      return reply.status(409).send({
        statusCode: 409,
        error: error.name,
        message: error.message,
      });
    }
    throw error;
  });

  fastify.register(routes(service));
});

migrator.migrateToLatest().then(() =>
  server.listen({ port: 8080, host: "0.0.0.0" }).then(() => {
    const diff = process.hrtime(time);
    const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
    console.log(`STARTUP_TIME: ${ms}ms`);
  })
);
