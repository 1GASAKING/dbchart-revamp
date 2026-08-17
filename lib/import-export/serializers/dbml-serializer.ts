import type { CanonicalSchema, CanonicalField } from "../types";

const TYPE_DBML_MAP: Record<string, string> = {
  varchar: "varchar",
  int: "int",
  bigint: "bigint",
  text: "text",
  boolean: "boolean",
  decimal: "decimal",
  float: "float",
  date: "date",
  timestamp: "timestamp",
  time: "time",
  json: "json",
  uuid: "uuid",
  bytea: "bytea",
};

/** Serialize a canonical schema to DBML. */
export function serializeDbml(schema: CanonicalSchema): string {
  const lines: string[] = [];
  const entityIdByName = new Map(
    schema.entities.map((e) => [e.name.toLowerCase(), e])
  );

  for (const entity of schema.entities) {
    lines.push(`Table ${entity.name} {`);

    for (const field of entity.fields) {
      const settings = fieldSettings(field);
      lines.push(`  ${field.name} ${TYPE_DBML_MAP[field.dataType] ?? "varchar"}${settings}`);
    }

    lines.push("}");
    lines.push("");
  }

  for (const rel of schema.relations) {
    const source = entityIdByName.get(rel.sourceEntityName.toLowerCase());
    const target = entityIdByName.get(rel.targetEntityName.toLowerCase());
    if (!source || !target) continue;

    lines.push(`Ref { ${rel.sourceEntityName}.${rel.sourceFieldName} < ${rel.targetEntityName}.${rel.targetFieldName} }`);
  }

  return lines.join("\n").trim() + "\n";
}

/** Build the DBML `[settings]` suffix for a field. */
function fieldSettings(field: CanonicalField): string {
  const settings: string[] = [];
  if (field.isPrimary) settings.push("pk");
  if (field.isUnique && !field.isPrimary) settings.push("unique");
  if (field.isNullable === false) settings.push("not null");
  if (settings.length === 0) return "";
  return ` [${settings.join(", ")}]`;
}