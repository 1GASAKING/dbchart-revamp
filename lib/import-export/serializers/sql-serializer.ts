import type { CanonicalSchema } from "../types";

const TYPE_SQL_MAP: Record<string, string> = {
  varchar: "VARCHAR",
  int: "INTEGER",
  bigint: "BIGINT",
  text: "TEXT",
  boolean: "BOOLEAN",
  decimal: "DECIMAL",
  float: "DOUBLE",
  date: "DATE",
  timestamp: "TIMESTAMP",
  time: "TIME",
  json: "JSON",
  uuid: "UUID",
  bytea: "BYTEA",
};

/** Escape a SQL identifier safely. */
function ident(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Serialize a canonical schema to DDL (CREATE TABLE + ALTER TABLE). */
export function serializeSql(schema: CanonicalSchema): string {
  const lines: string[] = [];
  const entityIdByName = new Map(
    schema.entities.map((e) => [e.name.toLowerCase(), e])
  );

  for (const entity of schema.entities) {
    const columnLines: string[] = [];
    const pkCols: string[] = [];

    for (const field of entity.fields) {
      const type = TYPE_SQL_MAP[field.dataType] ?? "JSON";
      let def = `  ${ident(field.name)} ${type}`;
      if (field.isPrimary && !field.isNullable) {def += " NOT NULL";}
      else if (field.isNullable === false) {def += " NOT NULL";}
      columnLines.push(def);
      if (field.isPrimary) {pkCols.push(ident(field.name));}
    }

    if (pkCols.length > 0) {
      columnLines.push(`  PRIMARY KEY (${pkCols.join(", ")})`);
    }

    const kind = entity.kind === "view" ? "VIEW" : "TABLE";
    lines.push(`CREATE ${kind} ${ident(entity.name)} (`);
    lines.push(columnLines.join(",\n"));
    lines.push(");");
    lines.push("");
  }

  // Foreign keys via ALTER TABLE for clarity.
  for (const rel of schema.relations) {
    const source = entityIdByName.get(rel.sourceEntityName.toLowerCase());
    const target = entityIdByName.get(rel.targetEntityName.toLowerCase());
    if (!source || !target){ continue;}

    lines.push(
      `ALTER TABLE ${ident(source.name)} ADD CONSTRAINT ${ident(
        `fk_${source.name}_${rel.sourceFieldName}`
      )} FOREIGN KEY (${ident(rel.sourceFieldName)}) REFERENCES ${ident(
        target.name
      )} (${ident(rel.targetFieldName)});`
    );
  }

  return lines.join("\n").trim() + "\n";
}