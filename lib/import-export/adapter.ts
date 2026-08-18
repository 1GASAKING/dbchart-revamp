import type {
  DesignField,
  DesignRelationship,
  SchemaDesign,
  SchemaNode,
} from "@dbchart/schema";
import {
  generateFieldId,
  generateNodeColor,
  generateNodeId,
} from "../utils/general-utils";
import type {
  CanonicalEntity,
  CanonicalField,
  CanonicalRelation,
  CanonicalSchema,
} from "./types";

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
export function canonicalToDesign(schema: CanonicalSchema): SchemaDesign {
  const nodes: SchemaNode[] = [];
  const relations: DesignRelationship[] = [];

  const nodeIdByName = new Map<string, string>();
  const fieldIdByKey = new Map<string, string>();

  for (const entity of schema.entities) {
    const nodeId = generateNodeId();
    nodeIdByName.set(entity.name.toLowerCase(), nodeId);

    const fields: DesignField[] = entity.fields.map((field) =>
      canonicalFieldToDesignField(field, fieldIdByKey, entity.name)
    );

    nodes.push({
      id: nodeId,
      label: entity.name,
      kind: entity.kind === "collection" ? "table" : entity.kind,
      color: generateNodeColor(),
      fields,
    });
  }

  for (const rel of schema.relations) {
    const sourceNodeId = nodeIdByName.get(rel.sourceEntityName.toLowerCase());
    const targetNodeId = nodeIdByName.get(rel.targetEntityName.toLowerCase());
    if (!sourceNodeId || !targetNodeId){ continue;}

    const sourceFieldId = fieldIdByKey.get(
      fieldKey(rel.sourceEntityName, rel.sourceFieldName)
    );
    const targetFieldId = fieldIdByKey.get(
      fieldKey(rel.targetEntityName, rel.targetFieldName)
    );
    if (!sourceFieldId || !targetFieldId){ continue;}

    relations.push({
      id: generateNodeId(),
      sourceNodeId,
      sourceFieldId,
      targetNodeId,
      targetFieldId,
    });
  }

  return { type: "schema", nodes, relationships: relations };
}

/** Convert a single canonical field to a {@link DesignField}. */
function canonicalFieldToDesignField(
  field: CanonicalField,
  fieldIdByKey: Map<string, string>,
  entityName: string
): DesignField {
  const fieldId = generateFieldId();
  fieldIdByKey.set(fieldKey(entityName, field.name), fieldId);

  const out: DesignField = {
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
  };

  if (field.nestedFields && field.nestedFields.length > 0) {
    out.nestedFields = field.nestedFields.map((nested) =>
      canonicalNestedFieldToDesignField(nested)
    );
  }

  return out;
}

/** Convert a nested canonical field (no relationship resolution needed). */
function canonicalNestedFieldToDesignField(field: CanonicalField): DesignField {
  const out: DesignField = {
    id: generateFieldId(),
    name: field.name,
    dataType: field.dataType,
    isPrimary: field.isPrimary,
    isForeign: field.isForeign,
    isNullable: field.isNullable,
    isUnique: field.isUnique,
    isNested: field.isNested,
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
export function designToCanonical(design: SchemaDesign): CanonicalSchema {
  const entities: CanonicalEntity[] = design.nodes.map((node) => ({
    id: node.id,
    name: node.label,
    kind: node.kind === "view" ? "view" : "table",
    fields: node.fields.map((field) => designFieldToCanonical(field)),
  }));

  const nodeById = new Map(design.nodes.map((n) => [n.id, n]));
  const relations: CanonicalRelation[] = design.relationships
    .map((rel): CanonicalRelation | null => {
      const sourceNode = nodeById.get(rel.sourceNodeId);
      const targetNode = nodeById.get(rel.targetNodeId);
      if (!sourceNode || !targetNode) {return null;}

      const sourceField = sourceNode.fields.find((f) => f.id === rel.sourceFieldId);
      const targetField = targetNode.fields.find((f) => f.id === rel.targetFieldId);
      if (!sourceField || !targetField) {return null;}

      return {
        id: rel.id,
        sourceEntityName: sourceNode.label,
        sourceFieldName: sourceField.name,
        targetEntityName: targetNode.label,
        targetFieldName: targetField.name,
        cardinality: "1:N",
      };
    })
    .filter((rel): rel is CanonicalRelation => rel !== null);

  return { entities, relations };
}

/** Convert a {@link DesignField} back into a {@link CanonicalField}. */
function designFieldToCanonical(field: DesignField): CanonicalField {
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
  };
}

/** Build a stable field lookup key from entity + field names. */
function fieldKey(entityName: string, fieldName: string): string {
  return `${entityName.toLowerCase()}:${fieldName.toLowerCase()}`;
}