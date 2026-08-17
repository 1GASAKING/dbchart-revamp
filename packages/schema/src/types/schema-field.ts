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
  /** Whether this field is a primary key (imported schemas). */
  isPrimary?: boolean;
  /** Whether this field is a foreign key (imported schemas). */
  isForeign?: boolean;
  /** Whether this field allows NULL (imported schemas). */
  isNullable?: boolean;
  /** Whether this field is unique (imported schemas). */
  isUnique?: boolean;
  /** Whether this field is a nested/embedded document (JSON/NoSQL). */
  isNested?: boolean;
  /** Sub-fields when this field is a nested/embedded object. */
  nestedFields?: DesignField[];
}
