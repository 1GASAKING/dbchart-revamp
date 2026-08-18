import type { ParseResult, SchemaFormat } from "../types";
import { parseSql } from "./sql-parser";
import { parseDbml } from "./dbml-parser";
import { parseJson } from "./json-parser";

/** Parse an external schema string based on its format. */
export function parseSchema(format: SchemaFormat, input: string): ParseResult {
  switch (format) {
    case "sql":
      return parseSql(input);
    case "dbml":
      return parseDbml(input);
    case "json":
      return parseJson(input);
    default: {
      const exhaustive: never = format;
      throw new Error(`Unsupported format: ${exhaustive}`);
    }
  }
}

export { parseSql } from "./sql-parser";
export { parseDbml } from "./dbml-parser";
export { parseJson } from "./json-parser";
export { parseOpenApi, isOpenApiDocument } from "./openapi-parser";
