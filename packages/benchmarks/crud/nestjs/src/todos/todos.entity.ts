import {
  Entity,
  Column,
  PrimaryColumn,
} from "typeorm";

@Entity("todos")
export class Todo {
  @PrimaryColumn({ type: "uuid" })
  id: string;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "boolean" })
  completed: boolean;

  @Column({ type: "timestamptz" })
  created_at: string;

  @Column({ type: "timestamptz" })
  updated_at: string;
}
