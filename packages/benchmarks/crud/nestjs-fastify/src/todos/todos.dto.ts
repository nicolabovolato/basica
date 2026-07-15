import { Expose, Transform } from "class-transformer";
import { IsNotEmpty, MinLength, ValidateIf } from "class-validator";

export class CreateTodoDto {
  @MinLength(1)
  title: string;

  @MinLength(1)
  @ValidateIf((object, value) => value !== null)
  description: string | null;
}

export class UpdateTodoDto extends CreateTodoDto {
  @IsNotEmpty()
  completed: boolean;
}

export class TodoResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string | null;

  @Expose()
  completed: boolean;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  created_at: string;

  @Expose()
  @Transform(({ value }) => (value instanceof Date ? value.toISOString() : value))
  updated_at: string;
}
