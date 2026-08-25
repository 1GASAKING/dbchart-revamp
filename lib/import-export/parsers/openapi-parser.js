"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpenApi = parseOpenApi;
exports.isOpenApiDocument = isOpenApiDocument;
const helpers_1 = require("../helpers");
/**
 * Parse an OpenAPI 3.x document (e.g. FastAPI's `openapi.json`) into the
 * canonical IR by introspecting `components.schemas` (Pydantic models).
 *
 * `$ref` properties are treated as foreign-key relationships pointing at the
 * referenced model.
 */
function parseOpenApi(input) {
    const warnings = [];
    let doc;
    try {
        doc = JSON.parse(input);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid OpenAPI JSON: ${message}`);
    }
    const schemas = doc
        ?.components?.schemas;
    if (!schemas || typeof schemas !== "object") {
        return {
            schema: { entities: [], relations: [] },
            warnings: ["No components.schemas found in the OpenAPI document"],
        };
    }
    const entities = [];
    const relations = [];
    // Pre-pass: collect enum schemas (`{ "enum": [...] }`) so `$ref`s to them
    // can recover the allowed values and so they are not emitted as empty
    // entities.
    const enumComponents = new Map();
    for (const [name, rawSchema] of Object.entries(schemas)) {
        const s = rawSchema;
        if (s.enum) {
            const values = (0, helpers_1.parseEnumValues)(s.enum);
            if (values.length > 0) {
                enumComponents.set(name.toLowerCase(), values);
            }
        }
    }
    for (const [name, rawSchema] of Object.entries(schemas)) {
        const schema = rawSchema;
        const properties = schema?.properties ?? {};
        const fields = [];
        for (const [propName, rawProp] of Object.entries(properties)) {
            const prop = rawProp;
            const refEntity = prop.$ref?.split("/").pop() ?? "";
            // A `$ref` to a plain model means this property points at another
            // entity; a `$ref` to an enum component is a constrained value, not a
            // relationship.
            const isEnumRef = enumComponents.has(refEntity.toLowerCase());
            const enumMeta = resolveOpenApiEnum(prop, enumComponents);
            const field = {
                id: (0, helpers_1.irId)("field"),
                name: propName,
                dataType: enumMeta
                    ? (0, helpers_1.normalizeEnumDataType)(enumMeta.name ?? "enum")
                    : mapOpenApiType(prop),
                isPrimary: propName === "id" || propName === "_id",
                isForeign: Boolean(prop.$ref) && !isEnumRef,
                isNullable: true,
                ...(enumMeta ? { enum: enumMeta } : {}),
            };
            fields.push(field);
            if (prop.$ref && !isEnumRef) {
                relations.push({
                    id: (0, helpers_1.irId)("rel"),
                    sourceEntityName: name,
                    sourceFieldName: propName,
                    targetEntityName: refEntity,
                    targetFieldName: "id",
                    cardinality: "1:N",
                });
            }
        }
        // Pure enum components (no object properties) were already captured in
        // the pre-pass — they are constrained value types, not relational
        // entities.
        if (fields.length === 0 && enumComponents.has(name.toLowerCase())) {
            continue;
        }
        entities.push({
            id: (0, helpers_1.irId)("entity"),
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
function mapOpenApiType(prop) {
    if (prop.$ref) {
        return (0, helpers_1.normalizeDataType)("uuid");
    }
    switch (prop.type) {
        case "integer":
            return (0, helpers_1.normalizeDataType)("bigint");
        case "number":
            return (0, helpers_1.normalizeDataType)("decimal");
        case "boolean":
            return (0, helpers_1.normalizeDataType)("boolean");
        case "string":
            if (prop.format === "date-time") {
                return (0, helpers_1.normalizeDataType)("timestamp");
            }
            if (prop.format === "date") {
                return (0, helpers_1.normalizeDataType)("date");
            }
            if (prop.format === "uuid") {
                return (0, helpers_1.normalizeDataType)("uuid");
            }
            return (0, helpers_1.normalizeDataType)("varchar");
        case "array":
            return (0, helpers_1.normalizeDataType)("json");
        case "object":
            return (0, helpers_1.normalizeDataType)("json");
        default:
            return (0, helpers_1.normalizeDataType)("json");
    }
}
/** Resolve enum metadata for a property: inline `enum` or `$ref` to an enum component. */
function resolveOpenApiEnum(prop, enumComponents) {
    if (prop.enum !== undefined) {
        const values = (0, helpers_1.parseEnumValues)(prop.enum);
        if (values.length > 0) {
            return { values };
        }
    }
    if (prop.$ref) {
        const refName = prop.$ref.split("/").pop() ?? "";
        const values = enumComponents.get(refName.toLowerCase());
        if (values) {
            return { name: refName, values };
        }
    }
    return undefined;
}
/** Detect whether a raw JSON string is an OpenAPI document. */
function isOpenApiDocument(input) {
    const trimmed = input.trimStart();
    if (!trimmed.startsWith("{")) {
        return false;
    }
    try {
        const doc = JSON.parse(input);
        return typeof doc.openapi === "string" || typeof doc.swagger === "string";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=openapi-parser.js.map