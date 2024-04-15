import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseInterceptors,
} from "@nestjs/common";

import { TodosService } from "./todos.service";
import { CreateTodoDto, TodoResponseDto, UpdateTodoDto } from "./todos.dto";
import { ResponseValidationInterceptor } from "src/responsevalidator.interceptor";

@Controller("todos")
export class TodosController {
  constructor(private service: TodosService) {}

  @Get()
  @UseInterceptors(new ResponseValidationInterceptor(TodoResponseDto))
  async getAll() {
    return await this.service.getAll();
  }

  @Get(":id")
  @UseInterceptors(new ResponseValidationInterceptor(TodoResponseDto))
  async getById(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.getById(id);
  }

  @Post()
  @UseInterceptors(new ResponseValidationInterceptor(TodoResponseDto))
  async create(@Body() todo: CreateTodoDto) {
    return await this.service.create(todo);
  }

  @Put(":id")
  @UseInterceptors(new ResponseValidationInterceptor(TodoResponseDto))
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() todo: UpdateTodoDto
  ) {
    return await this.service.update({ id, ...todo });
  }

  @Delete(":id")
  @UseInterceptors(new ResponseValidationInterceptor(TodoResponseDto))
  async delete(@Param("id", ParseUUIDPipe) id: string) {
    return await this.service.delete(id);
  }
}
