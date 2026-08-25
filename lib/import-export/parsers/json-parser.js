"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJson = parseJson;
const helpers_1 = require("../helpers");
const openapi_parser_1 = require("./openapi-parser");
/**
 * Parse a JSON string into the canonical IR using structural introspection
 * and heuristic type inference.
 *
 * Accepts three shapes:
 *  1. A single array of documents (one collection).
 *  2. A keyed dictionary where each value is an array of documents
 *     (multi-collection snapshot).
 *  3. A pre-existing canonical schema (round-trip support), detected via the
 *     presence of `entities` and `relations` keys.
 */
function parseJson(input) {
    const warnings = [];
    // Route OpenAPI / FastAPI documents to the dedicated extractor.
    if ((0, openapi_parser_1.isOpenApiDocument)(input)) {
        return (0, openapi_parser_1.parseOpenApi)(input);
    }
    let data;
    try {
        data = JSON.parse(input);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON: ${message}`);
    }
    // Round-trip: if this is already a canonical schema, use it directly.
    if (isCanonicalSchema(data)) {
        return { schema: data, warnings };
    }
    // Normalise into a collection map: name -> array of documents.
    const collections = new Map();
    if (Array.isArray(data)) {
        collections.set("collection", data);
    }
    else if (data && typeof data === "object") {
        const obj = data;
        let hasCollections = false;
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                collections.set(key, value);
                hasCollections = true;
            }
        }
        if (!hasCollections) {
            // A single object document (not an array).
            collections.set("collection", [obj]);
        }
    }
    else {
        throw new Error("Unsupported JSON shape: expected an array of documents, a dictionary of collection arrays, or a canonical schema object.");
    }
    const entities = [];
    const entitiesByName = new Map();
    for (const [collectionName, documents] of collections.entries()) {
        const sampled = sampleDocuments(documents);
        const entity = {
            id: (0, helpers_1.irId)("entity"),
            name: collectionName,
            kind: "collection",
            fields: sampled.map((f) => sampledToCanonical(f)),
        };
        entities.push(entity);
        entitiesByName.set(collectionName.toLowerCase(), entity);
    }
    // Implicit key + reference detection to build relations.
    const relations = buildImplicitRelations(entities, entitiesByName);
    if (entities.length === 0) {
        warnings.push("No collections were found in the JSON input.");
    }
    return { schema: { entities, relations }, warnings };
}
/** Whether a parsed JSON value already matches the canonical schema shape. */
function isCanonicalSchema(data) {
    if (!data || typeof data !== "object") {
        return false;
    }
    const obj = data;
    return Array.isArray(obj.entities) && Array.isArray(obj.relations);
}
/** Sample documents to build a merged field signature. */
function sampleDocuments(documents) {
    const fieldMap = new Map();
    for (const document of documents) {
        if (!document || typeof document !== "object" || Array.isArray(document)) {
            continue;
        }
        const obj = document;
        for (const [key, value] of Object.entries(obj)) {
            const field = fieldMap.get(key) ?? {
                name: key,
                dataType: inferJsonType(value),
            };
            // Reconcile types across documents (widening toward json for conflicts).
            const valueType = inferJsonType(value);
            if (field.dataType !== valueType) {
                field.dataType = "json";
            }
            if (isObjectLike(value)) {
                field.isNested = true;
                field.nestedFields = sampleNestedObject(value);
            }
            fieldMap.set(key, field);
        }
    }
    // Root-level convention primary key detection.
    return [...fieldMap.values()];
}
/** Infer a canonical data type from a JSON runtime value. */
function inferJsonType(value) {
    if (value === null) {
        return "varchar";
    }
    if (Array.isArray(value)) {
        return "json";
    }
    if (typeof value === "boolean") {
        return "boolean";
    }
    if (typeof value === "number") {
        return Number.isInteger(value) ? "bigint" : "decimal";
    }
    if (typeof value === "string") {
        // Heuristic: ISO date/timestamp detection.
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
            return "timestamp";
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return "date";
        }
        return "varchar";
    }
    if (typeof value === "object") {
        return "json";
    }
    return "varchar";
}
/** Whether a JSON value is a plain object or array of objects. */
function isObjectLike(value) {
    if (Array.isArray(value)) {
        return value.some((item) => item !== null && typeof item === "object");
    }
    return value !== null && typeof value === "object";
}
/** Recursively sample nested object structures. */
function sampleNestedObject(value) {
    if (Array.isArray(value)) {
        const firstObject = value.find((item) => item !== null && typeof item === "object");
        if (!firstObject || typeof firstObject !== "object") {
            return undefined;
        }
        return Object.entries(firstObject).map(([key, child]) => ({
            name: key,
            dataType: inferJsonType(child),
            isNested: isObjectLike(child),
            nestedFields: isObjectLike(child) ? sampleNestedObject(child) : undefined,
        }));
    }
    if (value && typeof value === "object") {
        return Object.entries(value).map(([key, child]) => ({
            name: key,
            dataType: inferJsonType(child),
            isNested: isObjectLike(child),
            nestedFields: isObjectLike(child) ? sampleNestedObject(child) : undefined,
        }));
    }
    return undefined;
}
/** Convert a sampled field into a canonical field. */
function sampledToCanonical(field) {
    const isPrimary = field.name === "id" || field.name === "_id";
    const isForeign = field.name.endsWith("Id") || field.name.endsWith("_id");
    return {
        id: (0, helpers_1.irId)("field"),
        name: field.name,
        dataType: (0, helpers_1.normalizeDataType)(field.dataType),
        isPrimary,
        isForeign: isForeign && !isPrimary,
        isNullable: true,
        isNested: field.isNested,
        nestedFields: field.nestedFields?.map(sampledToCanonical),
    };
}
/** Detect convention-based foreign keys and link them to matching entities. */
function buildImplicitRelations(entities, entitiesByName) {
    const relations = [];
    for (const entity of entities) {
        for (const field of entity.fields) {
            if (field.name === "id" || field.name === "_id") {
                continue;
            }
            if (!field.name.endsWith("Id") && !field.name.endsWith("_id")) {
                continue;
            }
            // candidate target entity name = field name minus suffix.
            const targetName = field.name.replace(/[_-]?[Ii]d$/, "");
            const targetEntity = entitiesByName.get(targetName.toLowerCase());
            if (!targetEntity) {
                continue;
            }
            const targetField = targetEntity.fields.find((f) => f.isPrimary) ?? targetEntity.fields[0];
            if (!targetField) {
                continue;
            }
            relations.push({
                id: (0, helpers_1.irId)("rel"),
                sourceEntityName: entity.name,
                sourceFieldName: field.name,
                targetEntityName: targetEntity.name,
                targetFieldName: targetField.name,
                cardinality: "1:N",
            });
        }
    }
    return relations;
}
//# sourceMappingURL=json-parser.js.map