import type { DatabaseDefinition } from "../types/database-definition";
import {
  ALL_DATABASE_DEFINITIONS as ALL_DATABASE_DEFINITIONS_FROM_PACKAGE,
  DATABASE_DEFINITIONS as DATABASE_DEFINITIONS_FROM_PACKAGE,
  EXTENDED_DATABASE_DEFINITIONS as EXTENDED_DATABASE_DEFINITIONS_FROM_PACKAGE,
} from "@dbchart/schema";

// Single source of truth lives in the shared @dbchart/schema package
// (packages/schema/src/database-definitions.ts). Re-export everything.
export const ALL_DATABASE_DEFINITIONS: DatabaseDefinition[] = ALL_DATABASE_DEFINITIONS_FROM_PACKAGE;
export const DATABASE_DEFINITIONS = DATABASE_DEFINITIONS_FROM_PACKAGE;
export const EXTENDED_DATABASE_DEFINITIONS = EXTENDED_DATABASE_DEFINITIONS_FROM_PACKAGE;

export function getDatabaseDefinition(id: string): DatabaseDefinition | undefined {
  return ALL_DATABASE_DEFINITIONS.find((db) => db.id === id);
}

export function getDatabasesByCategory(): Record<string, DatabaseDefinition[]> {
  const grouped: Record<string, DatabaseDefinition[]> = {};
  for (const db of ALL_DATABASE_DEFINITIONS) {
    if (!grouped[db.category]) {
      grouped[db.category] = [];
    }
    grouped[db.category].push(db);
  }
  return grouped;
}

export function getDatabaseIdsByCategory(category: string): string[] {
  return ALL_DATABASE_DEFINITIONS
    .filter((db) => db.category === category)
    .map((db) => db.id);
}
