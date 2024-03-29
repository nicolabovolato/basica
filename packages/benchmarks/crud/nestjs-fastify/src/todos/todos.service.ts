import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { randomUUID } from "crypto";
import { EntityNotFoundError, QueryFailedError, Repository } from "typeorm";
import { DatabaseError } from "pg-protocol";

import { Todo } from "./todos.entity";
import { ConflictError, NotFoundError } from "src/app.exception";

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private usersRepository: Repository<Todo>
  ) {}

  async getAll() {
    return await this.usersRepository.find({
      order: {
        created_at: "desc",
      },
    });
  }

  async getById(id: Todo["id"]) {
    try {
      return await this.usersRepository.findOneByOrFail({ id });
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundError(`Todo ${id} not found`);
      }
      throw error;
    }
  }

  async create(
    todo: Omit<Todo, "id" | "completed" | "created_at" | "updated_at">
  ) {
    const id = randomUUID();
    const now = new Date().toISOString();

    try {
      await this.usersRepository.insert({
        id,
        completed: false,
        created_at: now,
        updated_at: now,
        ...todo,
      } satisfies Todo);
      return await this.getById(id);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const err = error.driverError as DatabaseError;

        if (err.code === "23505") {
          throw new ConflictError(`Todo ${id} already exists`);
        }
      }
      throw error;
    }
  }

  async update(todo: Omit<Todo, "created_at" | "updated_at">) {
    try {
      await this.usersRepository.update(todo.id, {
        ...todo,
        updated_at: new Date().toISOString(),
      } satisfies Omit<Todo, "created_at">);
      return await this.getById(todo.id);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundError(`Todo ${todo.id} not found`);
      }
      throw error;
    }
  }

  async delete(id: Todo["id"]) {
    try {
      const todo = await this.getById(id);
      await this.usersRepository.delete(id);
      return todo;
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new NotFoundError(`Todo ${id} not found`);
      }
      throw error;
    }
  }
}
