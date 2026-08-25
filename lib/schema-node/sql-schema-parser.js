"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSqlType = mapSqlType;
exports.parseSqlSchema = parseSqlSchema;
const general_utils_1 = require("../utils/general-utils");
/**
 * Color used to visually mark primary-key fields. Mirrors the value used by
 * the schema node components in the webview.
 */
const PRIMARY_KEY_COLOR = "#4CAF50";
/**
 * Map from raw SQL type names to the canonical {@link FieldDataType}.
 * Handles parameterised types (e.g. `varchar(255)`), type modifiers
 * (e.g. `double precision`), and common vendor aliases.
 */
const SQL_TYPE_MAP = {
    int: "int",
    integer: "int",
    smallint: "int",
    mediumint: "int",
    serial: "int",
    bigint: "bigint",
    bigserial: "bigint",
    varchar: "varchar",
    char: "varchar",
    nvarchar: "varchar",
    nchar: "varchar",
    "character varying": "varchar",
    character: "varchar",
    text: "text",
    tinytext: "text",
    mediumtext: "text",
    longtext: "text",
    boolean: "boolean",
    bool: "boolean",
    bit: "boolean",
    decimal: "decimal",
    numeric: "decimal",
    money: "decimal",
    float: "float",
    real: "float",
    double: "float",
    "double precision": "float",
    date: "date",
    timestamp: "timestamp",
    datetime: "timestamp",
    datetime2: "timestamp",
    smalldatetime: "timestamp",
    "timestamp with time zone": "timestamp",
    "timestamp without time zone": "timestamp",
    time: "time",
    "time with time zone": "time",
    "time without time zone": "time",
    json: "json",
    jsonb: "json",
    uuid: "uuid",
    uniqueidentifier: "uuid",
    bytea: "bytea",
    blob: "bytea",
    varbinary: "bytea",
    binary: "bytea",
};
/**
 * Map a raw SQL type name to the canonical {@link FieldDataType}.
 *
 * Strips length/scale parameters first, then checks the full cleaned name
 * and each whitespace-delimited token (e.g. `character varying`).
 */
