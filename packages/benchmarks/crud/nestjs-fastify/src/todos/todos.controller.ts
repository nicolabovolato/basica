import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  SerializeOptions,
  UseInterceptors,
} from "@nestjs/common";

import { TodosService } from "./todos.service";
import { CreateTodoDto, TodoResponseDto, UpdateTodoDto } from "./todos.dto";

@Controller("todos")
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: TodoResponseDto, excludeExtraneousValues: true })
export class TodosController {
  constructor(private service: TodosService) {}

  @Get()
  async getAll() {
    return await this.service.getAll();
  }

  @Get(":id")
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.getById(id);
  }

  @Post()
  async create(@Body() todo: CreateTodoDto) {
    return await this.service.create(todo);
  }

  @Put(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() todo: UpdateTodoDto
  ) {
    return await this.service.update({ id, ...todo });
  }

  @Delete(":id")
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.delete(id);
  }
}
