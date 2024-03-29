import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class Todos1711277471905_todos implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "todos",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "title",
            type: "text",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "completed",
            type: "boolean",
          },
          {
            name: "created_at",
            type: "timestamptz",
          },
          {
            name: "updated_at",
            type: "timestamptz",
          },
        ],
      })
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("todos");
  }
}
