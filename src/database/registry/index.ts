import { DatabaseDefinition } from "../types/database-definition";
import { DATABASE_DEFINITIONS } from "./database-registry";
import { EXTENDED_DATABASE_DEFINITIONS } from "./extended-databases";

export const ALL_DATABASE_DEFINITIONS: DatabaseDefinition[] = [
  ...DATABASE_DEFINITIONS,
  ...EXTENDED_DATABASE_DEFINITIONS,
];

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

export { DATABASE_DEFINITIONS, EXTENDED_DATABASE_DEFINITIONS };