"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalToDesign = canonicalToDesign;
exports.designToCanonical = designToCanonical;
exports.databaseSchemaToDesign = databaseSchemaToDesign;
const general_utils_1 = require("../utils/general-utils");
const helpers_1 = require("./helpers");
/** Color used for primary-key fields, matching the webview schema node. */
const PRIMARY_KEY_COLOR = "#4CAF50";
/**
 * Convert a canonical schema into a {@link SchemaDesign} that can be rendered
 * on the React Flow canvas.
 *
 * The canonical IR uses entity/field names for relationships; this adapter
 * generates stable node/field ids and resolves those names back to ids so the
 * resulting relationships connect correctly.
 */
function canonicalToDesign(schema) {
    const nodes = [];
    const relations = [];
    const nodeIdByName = new Map();
    const fieldIdByKey = new Map();
    for (const entity of schema.entities) {
        const nodeId = (0, general_utils_1.generateNodeId)();
        nodeIdByName.set(entity.name.toLowerCase(), nodeId);
        const fields = entity.fields.map((field) => canonicalFieldToDesignField(field, fieldIdByKey, entity.name));
        nodes.push({
            id: nodeId,
            label: entity.name,
            kind: entity.kind === "collection" ? "table" : entity.kind,
            color: (0, general_utils_1.generateNodeColor)(),
            fields,
        });
    }
    for (const rel of schema.relations) {
        const sourceNodeId = nodeIdByName.get(rel.sourceEntityName.toLowerCase());
        const targetNodeId = nodeIdByName.get(rel.targetEntityName.toLowerCase());
        if (!sourceNodeId || !targetNodeId) {
            continue;
        }
        const sourceFieldId = fieldIdByKey.get(fieldKey(rel.sourceEntityName, rel.sourceFieldName));
        const targetFieldId = fieldIdByKey.get(fieldKey(rel.targetEntityName, rel.targetFieldName));
        if (!sourceFieldId || !targetFieldId) {
            continue;
        }
        relations.push({
            id: (0, general_utils_1.generateNodeId)(),
            sourceNodeId,
            sourceFieldId,
            targetNodeId,
            targetFieldId,
        });
    }
    return { type: "schema", nodes, relationships: relations };
}
/** Convert a single canonical field to a {@link DesignField}. */
function canonicalFieldToDesignField(field, fieldIdByKey, entityName) {
    const fieldId = (0, general_utils_1.generateFieldId)();
    fieldIdByKey.set(fieldKey(entityName, field.name), fieldId);
    const out = {
        id: fieldId,
        name: field.name,
        dataType: field.dataType,
        connectable: field.isNested ? false : undefined,
        color: field.isPrimary ? PRIMARY_KEY_COLOR : undefined,
        isPrimary: field.isPrimary,
        isForeign: field.isForeign,
        isNullable: field.isNullable,
        isUnique: field.isUnique,
        isNested: field.isNested,
        ...(field.enum ? { enum: field.enum } : {}),
    };
    if (field.nestedFields && field.nestedFields.length > 0) {
        out.nestedFields = field.nestedFields.map((nested) => canonicalNestedFieldToDesignField(nested));
    }
    return out;
}
/** Convert a nested canonical field (no relationship resolution needed). */
function canonicalNestedFieldToDesignField(field) {
    const out = {
        id: (0, general_utils_1.generateFieldId)(),
        name: field.name,
        dataType: field.dataType,
        isPrimary: field.isPrimary,
        isForeign: field.isForeign,
        isNullable: field.isNullable,
        isUnique: field.isUnique,
        isNested: field.isNested,
        ...(field.enum ? { enum: field.enum } : {}),
    };
    if (field.nestedFields && field.nestedFields.length > 0) {
        out.nestedFields = field.nestedFields.map(canonicalNestedFieldToDesignField);
    }
    return out;
}
/**
 * Convert an existing {@link SchemaDesign} back into the canonical IR for
 * export. Entity kinds become `table`/`view`, and relationships are resolved
 * from ids back to names.
 */
