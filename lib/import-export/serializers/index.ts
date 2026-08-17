import type { CanonicalSchema, SchemaFormat } from "../types";
import { serializeSql } from "./sql-serializer";
import { serializeDbml } from "./dbml-serializer";
import { serializeJson } from "./json-serializer";

/** Serialize a canonical schema to a string based on the requested format. */
export function serializeSchema(format: SchemaFormat, schema: CanonicalSchema): string {
  switch (format) {
    case "sql":
      return serializeSql(schema);
    case "dbml":
      return serializeDbml(schema);
    case "json":
      return serializeJson(schema);
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported format: ${exhaustive}`);
    }
  }
}

export { serializeSql } from "./sql-serializer";
export { serializeDbml } from "./dbml-serializer";
export { serializeJson } from "./json-serializer";