import { Kysely } from "kysely";
import { DatabaseError } from "pg";
import { randomUUID } from "crypto";

import { Database, NewTodo, Todo, UpdatedTodo } from "./db";

export class NotFoundError extends Error {
  name = "NotFoundError";
}
export class ConflictError extends Error {
  name = "ConflictError";
}

export class TodoService {
  constructor(readonly db: Kysely<Database>) {}

  async getAll() {
    return await this.db
      .selectFrom("todos")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();
  }

  async get(id: Todo["id"]) {
    return await this.db
      .selectFrom("todos")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow(() => new NotFoundError(`Todo ${id} not found`));
  }

  async create(
    todo: Omit<NewTodo, "id" | "completed" | "created_at" | "updated_at">
  ) {
    const id = randomUUID();
    const now = new Date().toISOString();

    try {
      return await this.db
        .insertInto("todos")
        .values({
          ...todo,
          id,
          completed: false,
          created_at: now,
          updated_at: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } catch (err) {
      if (err instanceof DatabaseError && err.code == "23505") {
        throw new ConflictError(`Todo ${id} already exists`);
      }
    }
  }

  async update(
    todo: Pick<Todo, "id"> &
      Omit<UpdatedTodo, "id" | "created_at" | "updated_at">
  ) {
    const now = new Date().toISOString();

    return await this.db
      .updateTable("todos")
      .set({ ...todo, updated_at: now })
      .where("id", "=", todo.id)
      .returningAll()
      .executeTakeFirstOrThrow(
        () => new NotFoundError(`Todo ${todo.id} not found`)
      );
  }

  async delete(id: Todo["id"]) {
    return await this.db
      .deleteFrom("todos")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow(() => new NotFoundError(`Todo ${id} not found`));
  }
}
