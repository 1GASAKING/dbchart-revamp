import type { CanonicalEntity, CanonicalField, CanonicalRelation } from "../types";
import type { ParseResult } from "../types";
import { irId, normalizeDataType } from "../helpers";

interface ColumnDef {
  name: string;
  dataType: string;
  isPrimary?: boolean;
  isForeign?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: { entity: string; field: string };
}

interface TableDef {
  name: string;
  kind: "table" | "view";
  columns: ColumnDef[];
  tableConstraints: Array<{
    type: "pk" | "fk";
    columns: string[];
    references?: { entity: string; field: string };
  }>;
}

/**
 * Parse a SQL DDL (schema-only) string into the canonical IR.
 *
 * Handles PostgreSQL/MySQL/SQLite style `CREATE TABLE` statements, inline
 * column constraints (PRIMARY KEY, NOT NULL, UNIQUE, REFERENCES), and table
 * level FOREIGN KEY (...) REFERENCES clauses.
 */
export function parseSql(input: string): ParseResult {
  const warnings: string[] = [];
  const tables = new Map<string, TableDef>();

  // Normalize whitespace, strip line comments and block comments.
  const normalized = input
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\n/g, " ")
    .replace(/\r/g, " ");

  // Split on statement boundaries, preserving commas within columns.
  const statements = splitStatements(normalized);

  for (const statement of statements) {
    const trimmed = statement.trim();
    if (!trimmed) continue;

    // CREATE TABLE / VIEW handling
    const createMatch =
      trimmed.match(/^CREATE\s+(TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([^\s("`']+)["`']?/i);

    if (createMatch) {
      const kind = createMatch[1].toLowerCase() as "table" | "view";
      const name = unquoteIdentifier(createMatch[2]);
      const body = extractBody(trimmed);

      const columns = parseColumns(body, warnings);
      const tableConstraints = parseTableConstraints(body, warnings, name);

      tables.set(name.toLowerCase(), {
        name,
        kind,
        columns,
        tableConstraints,
      });
      continue;
    }

    // ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
    const alterFk = trimmed.match(
      /ALTER\s+TABLE\s+["`']?([^\s]+)["`']?\s+ADD\s+CONSTRAINT\s+["`']?[^\s]+["`']?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i
    );
    if (alterFk) {
      const sourceTable = unquoteIdentifier(alterFk[1]).toLowerCase();
      const sourceCol = stripQuotesAndSpace(alterFk[2]);
      const targetTable = unquoteIdentifier(alterFk[3]);
      const targetCol = stripQuotesAndSpace(alterFk[4]);

      const existing = tables.get(sourceTable);
      if (existing) {
        existing.tableConstraints.push({
          type: "fk",
          columns: [sourceCol],
          references: { entity: targetTable, field: targetCol },
        });
      } else {
        warnings.push(`ALTER TABLE references unknown table "${sourceTable}"`);
      }
      continue;
    }

    // ALTER TABLE ... ADD FOREIGN KEY (without constraint name)
    const alterFk2 = trimmed.match(
      /ALTER\s+TABLE\s+["`']?([^\s]+)["`']?\s+ADD\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i
    );
    if (alterFk2) {
      const sourceTable = unquoteIdentifier(alterFk2[1]).toLowerCase();
      const sourceCol = stripQuotesAndSpace(alterFk2[2]);
      const targetTable = unquoteIdentifier(alterFk2[3]);
      const targetCol = stripQuotesAndSpace(alterFk2[4]);
      const existing = tables.get(sourceTable);
      if (existing) {
        existing.tableConstraints.push({
          type: "fk",
          columns: [sourceCol],
          references: { entity: targetTable, field: targetCol },
        });
      }
      continue;
    }
  }

  // Convert map to canonical entities.
  const entities: CanonicalEntity[] = [];

  for (const def of tables.values()) {
    const entityId = irId("entity");

    const fields = def.columns
      .map<CanonicalField>((col) => {
        const fk = def.tableConstraints.find(
          (c) => c.type === "fk" && c.columns.includes(col.name.toLowerCase())
        );
        const pk = def.tableConstraints.find(
          (c) => c.type === "pk" && c.columns.includes(col.name.toLowerCase())
        );
        return {
          id: irId("field"),
          name: col.name,
          dataType: normalizeDataType(col.dataType),
          isPrimary: col.isPrimary || Boolean(pk),
          isForeign: col.isForeign || Boolean(fk),
          isNullable: col.isNullable ?? true,
          isUnique: col.isUnique,
        };
      });

    entities.push({
      id: entityId,
      name: def.name,
      kind: def.kind,
      fields,
    });
  }

  // Build relations from foreign key constraints.
  const relations: CanonicalRelation[] = [];
  const entitiesByName = new Map(entities.map((e) => [e.name.toLowerCase(), e]));

  for (const def of tables.values()) {
    const sourceEntity = entitiesByName.get(def.name.toLowerCase());
    if (!sourceEntity) continue;

    for (const constraint of def.tableConstraints) {
      if (constraint.type !== "fk" || !constraint.references) continue;
      const targetEntity = entitiesByName.get(constraint.references.entity.toLowerCase());
      // A single-column FK maps to one relation.
      const sourceField = sourceEntity.fields.find(
        (f) => f.name.toLowerCase() === constraint.columns[0]?.toLowerCase()
      );
      const targetField = targetEntity?.fields.find(
        (f) => f.name.toLowerCase() === constraint.references!.field.toLowerCase()
      );
      if (!targetEntity) {
        warnings.push(
          `Foreign key on "${def.name}" references missing table "${constraint.references.entity}"`
        );
        continue;
      }
      if (!sourceField || !targetField) continue;

      relations.push({
        id: irId("rel"),
        sourceEntityName: sourceEntity.name,
        sourceFieldName: sourceField.name,
        targetEntityName: targetEntity.name,
        targetFieldName: targetField.name,
        cardinality: "1:N",
      });
    }
  }

  if (entities.length === 0) {
    warnings.push("No CREATE TABLE statements were found in the SQL input.");
  }

  return { schema: { entities, relations }, warnings };
}

/** Split a SQL string into top-level statements on `;`. */
function splitStatements(input: string): string[] {
  const statements: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of input) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === ";" && depth === 0) {
      statements.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) statements.push(current);
  return statements;
}

