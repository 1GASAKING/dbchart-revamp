"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOpenApiDocument = exports.parseOpenApi = exports.parseJson = exports.parseDbml = exports.parseSql = void 0;
exports.parseSchema = parseSchema;
const sql_parser_1 = require("./sql-parser");
const dbml_parser_1 = require("./dbml-parser");
const json_parser_1 = require("./json-parser");
/** Parse an external schema string based on its format. */
function parseSchema(format, input) {
    switch (format) {
        case "sql":
            return (0, sql_parser_1.parseSql)(input);
        case "dbml":
            return (0, dbml_parser_1.parseDbml)(input);
        case "json":
            return (0, json_parser_1.parseJson)(input);
        default: {
            const exhaustive = format;
            throw new Error(`Unsupported format: ${exhaustive}`);
        }
    }
}
var sql_parser_2 = require("./sql-parser");
Object.defineProperty(exports, "parseSql", { enumerable: true, get: function () { return sql_parser_2.parseSql; } });
var dbml_parser_2 = require("./dbml-parser");
Object.defineProperty(exports, "parseDbml", { enumerable: true, get: function () { return dbml_parser_2.parseDbml; } });
var json_parser_2 = require("./json-parser");
Object.defineProperty(exports, "parseJson", { enumerable: true, get: function () { return json_parser_2.parseJson; } });
var openapi_parser_1 = require("./openapi-parser");
Object.defineProperty(exports, "parseOpenApi", { enumerable: true, get: function () { return openapi_parser_1.parseOpenApi; } });
Object.defineProperty(exports, "isOpenApiDocument", { enumerable: true, get: function () { return openapi_parser_1.isOpenApiDocument; } });
//# sourceMappingURL=index.js.map