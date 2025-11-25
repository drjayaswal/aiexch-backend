import { SQL, sql } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";

export function increment<T extends AnyPgColumn>(
  column: T,
  value: number | SQL
): SQL {
  return sql`${column} + ${value}`;
}

export function decrement<T extends AnyPgColumn>(
  column: T,
  value: number | SQL
): SQL {
  return sql`${column} - ${value}`;
}