/** Extract the parenthesized body of a CREATE statement. */
function extractBody(statement: string): string {
  const start = statement.indexOf("(");
  if (start === -1) return "";
  // find matching close parent; body is the interior.
  let depth = 0;
  for (let i = start; i < statement.length; i++) {
    if (statement[i] === "(") depth++;
    if (statement[i] === ")") {
      depth--;
      if (depth === 0) return statement.slice(start + 1, i);
    }
  }
  return statement.slice(start + 1);
}

/** Split a body into comma-separated top-level definitions. */
function splitTopLevelCommas(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of body) {
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** Parse column definitions from a CREATE TABLE body. */
function parseColumns(body: string, warnings: string[]): ColumnDef[] {
  const columns: ColumnDef[] = [];
  for (const raw of splitTopLevelCommas(body)) {
    // Skip table-level constraints (they begin with CONSTRAINT, PRIMARY, FOREIGN, UNIQUE, CHECK).
    if (/^CONSTRAINT\b/i.test(raw.trim())) continue;
    if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(raw.trim())) continue;

    const col = parseColumnDefinition(raw, warnings);
    if (col) columns.push(col);
  }
  return columns;
}

/** Parse a single column definition. */
function parseColumnDefinition(raw: string, _warnings: string[]): ColumnDef | null {
  // Patterns: "col_name TYPE [constraints]" or "col_name TYPE," etc.
  const m = raw.trim().match(/^["`']?([^\s"`']+)["`']?\s+([^\s,()]+)(.*)$/i);
  if (!m) return null;

  const name = unquoteIdentifier(m[1]);
  const dataType = m[2];
  const rest = (m[3] ?? "").toUpperCase();

  const def: ColumnDef = { name, dataType };

  if (/NOT\s+NULL/.test(rest)) def.isNullable = false;
  else def.isNullable = true;

  if (/PRIMARY\s+KEY/.test(rest)) def.isPrimary = true;
  if (/UNIQUE/.test(rest)) def.isUnique = true;

  const ref = raw.match(/REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i);
  if (ref) {
    def.isForeign = true;
    def.references = { entity: unquoteIdentifier(ref[1]), field: stripQuotesAndSpace(ref[2]) };
  }

  return def;
}

/** Parse table-level constraints (PRIMARY KEY and FOREIGN KEY). */
function parseTableConstraints(
  body: string,
  _warnings: string[],
  _tableName: string
): TableDef["tableConstraints"] {
  const constraints: TableDef["tableConstraints"] = [];

  for (const raw of splitTopLevelCommas(body)) {
    const t = raw.trim();

    const pk = t.match(/^(?:CONSTRAINT\s+["`']?[^\s]+["`']?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pk) {
      constraints.push({
        type: "pk",
        columns: splitIdentifierList(pk[1]),
      });
      continue;
    }

    const fk = t.match(
      /^(?:CONSTRAINT\s+["`']?[^\s]+["`']?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i
    );
    if (fk) {
      constraints.push({
        type: "fk",
        columns: splitIdentifierList(fk[1]),
        references: {
          entity: unquoteIdentifier(fk[2]),
          field: stripQuotesAndSpace(fk[3]),
        },
      });
      continue;
    }
  }

  return constraints;
}

/** Split a comma-separated list of identifiers, stripping quotes/spaces. */
function splitIdentifierList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => stripQuotesAndSpace(s))
    .filter(Boolean);
}

/** Remove surrounding quotes and whitespace from a single identifier. */
function stripQuotesAndSpace(raw: string): string {
  return raw.trim().replace(/^["`']|["`']$/g, "");
}

/** Remove surrounding quotes from an identifier. */
function unquoteIdentifier(raw: string): string {
  return raw.trim().replace(/^["`']|["`']$/g, "");
}