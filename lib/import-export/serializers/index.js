"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeJson = exports.serializeDbml = exports.serializeSql = void 0;
exports.serializeSchema = serializeSchema;
const sql_serializer_1 = require("./sql-serializer");
const dbml_serializer_1 = require("./dbml-serializer");
const json_serializer_1 = require("./json-serializer");
/** Serialize a canonical schema to a string based on the requested format. */
function serializeSchema(format, schema) {
    switch (format) {
        case "sql":
            return (0, sql_serializer_1.serializeSql)(schema);
        case "dbml":
            return (0, dbml_serializer_1.serializeDbml)(schema);
        case "json":
            return (0, json_serializer_1.serializeJson)(schema);
        default: {
            const exhaustive = format;
            throw new Error(`Unsupported format: ${exhaustive}`);
        }
    }
}
var sql_serializer_2 = require("./sql-serializer");
Object.defineProperty(exports, "serializeSql", { enumerable: true, get: function () { return sql_serializer_2.serializeSql; } });
var dbml_serializer_2 = require("./dbml-serializer");
Object.defineProperty(exports, "serializeDbml", { enumerable: true, get: function () { return dbml_serializer_2.serializeDbml; } });
var json_serializer_2 = require("./json-serializer");
Object.defineProperty(exports, "serializeJson", { enumerable: true, get: function () { return json_serializer_2.serializeJson; } });
//# sourceMappingURL=index.js.map