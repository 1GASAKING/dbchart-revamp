"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.irId = irId;
exports.resetIrIdCounter = resetIrIdCounter;
exports.normalizeDataType = normalizeDataType;
exports.parseEnumValues = parseEnumValues;
exports.normalizeEnumDataType = normalizeEnumDataType;
exports.isSameSchema = isSameSchema;
/** Deterministic id prefix counter (kept simple; no external deps). */
let idCounter = 0;
/** Generate a unique id with a stable prefix (no randomness for IR). */
function irId(prefix) {
    idCounter += 1;
    return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}
/** Reset the id counter (useful for tests). */
function resetIrIdCounter() {
    idCounter = 0;
}
/**
 * Map an arbitrary external SQL/DBML/JSON type string to one of the supported
 * {@link FieldDataType}s. Falls back to "json" for unknown/mixed/object types.
 */
function normalizeDataType(raw) {
    const t = raw.trim().toLowerCase();
    // Strip length/precision qualifiers, e.g. "varchar(255)" -> "varchar".
    const base = t.replace(/\(.*$/g, "").trim();
    const map = {
        // text / string
        varchar: "varchar",
        char: "varchar",
        character: "varchar",
        nvarchar: "varchar",
        string: "varchar",
        text: "text",
        longtext: "text",
        mediumtext: "text",
        tinytext: "text",
        citext: "text",
        enum: "varchar",
        // integers
        int: "int",
        integer: "int",
        int2: "int",
        int4: "int",
        smallint: "int",
        tinyint: "int",
        mediumint: "int",
        serial: "int",
        bigserial: "bigint",
        bigint: "bigint",
        int8: "bigint",
        number: "bigint",
        long: "bigint",
        // floats
        decimal: "decimal",
        numeric: "decimal",
        money: "decimal",
        double: "float",
        "double precision": "float",
        float8: "float",
        float: "float",
        real: "float",
        float4: "float",
        // boolean
        bool: "boolean",
        boolean: "boolean",
        // date / time
        date: "date",
        datetime: "timestamp",
        timestamp: "timestamp",
        timestamptz: "timestamp",
        timetz: "time",
        time: "time",
        // json / binary
        json: "json",
        jsonb: "json",
        array: "json",
        object: "json",
        document: "json",
        uuid: "uuid",
        uniqueidentifier: "uuid",
        blob: "bytea",
        bytea: "bytea",
        binary: "bytea",
        varbinary: "bytea",
        "unsigned big int": "bigint",
    };
    return map[base] ?? "json";
}
/**
 * Parse the value list out of an enum declaration into clean strings.
 *
 * Handles the three styles used across formats:
 *   - SQL:     `ENUM('pending', 'processing', 'shipped')`
 *   - DBML:    `Enum Status { pending processing shipped }`
 *   - OpenAPI: a JSON array `["pending", "processing"]`
 */
function parseEnumValues(raw) {
    if (Array.isArray(raw)) {
        return raw.map((v) => String(v)).filter((s) => s.length > 0);
    }
    if (typeof raw !== "string") {
        return [];
    }
    // Quoted values take precedence (they may contain spaces or commas).
    const quoted = raw.match(/['"]([^'"]*)['"]/g);
    if (quoted && quoted.length > 0) {
        return quoted
            .map((q) => q.slice(1, -1).trim())
            .filter((s) => s.length > 0);
    }
    // Otherwise split on commas and/or whitespace (DBML enum member lists).
    return raw
        .split(/[\s,]+/)
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter((s) => s.length > 0);
}
/**
 * Normalize a data type for a field that carries enum metadata. Unknown
 * custom type names (e.g. PostgreSQL `CREATE TYPE mood AS ENUM (...)` used as
 * a column type) fall through {@link normalizeDataType} to "json" — but an
 * enum is a constrained string list, not an object, so coerce that fallback
 * to "varchar" while keeping any recognizable scalar type.
 */
function normalizeEnumDataType(raw) {
    const normalized = normalizeDataType(raw);
    return normalized === "json" ? "varchar" : normalized;
}
/** Whether two schemas are structurally equal (used mostly in tests). */
function isSameSchema(a, b) {
    if (a.entities.length !== b.entities.length) {
        return false;
    }
    if (a.relations.length !== b.relations.length) {
        return false;
    }
    const byName = new Map(a.entities.map((e) => [e.name, e]));
    for (const eb of b.entities) {
        const ea = byName.get(eb.name);
        if (!ea) {
            return false;
        }
        if (ea.kind !== eb.kind) {
            return false;
        }
        if (ea.fields.length !== eb.fields.length) {
            return false;
        }
        const fa = new Map(ea.fields.map((f) => [f.name, f]));
        for (const fb of eb.fields) {
            const f = fa.get(fb.name);
            if (!f) {
                return false;
            }
            if (f.dataType !== fb.dataType) {
                return false;
            }
            if (f.isPrimary !== fb.isPrimary) {
                return false;
            }
            if (f.isForeign !== fb.isForeign) {
                return false;
            }
            if (f.isNullable !== fb.isNullable) {
                return false;
            }
            if (f.isUnique !== fb.isUnique) {
                return false;
            }
            if ((f.enum?.name ?? "") !== (fb.enum?.name ?? "")) {
                return false;
            }
            if ((f.enum?.values ?? []).join("\u0000") !== (fb.enum?.values ?? []).join("\u0000")) {
                return false;
            }
        }
    }
    return true;
}
//# sourceMappingURL=helpers.js.map