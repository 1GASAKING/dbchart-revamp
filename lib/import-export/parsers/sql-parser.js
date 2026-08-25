"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSql = parseSql;
const helpers_1 = require("../helpers");
/**
 * Parse a SQL DDL (schema-only) string into the canonical IR.
 *
 * Handles PostgreSQL/MySQL/SQLite style `CREATE TABLE` statements, inline
 * column constraints (PRIMARY KEY, NOT NULL, UNIQUE, REFERENCES), and table
 * level FOREIGN KEY (...) REFERENCES clauses.
 */
function parseSql(input) {
    const warnings = [];
    const tables = new Map();
    // Named enum types, e.g. `CREATE TYPE mood AS ENUM ('sad', 'ok')`.
    const namedEnums = new Map();
    // Normalize whitespace, strip line comments and block comments.
    const normalized = input
        .replace(/--[^\n]*/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/\n/g, " ")
        .replace(/\r/g, " ");
    // Split on statement boundaries, preserving commas within columns.
    const statements = splitStatements(normalized);
    for (const statement of statements) {
        const trimmed = statement.trim();
        if (!trimmed) {
            continue;
        }
        // CREATE TABLE / VIEW handling
        const createMatch = trimmed.match(/^CREATE\s+(TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([^\s("`']+)["`']?/i);
        if (createMatch) {
            const kind = createMatch[1].toLowerCase();
            const name = unquoteIdentifier(createMatch[2]);
            const body = extractBody(trimmed);
            const columns = parseColumns(body, warnings);
            const tableConstraints = parseTableConstraints(body, warnings, name);
            tables.set(name.toLowerCase(), {
                name,
                kind,
                columns,
                tableConstraints,
            });
            {
                continue;
            }
        }
        // Named enum types, e.g. CREATE TYPE status AS ENUM ('pending', 'shipped').
        const createEnum = trimmed.match(/^CREATE\s+TYPE\s+["`']?([^\s("`']+)["`']?\s+AS\s+ENUM\s*\((.+)\)$/i);
        if (createEnum) {
            namedEnums.set(unquoteIdentifier(createEnum[1]).toLowerCase(), (0, helpers_1.parseEnumValues)(createEnum[2]));
            {
                continue;
            }
        }
        // ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
        const alterFk = trimmed.match(/ALTER\s+TABLE\s+["`']?([^\s]+)["`']?\s+ADD\s+CONSTRAINT\s+["`']?[^\s]+["`']?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i);
        if (alterFk) {
            const sourceTable = unquoteIdentifier(alterFk[1]).toLowerCase();
            const sourceCol = stripQuotesAndSpace(alterFk[2]);
            const targetTable = unquoteIdentifier(alterFk[3]);
            const targetCol = stripQuotesAndSpace(alterFk[4]);
            const existing = tables.get(sourceTable);
            if (existing) {
                existing.tableConstraints.push({
                    type: "fk",
                    columns: [sourceCol],
                    references: { entity: targetTable, field: targetCol },
                });
            }
            else {
                warnings.push(`ALTER TABLE references unknown table "${sourceTable}"`);
            }
            {
                continue;
            }
        }
        // ALTER TABLE ... ADD FOREIGN KEY (without constraint name)
        const alterFk2 = trimmed.match(/ALTER\s+TABLE\s+["`']?([^\s]+)["`']?\s+ADD\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i);
        if (alterFk2) {
            const sourceTable = unquoteIdentifier(alterFk2[1]).toLowerCase();
            const sourceCol = stripQuotesAndSpace(alterFk2[2]);
            const targetTable = unquoteIdentifier(alterFk2[3]);
            const targetCol = stripQuotesAndSpace(alterFk2[4]);
            const existing = tables.get(sourceTable);
            if (existing) {
                existing.tableConstraints.push({
                    type: "fk",
                    columns: [sourceCol],
                    references: { entity: targetTable, field: targetCol },
                });
            }
            {
                continue;
            }
        }
    }
    // Convert map to canonical entities.
    const entities = [];
    for (const def of tables.values()) {
        const entityId = (0, helpers_1.irId)("entity");
        const fields = def.columns
            .map((col) => {
            const fk = def.tableConstraints.find((c) => c.type === "fk" && c.columns.includes(col.name.toLowerCase()));
            const pk = def.tableConstraints.find((c) => c.type === "pk" && c.columns.includes(col.name.toLowerCase()));
            const enumMeta = resolveEnumMeta(col, namedEnums);
            return {
                id: (0, helpers_1.irId)("field"),
                name: col.name,
                dataType: enumMeta
                    ? (0, helpers_1.normalizeEnumDataType)(col.dataType)
                    : (0, helpers_1.normalizeDataType)(col.dataType),
                isPrimary: col.isPrimary || Boolean(pk),
                isForeign: col.isForeign || Boolean(fk),
                isNullable: col.isNullable ?? true,
                isUnique: col.isUnique,
                ...(enumMeta ? { enum: enumMeta } : {}),
            };
        });
        entities.push({
            id: entityId,
            name: def.name,
            kind: def.kind,
            fields,
        });
    }
    // Build relations from foreign key constraints.
    const relations = [];
    const entitiesByName = new Map(entities.map((e) => [e.name.toLowerCase(), e]));
    for (const def of tables.values()) {
        const sourceEntity = entitiesByName.get(def.name.toLowerCase());
        if (!sourceEntity) {
            continue;
        }
        for (const constraint of def.tableConstraints) {
            if (constraint.type !== "fk" || !constraint.references) {
                continue;
            }
            const targetEntity = entitiesByName.get(constraint.references.entity.toLowerCase());
            // A single-column FK maps to one relation.
            const sourceField = sourceEntity.fields.find((f) => f.name.toLowerCase() === constraint.columns[0]?.toLowerCase());
            const targetField = targetEntity?.fields.find((f) => f.name.toLowerCase() === constraint.references.field.toLowerCase());
            if (!targetEntity) {
                warnings.push(`Foreign key on "${def.name}" references missing table "${constraint.references.entity}"`);
                {
                    continue;
                }
            }
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
    }
    if (entities.length === 0) {
        warnings.push("No CREATE TABLE statements were found in the SQL input.");
    }
    return { schema: { entities, relations }, warnings };
}
/** Resolve enum metadata for a column: inline `ENUM(...)` or a named type. */
function resolveEnumMeta(col, namedEnums) {
    if (col.enumValues && col.enumValues.length > 0) {
        return { values: col.enumValues };
    }
    const named = namedEnums.get(col.dataType.toLowerCase());
    if (named && named.length > 0) {
        return { name: col.dataType, values: named };
    }
    return undefined;
}
/** Split a SQL string into top-level statements on `;`. */
function splitStatements(input) {
    const statements = [];
    let depth = 0;
    let current = "";
    for (const char of input) {
        if (char === "(") {
            {
                depth++;
            }
        }
        if (char === ")") {
            {
                depth--;
            }
        }
        if (char === ";" && depth === 0) {
            statements.push(current);
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        statements.push(current);
    }
    return statements;
}
/** Extract the parenthesized body of a CREATE statement. */
function extractBody(statement) {
    const start = statement.indexOf("(");
    if (start === -1) {
        return "";
    }
    // find matching close parent; body is the interior.
    let depth = 0;
    for (let i = start; i < statement.length; i++) {
        if (statement[i] === "(") {
            depth++;
        }
        if (statement[i] === ")") {
            {
                depth--;
            }
            if (depth === 0) {
                return statement.slice(start + 1, i);
            }
        }
    }
    return statement.slice(start + 1);
}
/** Split a body into comma-separated top-level definitions. */
function splitTopLevelCommas(body) {
    const parts = [];
    let depth = 0;
    let current = "";
    for (const char of body) {
        if (char === "(") {
            depth++;
        }
        if (char === ")") {
            depth--;
        }
        if (char === "," && depth === 0) {
            parts.push(current);
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        parts.push(current);
    }
    return parts;
}
/** Parse column definitions from a CREATE TABLE body. */
function parseColumns(body, warnings) {
    const columns = [];
    for (const raw of splitTopLevelCommas(body)) {
        // Skip table-level constraints (they begin with CONSTRAINT, PRIMARY, FOREIGN, UNIQUE, CHECK).
        if (/^CONSTRAINT\b/i.test(raw.trim())) {
            continue;
        }
        if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK)\b/i.test(raw.trim())) {
            continue;
        }
        const col = parseColumnDefinition(raw, warnings);
        if (col) {
            columns.push(col);
        }
    }
    return columns;
}
/** Parse a single column definition. */
function parseColumnDefinition(raw, _warnings) {
    // Patterns: "col_name TYPE [constraints]" or "col_name TYPE," etc.
    const m = raw.trim().match(/^["`']?([^\s"`']+)["`']?\s+([^\s,()]+)(.*)$/i);
    if (!m) {
        return null;
    }
    const name = unquoteIdentifier(m[1]);
    const dataType = m[2];
    const rest = (m[3] ?? "").toUpperCase();
    const def = { name, dataType };
    // Inline enum: `status ENUM('pending', 'processing')`. Preserve values.
    const inlineEnum = raw.match(/ENUM\s*\(\s*([^)]*)\)\s*$/i) ?? raw.match(/ENUM\s*\(\s*([^)]*)\)/i);
    if (inlineEnum) {
        def.enumValues = (0, helpers_1.parseEnumValues)(inlineEnum[1]);
    }
    if (/NOT\s+NULL/.test(rest)) {
        def.isNullable = false;
    }
    else {
        def.isNullable = true;
    }
    if (/PRIMARY\s+KEY/.test(rest)) {
        def.isPrimary = true;
    }
    if (/UNIQUE/.test(rest)) {
        def.isUnique = true;
    }
    const ref = raw.match(/REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i);
    if (ref) {
        def.isForeign = true;
        def.references = { entity: unquoteIdentifier(ref[1]), field: stripQuotesAndSpace(ref[2]) };
    }
    return def;
}
/** Parse table-level constraints (PRIMARY KEY and FOREIGN KEY). */
function parseTableConstraints(body, _warnings, _tableName) {
    const constraints = [];
    for (const raw of splitTopLevelCommas(body)) {
        const t = raw.trim();
        const pk = t.match(/^(?:CONSTRAINT\s+["`']?[^\s]+["`']?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pk) {
            constraints.push({
                type: "pk",
                columns: splitIdentifierList(pk[1]),
            });
            {
                continue;
            }
        }
        const fk = t.match(/^(?:CONSTRAINT\s+["`']?[^\s]+["`']?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+["`']?([^\s("`']+)["`']?\s*\(([^)]+)\)/i);
        if (fk) {
            constraints.push({
                type: "fk",
                columns: splitIdentifierList(fk[1]),
                references: {
                    entity: unquoteIdentifier(fk[2]),
                    field: stripQuotesAndSpace(fk[3]),
                },
            });
            {
                continue;
            }
        }
    }
    return constraints;
}
/** Split a comma-separated list of identifiers, stripping quotes/spaces. */
function splitIdentifierList(raw) {
    return raw
        .split(",")
        .map((s) => stripQuotesAndSpace(s))
        .filter(Boolean);
}
/** Remove surrounding quotes and whitespace from a single identifier. */
function stripQuotesAndSpace(raw) {
    return raw.trim().replace(/^["`']|["`']$/g, "");
}
/** Remove surrounding quotes from an identifier. */
function unquoteIdentifier(raw) {
    return raw.trim().replace(/^["`']|["`']$/g, "");
}
//# sourceMappingURL=sql-parser.js.map