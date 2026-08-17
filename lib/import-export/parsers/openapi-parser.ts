import type {
  CanonicalEntity,
  CanonicalField,
  CanonicalRelation,
  ParseResult,
} from "../types";
import type { FieldDataType } from "@dbchart/schema";
import { irId, normalizeDataType } from "../helpers";

/**
 * Parse an OpenAPI 3.x document (e.g. FastAPI's `openapi.json`) into the
 * canonical IR by introspecting `components.schemas` (Pydantic models).
 *
 * `$ref` properties are treated as foreign-key relationships pointing at the
 * referenced model.
 */
export function parseOpenApi(input: string): ParseResult {
  const warnings: string[] = [];
  let doc: unknown;
  try {
    doc = JSON.parse(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid OpenAPI JSON: ${message}`);
  }

  const schemas = (doc as { components?: { schemas?: Record<string, unknown> } })
    ?.components?.schemas;

  if (!schemas || typeof schemas !== "object") {
    return {
      schema: { entities: [], relations: [] },
      warnings: ["No components.schemas found in the OpenAPI document"],
    };
  }

  const entities: CanonicalEntity[] = [];
  const relations: CanonicalRelation[] = [];

  for (const [name, rawSchema] of Object.entries(schemas)) {
    const schema = rawSchema as {
      type?: string;
      properties?: Record<string, unknown>;
      items?: { type?: string };
    };

    const properties = schema?.properties ?? {};
    const fields: CanonicalField[] = [];

    for (const [propName, rawProp] of Object.entries(properties)) {
      const prop = rawProp as {
        type?: string;
        format?: string;
        $ref?: string;
        items?: { type?: string };
      };

      const field: CanonicalField = {
        id: irId("field"),
        name: propName,
        dataType: mapOpenApiType(prop),
        isPrimary: propName === "id" || propName === "_id",
        isForeign: Boolean(prop.$ref),
        isNullable: true,
      };
      fields.push(field);

      // A `$ref` means this property points at another model.
      if (prop.$ref) {
        const refEntity = prop.$ref.split("/").pop() ?? "";
        relations.push({
          id: irId("rel"),
          sourceEntityName: name,
          sourceFieldName: propName,
          targetEntityName: refEntity,
          targetFieldName: "id",
          cardinality: "1:N",
        });
      }
    }

    entities.push({
      id: irId("entity"),
      name,
      kind: "table",
      fields,
    });
  }

  if (entities.length === 0) {
    warnings.push("No schemas were extracted from components.schemas.");
  }

  return { schema: { entities, relations }, warnings };
}

/** Map an OpenAPI property descriptor to a canonical field data type. */
function mapOpenApiType(prop: {
  type?: string;
  format?: string;
  $ref?: string;
}): FieldDataType {
  if (prop.$ref) return normalizeDataType("uuid");
  switch (prop.type) {
    case "integer":
      return normalizeDataType("bigint");
    case "number":
      return normalizeDataType("decimal");
    case "boolean":
      return normalizeDataType("boolean");
    case "string":
      if (prop.format === "date-time") return normalizeDataType("timestamp");
      if (prop.format === "date") return normalizeDataType("date");
      if (prop.format === "uuid") return normalizeDataType("uuid");
      return normalizeDataType("varchar");
    case "array":
      return normalizeDataType("json");
    case "object":
      return normalizeDataType("json");
    default:
      return normalizeDataType("json");
  }
}

/** Detect whether a raw JSON string is an OpenAPI document. */
export function isOpenApiDocument(input: string): boolean {
  const trimmed = input.trimStart();
  if (!trimmed.startsWith("{")) return false;
  try {
    const doc = JSON.parse(input) as { openapi?: string; swagger?: string };
    return typeof doc.openapi === "string" || typeof doc.swagger === "string";
  } catch {
    return false;
  }
}