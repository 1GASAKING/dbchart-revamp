"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDbml = parseDbml;
const helpers_1 = require("../helpers");
/**
 * Parse a DBML (Database Markup Language) string into the canonical IR.
 *
 * Extracts `Table` blocks, their columns (including `pk`, `unique`,
 * `not null` settings), and `Ref` blocks which link fields between tables.
 * Unsupported DBML constructs (e.g. Project, Enum, Note) are tolerated and
 * surfaced as warnings.
 */
function parseDbml(input) {
    const warnings = [];
    const tables = [];
    const refs = [];
    // Strip comments (both // line and multi-line /* */).
    const clean = input
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\/\/[^\n]*/g, " ")
        .replace(/\n/g, " ")
        .replace(/\r/g, " ");
    const tableRegex = /Table\s+(?:(\[[^\]]*\])\s+)?["`']?([A-Za-z_][\w$]*)["`']?\s*(?:\[[^\]]*\])?\s*\{([^{}]*)\}/g;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(clean)) !== null) {
        const name = tableMatch[2];
        const body = tableMatch[3] ?? "";
        const fields = [];
        const columnRegex = /["`']?([A-Za-z_][\w$]*)["`']?\s+([A-Za-z_][\w$]*(?:\s*\|\s*[A-Za-z_][\w$]*)*)\s*(\[[^\]]*\])?/g;
        let colMatch;
        while ((colMatch = columnRegex.exec(body)) !== null) {
            // Skip index definitions and other non-column statements.
            if (/^(indexes|note)\s*\{/i.test(body)) {
                break;
            }
            fields.push({
                name: colMatch[1],
                dataType: colMatch[2].split("|")[0].trim(),
                settings: (colMatch[3] ?? "").toLowerCase(),
            });
        }
        tables.push({ name, fields });
    }
    // Parse `Enum <name> { value1 value2 }` blocks into a name → values map so
    // columns typed with an enum name keep their allowed values.
    const enums = new Map();
    const enumRegex = /Enum\s+(?:(?:\[[^\]]*\])\s+)?["`']?([A-Za-z_][\w$]*)["`']?\s*\{([^{}]*)\}/g;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(clean)) !== null) {
        const values = (0, helpers_1.parseEnumValues)(enumMatch[2] ?? "");
        if (values.length > 0) {
            enums.set(enumMatch[1].toLowerCase(), values);
        }
    }
    // Parse Ref relations. DBML Ref syntax:
    //   Ref name { table1.field1 < table2.field2 }
    //   Ref { table1.field1 < table2.field2 }
    const refRegex = /Ref\s+(?:(?:["`']?[\w$]+["`']?)\s*)?\{\s*["`']?([\w$]+)["`']?\s*\.\s*["`']?([\w$]+)["`']?\s*([<>\-])\s*["`']?([\w$]+)["`']?\s*\.\s*["`']?([\w$]+)["`']?\s*\}/g;
    let refMatch;
    while ((refMatch = refRegex.exec(clean)) !== null) {
        refs.push({
            endpoints: [
                { entity: refMatch[1], field: refMatch[2] },
                { entity: refMatch[4], field: refMatch[5] },
            ],
        });
    }
    if (tables.length === 0) {
        warnings.push("No Table blocks were found in the DBML input.");
    }
    const entities = tables.map((t) => {
        const fields = t.fields.map((col) => {
            const enumValues = enums.get(col.dataType.toLowerCase());
            return {
                id: (0, helpers_1.irId)("field"),
                name: col.name,
                dataType: enumValues
                    ? (0, helpers_1.normalizeEnumDataType)(col.dataType)
                    : (0, helpers_1.normalizeDataType)(col.dataType),
                isPrimary: /\[.*\bpk\b.*\]/.test(col.settings),
                isUnique: /\[.*\bunique\b.*\]/.test(col.settings),
                isNullable: !/\[.*\bnot\s+null\b.*\]/.test(col.settings),
                ...(enumValues ? { enum: { name: col.dataType, values: enumValues } } : {}),
            };
        });
        return {
            id: (0, helpers_1.irId)("entity"),
            name: t.name,
            kind: "table",
            fields,
        };
    });
    const entityByName = new Map(entities.map((e) => [e.name.toLowerCase(), e]));
    const relations = [];
    for (const ref of refs) {
        const [a, b] = ref.endpoints;
        if (!a || !b) {
            continue;
        }
        const sourceEntity = entityByName.get(a.entity.toLowerCase());
        const targetEntity = entityByName.get(b.entity.toLowerCase());
        if (!sourceEntity) {
            warnings.push(`Ref references unknown table "${a.entity}"`);
            continue;
        }
        if (!targetEntity) {
            warnings.push(`Ref references unknown table "${b.entity}"`);
            continue;
        }
        const sourceField = sourceEntity.fields.find((f) => f.name.toLowerCase() === a.field.toLowerCase());
        const targetField = targetEntity.fields.find((f) => f.name.toLowerCase() === b.field.toLowerCase());
        if (!sourceField || !targetField) {
            continue;
        }
        relations.push({
            id: (0, helpers_1.irId)("rel"),
            sourceEntityName: sourceEntity.name,
            sourceFieldName: sourceField.name,
            targetEntityName: targetEntity.name,
            targetFieldName: targetField.name,
            cardinality: "1:N",
        });
    }
    return { schema: { entities, relations }, warnings };
}
//# sourceMappingURL=dbml-parser.js.map