function mapSqlType(rawType) {
    const cleaned = rawType.replace(/\(.*\)/g, "").trim().toLowerCase();
    if (SQL_TYPE_MAP[cleaned]) {
        return SQL_TYPE_MAP[cleaned];
    }
    for (const token of cleaned.split(/\s+/)) {
        const mapped = SQL_TYPE_MAP[token];
        if (mapped) {
            return mapped;
        }
    }
    return "varchar";
}
/** Strip schema qualifiers and surrounding quote characters from an identifier. */
function cleanIdentifier(identifier) {
    return identifier
        .split(".")
        .pop()
        .replace(/[`"[\]]/g, "")
        .trim();
}
/** Remove SQL block (`/* ... *​/`) and line (`--` / `#`) comments. */
function stripSqlComments(sql) {
    const withoutBlockComments = sql.replace(/\/\*[\s\S]*?\*\//g, "");
    return withoutBlockComments
        .split("\n")
        .map((line) => line.replace(/(--|#).*$/, ""))
        .join("\n");
}
/**
 * Split a CREATE TABLE body into top-level statements separated by commas.
 * Parenthesised groups (e.g. `decimal(10, 2)`, `varchar(255)`) are respected.
 */
function splitTopLevel(text) {
    const result = [];
    let depth = 0;
    let current = "";
    for (const char of text) {
        if (char === "(") {
            depth++;
        }
        else if (char === ")") {
            depth--;
            if (depth < 0) {
                depth = 0;
            }
        }
        if (char === "," && depth === 0) {
            result.push(current.trim());
            current = "";
        }
        else {
            current += char;
        }
    }
    if (current.trim()) {
        result.push(current.trim());
    }
    return result;
}
/**
 * Given an opening parenthesis index, scan forward to the matching closing
 * parenthesis and return the text between them.
 */
function extractMatchingBlock(text, openIndex) {
    let depth = 0;
    for (let i = openIndex; i < text.length; i++) {
        const char = text[i];
        if (char === "(") {
            depth++;
        }
        else if (char === ")") {
            depth--;
            if (depth === 0) {
                return { body: text.slice(openIndex + 1, i), endIndex: i + 1 };
            }
        }
    }
    return { body: "", endIndex: text.length };
}
/** Extract all `CREATE TABLE` names and their bodies from SQL text. */
function extractCreateTables(sql) {
    const results = [];
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const name = cleanIdentifier(match[1]);
        const openParenIndex = sql.indexOf("(", regex.lastIndex);
        if (openParenIndex === -1) {
            continue;
        }
        const block = extractMatchingBlock(sql, openParenIndex);
        if (block.body === "") {
            regex.lastIndex = block.endIndex;
            continue;
        }
        results.push({ name, body: block.body });
        regex.lastIndex = block.endIndex;
    }
    return results;
}
/** Extract `ALTER TABLE ... ADD [CONSTRAINT ...] FOREIGN KEY ...` constraints. */
function extractAlterTableForeignKeys(sql) {
    const results = [];
    const regex = /ALTER\s+TABLE\s+(?:ONLY\s+)?([^\s]+)\s+ADD\s+(?:CONSTRAINT\s+[\w$]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/gi;
    let match;
    while ((match = regex.exec(sql)) !== null) {
        const localTable = cleanIdentifier(match[1]);
        const localColumns = match[2].split(",").map(cleanIdentifier);
        const targetTable = cleanIdentifier(match[3]);
        const targetColumns = match[4].split(",").map(cleanIdentifier);
        localColumns.forEach((localColumn, index) => {
            results.push({
                localTable,
                localColumn,
                targetTable,
                targetColumn: targetColumns[index] ?? targetColumns[0],
            });
        });
    }
    return results;
}
/**
 * Parse a column definition statement from a CREATE TABLE body.
 *
 * Handles both inline foreign keys (`user_id INT REFERENCES users(id)`) and
 * inline/column-level primary keys (`id INT PRIMARY KEY`).
 */
function parseColumnDefinition(statement) {
    // Column name — supports `name`, "name", [name], and bare name.
    const nameMatch = statement.match(/^(?:`([^`]+)`|"([^"]+)"|\[([^\]]+)\]|([\w$]+))/);
    if (!nameMatch) {
        return null;
    }
    const name = (nameMatch[1] ?? nameMatch[2] ?? nameMatch[3] ?? nameMatch[4]).trim();
    const rest = statement.slice(nameMatch[0].length).trim();
    if (!rest) {
        return null;
    }
    // Data type — first token, optionally followed by `precision`/`varying`
    // and a parameter list.
    const typeMatch = rest.match(/^[\w$]+(?:\s+(?:precision|varying))?(?:\([^)]*\))?/i);
    const rawType = typeMatch ? typeMatch[0] : "varchar";
    const upper = statement.toUpperCase();
    const isPrimaryKey = /\bPRIMARY\s+KEY\b/.test(upper);
    const refMatch = statement.match(/REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
    const foreignKey = refMatch
        ? {
            localColumn: name,
            targetTable: cleanIdentifier(refMatch[1]),
            targetColumn: cleanIdentifier(refMatch[2]),
        }
        : undefined;
    return {
        name,
        dataType: mapSqlType(rawType),
        isPrimaryKey,
        foreignKey,
    };
}
/** Parse a CREATE TABLE body into columns and foreign keys. */
function parseCreateTableBody(body) {
    const columns = [];
    const foreignKeys = [];
    const tableLevelPrimaryKeys = [];
    for (const statement of splitTopLevel(body)) {
        if (!statement) {
            continue;
        }
        // Table-level foreign key constraint.
        const fkMatch = statement.match(/^(?:CONSTRAINT\s+[\w$]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
            const localColumns = fkMatch[1].split(",").map(cleanIdentifier);
            const targetColumns = fkMatch[3].split(",").map(cleanIdentifier);
            const targetTable = cleanIdentifier(fkMatch[2]);
            localColumns.forEach((localColumn, index) => {
                foreignKeys.push({
                    localColumn,
                    targetTable,
                    targetColumn: targetColumns[index] ?? targetColumns[0],
                });
            });
            continue;
        }
        // Table-level primary key constraint.
        const pkMatch = statement.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
            tableLevelPrimaryKeys.push(...pkMatch[1].split(",").map(cleanIdentifier));
            continue;
        }
        // Skip UNIQUE table constraints.
        if (/^(?:CONSTRAINT\s+[\w$]+\s+)?UNIQUE\s*\(/i.test(statement)) {
            continue;
        }
        // Column definition.
        const column = parseColumnDefinition(statement);
        if (column) {
            columns.push(column);
        }
    }
    // Apply table-level primary keys to the matching columns.
    for (const pk of tableLevelPrimaryKeys) {
        const column = columns.find((c) => c.name.toLowerCase() === pk.toLowerCase());
        if (column) {
            column.isPrimaryKey = true;
        }
    }
    return { columns, foreignKeys };
}
// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
/**
 * Parse SQL DDL text into a {@link SchemaDesign}.
 *
 * Supports:
 * - `CREATE TABLE` statements (with or without schema qualifiers/quotes)
 * - Inline `REFERENCES` on columns
 * - Table-level `FOREIGN KEY` and `PRIMARY KEY` constraints
 * - `ALTER TABLE ... ADD [CONSTRAINT] FOREIGN KEY ...` statements
 *
 * Parsing is regex/line-based and intentionally dependency-free. Data types
 * are mapped through {@link mapSqlType}; relationships are inferred from
 * foreign key declarations.
 */
function parseSqlSchema(sql) {
    const counters = { node: 0, field: 0, relationship: 0 };
    const nodes = [];
    const relationships = [];
    const cleanSql = stripSqlComments(sql);
    const createTables = extractCreateTables(cleanSql);
    const alterForeignKeys = extractAlterTableForeignKeys(cleanSql);
    /** Nodes indexed by lower-cased table label for FK resolution. */
    const nodeIndexByLabel = new Map();
    /** Relationship requirements collected before all tables exist. */
    const pendingRelationships = [];
    // 1. Parse all CREATE TABLE statements into nodes.
    for (const table of createTables) {
        const parsed = parseCreateTableBody(table.body);
        const fields = parsed.columns.map((column) => ({
            id: `field-${counters.field++}`,
            name: column.name,
            dataType: column.dataType,
            connectable: column.isPrimaryKey ||
                column.foreignKey !== undefined ||
                /_id$/i.test(column.name),
            color: column.isPrimaryKey ? PRIMARY_KEY_COLOR : undefined,
        }));
        const node = {
            id: `node-${counters.node++}`,
            label: table.name,
            kind: "table",
            color: (0, general_utils_1.generateNodeColor)(),
            fields,
        };
        nodes.push(node);
        nodeIndexByLabel.set(table.name.toLowerCase(), node);
        // Collect FK requirements declared inside the CREATE TABLE.
        for (const fk of parsed.foreignKeys) {
            const sourceField = fields.find((f) => f.name.toLowerCase() === fk.localColumn.toLowerCase());
            if (!sourceField) {
                continue;
            }
            pendingRelationships.push({
                sourceNodeId: node.id,
                sourceFieldId: sourceField.id,
                targetTable: fk.targetTable,
                targetColumn: fk.targetColumn,
            });
        }
    }
    // 2. Resolve FK requirements now that all tables exist.
    const resolveRelationships = (requirements) => {
        for (const requirement of requirements) {
            const targetNode = nodeIndexByLabel.get(requirement.targetTable.toLowerCase());
            if (!targetNode) {
                continue;
            }
            const targetField = targetNode.fields.find((f) => f.name.toLowerCase() === requirement.targetColumn.toLowerCase()) ?? targetNode.fields[0];
            if (!targetField) {
                continue;
            }
            relationships.push({
                id: `rel-${counters.relationship++}`,
                sourceNodeId: requirement.sourceNodeId,
                sourceFieldId: requirement.sourceFieldId,
                targetNodeId: targetNode.id,
                targetFieldId: targetField.id,
            });
        }
    };
    resolveRelationships(pendingRelationships);
    // 3. Resolve ALTER TABLE foreign keys.
    const alterRequirements = alterForeignKeys
        .filter((fk) => nodeIndexByLabel.has(fk.localTable.toLowerCase()))
        .map((fk) => {
        const sourceNode = nodeIndexByLabel.get(fk.localTable.toLowerCase());
        const sourceField = sourceNode.fields.find((f) => f.name.toLowerCase() === fk.localColumn.toLowerCase());
        if (!sourceField) {
            return null;
        }
        return {
            sourceNodeId: sourceNode.id,
            sourceFieldId: sourceField.id,
            targetTable: fk.targetTable,
            targetColumn: fk.targetColumn,
        };
    })
        .filter((entry) => entry !== null);
    resolveRelationships(alterRequirements);
    return { type: "schema", nodes, relationships };
}
//# sourceMappingURL=sql-schema-parser.js.map