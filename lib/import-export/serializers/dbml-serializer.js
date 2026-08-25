"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDbml = serializeDbml;
const TYPE_DBML_MAP = {
    varchar: "varchar",
    int: "int",
    bigint: "bigint",
    text: "text",
    boolean: "boolean",
    decimal: "decimal",
    float: "float",
    date: "date",
    timestamp: "timestamp",
    time: "time",
    json: "json",
    uuid: "uuid",
    bytea: "bytea",
};
/** Serialize a canonical schema to DBML. */
function serializeDbml(schema) {
    const lines = [];
    const entityIdByName = new Map(schema.entities.map((e) => [e.name.toLowerCase(), e]));
    // Collect enum definitions. Named enums keep their name; anonymous inline
    // enums get a synthetic `<entity>_<field>` name so they round-trip.
    // DBML enum members are single tokens, so values containing whitespace fall
    // back to the plain base type.
    const enumRefKey = (entityName, fieldName) => `${entityName.toLowerCase()}:${fieldName.toLowerCase()}`;
    const enumByName = new Map();
    const fieldEnumName = new Map();
    for (const entity of schema.entities) {
        for (const field of entity.fields) {
            if (!field.enum?.values?.length) {
                continue;
            }
            if (field.enum.values.some((v) => /\s/.test(v))) {
                continue;
            }
            const name = field.enum.name && field.enum.name.length > 0
                ? field.enum.name
                : `${entity.name}_${field.name}`;
            enumByName.set(name.toLowerCase(), { name, values: field.enum.values });
            fieldEnumName.set(enumRefKey(entity.name, field.name), name);
        }
    }
    for (const { name, values } of enumByName.values()) {
        lines.push(`Enum ${name} {`);
        lines.push(`  ${values.join(" ")}`);
        lines.push("}");
        lines.push("");
    }
    for (const entity of schema.entities) {
        lines.push(`Table ${entity.name} {`);
        for (const field of entity.fields) {
            const settings = fieldSettings(field);
            const enumName = fieldEnumName.get(enumRefKey(entity.name, field.name));
            const type = enumName ?? TYPE_DBML_MAP[field.dataType] ?? "varchar";
            lines.push(`  ${field.name} ${type}${settings}`);
        }
        lines.push("}");
        lines.push("");
    }
    for (const rel of schema.relations) {
        const source = entityIdByName.get(rel.sourceEntityName.toLowerCase());
        const target = entityIdByName.get(rel.targetEntityName.toLowerCase());
        if (!source || !target) {
            continue;
        }
        lines.push(`Ref { ${rel.sourceEntityName}.${rel.sourceFieldName} < ${rel.targetEntityName}.${rel.targetFieldName} }`);
    }
    return lines.join("\n").trim() + "\n";
}
/** Build the DBML `[settings]` suffix for a field. */
function fieldSettings(field) {
    const settings = [];
    if (field.isPrimary) {
        settings.push("pk");
    }
    if (field.isUnique && !field.isPrimary) {
        settings.push("unique");
    }
    if (field.isNullable === false) {
        settings.push("not null");
    }
    if (settings.length === 0) {
        return "";
    }
    return ` [${settings.join(", ")}]`;
}
//# sourceMappingURL=dbml-serializer.js.map