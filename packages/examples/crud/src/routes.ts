import { TodoService } from "./service";
import {
  FastifyPluginAsyncTypebox,
  Type,
} from "@fastify/type-provider-typebox";

const todo = Type.Object({
  id: Type.String({ format: "uuid" }),
  title: Type.String({ minLength: 0 }),
  description: Type.Union([Type.String({ minLength: 0 }), Type.Null()]),
  completed: Type.Boolean(),
  created_at: Type.String({ format: "date-time" }),
  updated_at: Type.String({ format: "date-time" }),
  deleted_at: Type.Union([Type.String({ format: "date-time" }), Type.Null()]),
});

const updateableTodo = Type.Omit(todo, [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
]);

const insertableTodo = Type.Omit(updateableTodo, ["completed"]);

const pathParams = Type.Object({
  id: Type.Index(todo, Type.Literal("id")),
});

const getAllQueryParams = Type.Object({
  offset: Type.Number({ default: 0 }),
  limit: Type.Number({ default: 20 }),
  showDeleted: Type.Boolean({ default: false }),
});

const deleteQueryParams = Type.Object({
  forceDelete: Type.Boolean({ default: false }),
});

export const routes =
  (service: TodoService): FastifyPluginAsyncTypebox =>
  async (fastify) => {
    fastify.get(
      "/todos",
      {
        schema: {
          querystring: getAllQueryParams,
          response: {
            200: Type.Array(todo),
          },
        },
      },
      async (request) => {
        return await service.getAll(
          request.query.offset,
          request.query.limit,
          request.query.showDeleted
        );
      }
    );

    fastify.get(
      "/todos/:id",
      {
        schema: {
          params: pathParams,
          response: {
            200: todo,
          },
        },
      },
      async (request) => {
        return await service.get(request.params.id);
      }
    );

    fastify.post(
      "/todos",
      {
        schema: {
          body: insertableTodo,
          response: {
            200: todo,
          },
        },
      },
      async (request, reply) => {
        const result = await service.create(request.body);
        return reply.status(201).send(result);
      }
    );

    fastify.put(
      "/todos/:id",
      {
        schema: {
          params: pathParams,
          body: updateableTodo,
          response: {
            200: todo,
          },
        },
      },
      async (request) => {
        return await service.update({
          ...request.body,
          id: request.params.id,
        });
      }
    );

    fastify.delete(
      "/todos/:id",
      {
        schema: {
          querystring: deleteQueryParams,
          params: pathParams,
          response: {
            200: todo,
          },
        },
      },
      async (request) => {
        return await service.delete(
          request.params.id,
          request.query.forceDelete
        );
      }
    );
  };
