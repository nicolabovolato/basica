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
  constructor(
    readonly db: Kysely<Database>,
    readonly uuidFn = randomUUID as () => string,
    readonly nowFn = () => new Date()
  ) {}

  async getAll(offset: number, limit: number, showDeleted: boolean) {
    let query = this.db
      .selectFrom("todos")
      .selectAll()
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit);

    if (!showDeleted) {
      query = query.where("deleted_at", "is", null);
    }

    return await query.execute();
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
    const id = this.uuidFn();
    const now = this.nowFn().toISOString();

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
      throw err;
    }
  }

  async update(
    todo: Pick<Todo, "id"> &
      Omit<UpdatedTodo, "id" | "created_at" | "updated_at">
  ) {
    const now = this.nowFn().toISOString();

    return await this.db
      .updateTable("todos")
      .set({ ...todo, updated_at: now })
      .where("id", "=", todo.id)
      .returningAll()
      .executeTakeFirstOrThrow(
        () => new NotFoundError(`Todo ${todo.id} not found`)
      );
  }

  async delete(id: Todo["id"], forceDelete: boolean) {
    if (!forceDelete) {
      return await this.update({ id, deleted_at: this.nowFn().toISOString() });
    }

    return await this.db
      .deleteFrom("todos")
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow(() => new NotFoundError(`Todo ${id} not found`));
  }
}