function designToCanonical(design) {
    const entities = design.nodes.map((node) => ({
        id: node.id,
        name: node.label,
        kind: node.kind === "view" ? "view" : "table",
        fields: node.fields.map((field) => designFieldToCanonical(field)),
    }));
    const nodeById = new Map(design.nodes.map((n) => [n.id, n]));
    const relations = design.relationships
        .map((rel) => {
        const sourceNode = nodeById.get(rel.sourceNodeId);
        const targetNode = nodeById.get(rel.targetNodeId);
        if (!sourceNode || !targetNode) {
            return null;
        }
        const sourceField = sourceNode.fields.find((f) => f.id === rel.sourceFieldId);
        const targetField = targetNode.fields.find((f) => f.id === rel.targetFieldId);
        if (!sourceField || !targetField) {
            return null;
        }
        return {
            id: rel.id,
            sourceEntityName: sourceNode.label,
            sourceFieldName: sourceField.name,
            targetEntityName: targetNode.label,
            targetFieldName: targetField.name,
            cardinality: "1:N",
        };
    })
        .filter((rel) => rel !== null);
    return { entities, relations };
}
/** Convert a {@link DesignField} back into a {@link CanonicalField}. */
function designFieldToCanonical(field) {
    return {
        id: field.id,
        name: field.name,
        dataType: field.dataType,
        isPrimary: field.isPrimary,
        isForeign: field.isForeign,
        isNullable: field.isNullable,
        isUnique: field.isUnique,
        isNested: field.isNested,
        nestedFields: field.nestedFields?.map(designFieldToCanonical),
        ...(field.enum ? { enum: field.enum } : {}),
    };
}
/** Build a stable field lookup key from entity + field names. */
function fieldKey(entityName, fieldName) {
    return `${entityName.toLowerCase()}:${fieldName.toLowerCase()}`;
}
/**
 * Convert a runtime {@link DatabaseSchema} (from a live database driver) into a
 * {@link SchemaDesign} that the React Flow canvas can render directly.
 *
 * Driver-specific column type strings are normalized to {@link FieldDataType}
 * and relationships are resolved back to generated node/field ids so the
 * resulting graph draws correctly.
 */
function databaseSchemaToDesign(schema) {
    const nodes = [];
    const relationships = [];
    const nodeIdByTable = new Map();
    const fieldIdByColumn = new Map();
    for (const table of schema.tables) {
        const nodeId = (0, general_utils_1.generateNodeId)();
        nodeIdByTable.set(table.name.toLowerCase(), nodeId);
        if (table.schema && table.schema.length > 0) {
            nodeIdByTable.set(`${table.schema}.${table.name}`.toLowerCase(), nodeId);
        }
        const fields = table.columns.map((column) => {
            const fieldId = (0, general_utils_1.generateFieldId)();
            fieldIdByColumn.set(fieldKey(table.name, column.name), fieldId);
            return {
                id: fieldId,
                name: column.name,
                dataType: (0, helpers_1.normalizeDataType)(column.type),
                isPrimary: column.primaryKey ?? false,
                isNullable: column.nullable ?? true,
            };
        });
        nodes.push({
            id: nodeId,
            label: table.name,
            kind: table.type === "view" ? "view" : "table",
            color: (0, general_utils_1.generateNodeColor)(),
            fields,
        });
    }
    for (const rel of schema.relationships) {
        const sourceNodeId = nodeIdByTable.get(rel.sourceTable.toLowerCase());
        const targetNodeId = nodeIdByTable.get(rel.targetTable.toLowerCase());
        if (!sourceNodeId || !targetNodeId) {
            continue;
        }
        const sourceFieldId = fieldIdByColumn.get(fieldKey(rel.sourceTable, rel.sourceColumn));
        const targetFieldId = fieldIdByColumn.get(fieldKey(rel.targetTable, rel.targetColumn));
        if (!sourceFieldId || !targetFieldId) {
            continue;
        }
        // Mark the source column as a foreign key for visualization.
        const sourceNode = nodes.find((n) => n.id === sourceNodeId);
        const sourceField = sourceNode?.fields.find((f) => f.id === sourceFieldId);
        if (sourceField) {
            sourceField.isForeign = true;
        }
        relationships.push({
            id: (0, general_utils_1.generateNodeId)(),
            sourceNodeId,
            sourceFieldId,
            targetNodeId,
            targetFieldId,
        });
    }
    return { type: "schema", nodes, relationships };
}
//# sourceMappingURL=adapter.js.map