import { Transform } from "class-transformer";
import {
  IsUUID,
  IsNotEmpty,
  MinLength,
  ValidateIf,
  IsDateString,
} from "class-validator";

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
  @IsUUID()
  id: string;

  @Transform(({ value }) => value.toISOString())
  @IsDateString()
  updated_at: string;

  @Transform(({ value }) => value.toISOString())
  @IsDateString()
  created_at: string;
}
