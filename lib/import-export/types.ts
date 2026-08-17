import type { FieldDataType } from "@dbchart/schema";

/**
 * Canonical intermediate representation (IR) used by all importers/exporters.
 *
 * Parsers translate external formats (SQL, DBML, JSON) into this model, and
 * serializers translate this model back out. The webview graph is kept decoupled
 * from any specific file format by converting through the IR.
 */

/** Supported schema entity kinds. */
export type CanonicalEntityKind = "table" | "view" | "collection";

/** A field within a canonical entity. */
export interface CanonicalField {
  id: string;
  name: string;
  dataType: FieldDataType;
  isPrimary?: boolean;
  isForeign?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  isNested?: boolean;
  nestedFields?: CanonicalField[];
}

/** A canonical entity (table/view/collection). */
export interface CanonicalEntity {
  id: string;
  name: string;
  kind: CanonicalEntityKind;
  fields: CanonicalField[];
}

/** Cardinality of a canonical relationship. */
export type CanonicalCardinality = "1:1" | "1:N" | "N:M";

/** A canonical relationship between two fields on two entities. */
export interface CanonicalRelation {
  id: string;
  sourceEntityName: string;
  sourceFieldName: string;
  targetEntityName: string;
  targetFieldName: string;
  cardinality: CanonicalCardinality;
}

/** The complete canonical schema. */
export interface CanonicalSchema {
  entities: CanonicalEntity[];
  relations: CanonicalRelation[];
}

/** Supported import/export file formats. */
export type SchemaFormat = "sql" | "dbml" | "json";

/** The result of a successful parse operation. */
export interface ParseResult {
  schema: CanonicalSchema;
  /** Human-readable warnings collected while parsing (not fatal). */
  warnings: string[];
}