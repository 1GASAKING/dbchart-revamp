/** All supported data types — single source of truth */
export const FIELD_DATA_TYPES = [
  "varchar",
  "int",
  "bigint",
  "text",
  "boolean",
  "decimal",
  "float",
  "date",
  "timestamp",
  "time",
  "json",
  "uuid",
  "bytea",
] as const;

/** Union derived from FIELD_DATA_TYPES */
export type FieldDataType = (typeof FIELD_DATA_TYPES)[number];

export interface DesignField {
  id: string;
  name: string;
  dataType: FieldDataType;
  connectable?: boolean;
  color?: string;
}
