---
"@basica/kysely": patch
---

Bump the `kysely` peer dependency to 0.29. Migration exports now come from the `kysely/migration` subpath, and `addKyselyMigrations`'s `db` parameter is typed `Kysely<any>` (matching kysely's `Migrator`), so it works with any schema.
