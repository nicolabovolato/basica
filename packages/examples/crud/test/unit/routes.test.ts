import { FastifyEntrypoint } from "@basica/fastify";
import { randomUUID } from "crypto";
import { afterEach } from "node:test";
import { beforeAll, expect, test, vi } from "vitest";
import { Todo } from "../../src/db";
import { ConflictError, NotFoundError } from "../../src/service";
import { getTestApp } from "../utils";

const app = getTestApp();
const todos = app.deps.todos;
const fastify = (app.entrypoints.http as FastifyEntrypoint).fastify;

beforeAll(async () => {
  await fastify.ready();
});

afterEach(async () => {
  vi.clearAllMocks();
});

test("GET /todos - 200", async () => {
  const result: Todo[] = [
    {
      id: randomUUID(),
      title: "Todo 1",
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      description: null,
    },
  ];

  const spy = vi.spyOn(todos, "getAll").mockResolvedValueOnce(result);

  const response = await fastify.inject({
    method: "GET",
    url: "/todos",
    query: {
      offset: "0",
      limit: "10",
      showDeleted: "false",
    },
  });

  expect(response.statusCode).toEqual(200);
  expect(response.json()).toEqual(result);
  expect(spy).toHaveBeenCalledWith(0, 10, false);
});

test("GET /todos/:id - 200", async () => {
  const result: Todo = {
    id: randomUUID(),
    title: "Todo 1",
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    description: null,
  };

  const spy = vi.spyOn(todos, "get").mockResolvedValueOnce(result);

  const response = await fastify.inject({
    method: "GET",
    url: "/todos/" + result.id,
  });

  expect(response.statusCode).toEqual(200);
  expect(response.json()).toEqual(result);
  expect(spy).toHaveBeenCalledWith(result.id);
});

test("GET /todos/:id - 404", async () => {
  const id = randomUUID();

  const spy = vi.spyOn(todos, "get").mockRejectedValueOnce(new NotFoundError());

  const response = await fastify.inject({
    method: "GET",
    url: "/todos/" + id,
  });

  expect(response.statusCode).toEqual(404);
  expect(spy).toHaveBeenCalledWith(id);
});

test("POST /todos - 201", async () => {
  const request = {
    title: "Todo 1",
    description: null,
  } satisfies Partial<Todo>;

  const result: Todo = {
    ...request,
    id: randomUUID(),
    completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const spy = vi.spyOn(todos, "create").mockResolvedValueOnce(result);

  const response = await fastify.inject({
    method: "POST",
    url: "/todos",
    body: request,
  });

  expect(response.statusCode).toEqual(201);
  expect(response.json()).toEqual(result);
  expect(spy).toHaveBeenCalledWith(request);
});

test("POST /todos - 409", async () => {
  const request = {
    title: "Todo 1",
    description: null,
  } satisfies Partial<Todo>;

  const spy = vi
    .spyOn(todos, "create")
    .mockRejectedValueOnce(new ConflictError());

  const response = await fastify.inject({
    method: "POST",
    url: "/todos",
    body: request,
  });

  expect(response.statusCode).toEqual(409);
  expect(spy).toHaveBeenCalledWith(request);
});

test("PUT /todos/:id - 200", async () => {
  const request = {
    title: "Todo 1",
    description: null,
    completed: true,
  } satisfies Partial<Todo>;

  const result: Todo = {
    ...request,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const spy = vi.spyOn(todos, "update").mockResolvedValueOnce(result);

  const response = await fastify.inject({
    method: "PUT",
    url: "/todos/" + result.id,
    body: request,
  });

  expect(response.statusCode).toEqual(200);
  expect(response.json()).toEqual(result);
  expect(spy).toHaveBeenCalledWith({ ...request, id: result.id });
});

test("PUT /todos/:id - 404", async () => {
  const id = randomUUID();
  const request = {
    title: "Todo 1",
    description: null,
    completed: true,
  } satisfies Partial<Todo>;

  const spy = vi
    .spyOn(todos, "update")
    .mockRejectedValueOnce(new NotFoundError());

  const response = await fastify.inject({
    method: "PUT",
    url: "/todos/" + id,
    body: request,
  });

  expect(response.statusCode).toEqual(404);
  expect(spy).toHaveBeenCalledWith({ ...request, id });
});

test("DELETE /todos/:id - 200", async () => {
  const result: Todo = {
    title: "Todo 1",
    description: null,
    completed: true,
    id: randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const spy = vi.spyOn(todos, "delete").mockResolvedValueOnce(result);

  const response = await fastify.inject({
    method: "DELETE",
    url: "/todos/" + result.id,
    query: {
      forceDelete: "true",
    },
  });

  expect(response.statusCode).toEqual(200);
  expect(response.json()).toEqual(result);
  expect(spy).toHaveBeenCalledWith(result.id, true);
});

test("DELETE /todos/:id - 404", async () => {
  const id = randomUUID();

  const spy = vi
    .spyOn(todos, "delete")
    .mockRejectedValueOnce(new NotFoundError());

  const response = await fastify.inject({
    method: "DELETE",
    url: "/todos/" + id,
    query: {
      forceDelete: "true",
    },
  });

  expect(response.statusCode).toEqual(404);
  expect(spy).toHaveBeenCalledWith(id, true);
});
