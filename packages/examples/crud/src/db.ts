import { ColumnType, Insertable, Selectable, Updateable } from "kysely";

export type Database = {
  todos: TodosTable;
};

type TodosTable = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: ColumnType<string, string, never>;
  updated_at: string;
  deleted_at: ColumnType<string | null, never, string>;
};

export type Todo = Selectable<TodosTable>;
export type NewTodo = Insertable<TodosTable>;
export type UpdatedTodo = Updateable<TodosTable>;
