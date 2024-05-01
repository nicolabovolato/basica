import { Migrator } from "@basica/kysely";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";

import { Todo } from "../../src/db";
import { ConflictError, NotFoundError, TodoService } from "../../src/service";
import { getTestApp } from "../utils";

let container: StartedPostgreSqlContainer;
let app: ReturnType<typeof getTestApp>;
let todos: TodoService;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();

  app = getTestApp(container);
  await (app.services.migrations as Migrator).start();
  todos = app.deps.todos;
}, 60000);

afterEach(async () => {
  vi.clearAllMocks();
  await app.deps.db.deleteFrom("todos").execute();
});

afterAll(async () => {
  await app.deps.db.shutdown();
  await container.stop();
});

test("create/get", async () => {
  const todo = await todos.create({ title: "Todo 1", description: null });
  const found = await todos.get(todo.id);

  expect(found).toEqual(todo);
});

test("create/getAll/delete/getAll", async () => {
  const todo1 = await todos.create({ title: "Todo 1", description: null });
  await setTimeout(100);
  const todo2 = await todos.create({ title: "Todo 2", description: null });
  await setTimeout(100);
  const todo3 = await todos.create({ title: "Todo 3", description: null });

  expect(await todos.getAll(0, 10, false)).toEqual([todo3, todo2, todo1]);
  expect(await todos.getAll(0, 1, false)).toEqual([todo3]);
  expect(await todos.getAll(1, 2, false)).toEqual([todo2, todo1]);

  const deleted = await todos.delete(todo2.id, false);

  expect(await todos.getAll(0, 10, false)).toEqual([todo3, todo1]);
  expect(await todos.getAll(0, 10, true)).toEqual([todo3, deleted, todo1]);
});

test("create conflict", async () => {
  const id = randomUUID();
  const params = {
    title: "Todo 1",
    description: null,
  } satisfies Partial<Todo>;

  vi.spyOn(todos, "uuidFn").mockReturnValue(id);

  await todos.create(params);
  await expect(todos.create(params)).rejects.toBeInstanceOf(ConflictError);
});

test("create/update/get", async () => {
  const todo = await todos.create({ title: "Todo 1", description: null });

  const updated = await todos.update({
    id: todo.id,
    completed: true,
  });

  const found = await todos.get(todo.id);

  expect(found).toEqual(updated);
});

test("create/update/get", async () => {
  const todo = await todos.create({ title: "Todo 1", description: null });

  await todos.delete(todo.id, false);
  await todos.get(todo.id);
  await todos.delete(todo.id, true);

  await expect(todos.get(todo.id)).rejects.toBeInstanceOf(NotFoundError);
});
