import type { FieldDataType } from "@dbchart/schema";
import type { CanonicalSchema } from "./types";

/** Deterministic id prefix counter (kept simple; no external deps). */
let idCounter = 0;

/** Generate a unique id with a stable prefix (no randomness for IR). */
export function irId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Reset the id counter (useful for tests). */
export function resetIrIdCounter(): void {
  idCounter = 0;
}

/**
 * Map an arbitrary external SQL/DBML/JSON type string to one of the supported
 * {@link FieldDataType}s. Falls back to "json" for unknown/mixed/object types.
 */
export function normalizeDataType(raw: string): FieldDataType {
  const t = raw.trim().toLowerCase();

  // Strip length/precision qualifiers, e.g. "varchar(255)" -> "varchar".
  const base = t.replace(/\(.*$/g, "").trim();

  const map: Record<string, FieldDataType> = {
    // text / string
    varchar: "varchar",
    char: "varchar",
    character: "varchar",
    nvarchar: "varchar",
    string: "varchar",
    text: "text",
    longtext: "text",
    mediumtext: "text",
    tinytext: "text",
    citext: "text",
    enum: "varchar",
    // integers
    int: "int",
    integer: "int",
    int2: "int",
    int4: "int",
    smallint: "int",
    tinyint: "int",
    mediumint: "int",
    serial: "int",
    bigserial: "bigint",
    bigint: "bigint",
    int8: "bigint",
    number: "bigint",
    long: "bigint",
    // floats
    decimal: "decimal",
    numeric: "decimal",
    money: "decimal",
    double: "float",
    "double precision": "float",
    float8: "float",
    float: "float",
    real: "float",
    float4: "float",
    // boolean
    bool: "boolean",
    boolean: "boolean",
    // date / time
    date: "date",
    datetime: "timestamp",
    timestamp: "timestamp",
    timestamptz: "timestamp",
    timetz: "time",
    time: "time",
    // json / binary
    json: "json",
    jsonb: "json",
    array: "json",
    object: "json",
    document: "json",
    uuid: "uuid",
    uniqueidentifier: "uuid",
    blob: "bytea",
    bytea: "bytea",
    binary: "bytea",
    varbinary: "bytea",
    "unsigned big int": "bigint",
  };

  return map[base] ?? "json";
}

/** Whether two schemas are structurally equal (used mostly in tests). */
export function isSameSchema(a: CanonicalSchema, b: CanonicalSchema): boolean {
  if (a.entities.length !== b.entities.length) {return false;}
  if (a.relations.length !== b.relations.length) {return false;}
  const byName = new Map(a.entities.map((e) => [e.name, e]));
  for (const eb of b.entities) {
    const ea = byName.get(eb.name);
    if (!ea){ return false;}
    if (ea.kind !== eb.kind){ return false;}
    if (ea.fields.length !== eb.fields.length){ return false;}
    const fa = new Map(ea.fields.map((f) => [f.name, f]));
    for (const fb of eb.fields) {
      const f = fa.get(fb.name);
      if (!f){ return false;}
      if (f.dataType !== fb.dataType){ return false;}
      if (f.isPrimary !== fb.isPrimary){ return false;}
      if (f.isForeign !== fb.isForeign){ return false;}
      if (f.isNullable !== fb.isNullable){ return false;}
      if (f.isUnique !== fb.isUnique){ return false;}
    }
  }
  return true;
}