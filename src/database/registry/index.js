"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTENDED_DATABASE_DEFINITIONS = exports.DATABASE_DEFINITIONS = exports.ALL_DATABASE_DEFINITIONS = void 0;
exports.getDatabaseDefinition = getDatabaseDefinition;
exports.getDatabasesByCategory = getDatabasesByCategory;
exports.getDatabaseIdsByCategory = getDatabaseIdsByCategory;
const schema_1 = require("@dbchart/schema");
// Single source of truth lives in the shared @dbchart/schema package
// (packages/schema/src/database-definitions.ts). Re-export everything.
exports.ALL_DATABASE_DEFINITIONS = schema_1.ALL_DATABASE_DEFINITIONS;
exports.DATABASE_DEFINITIONS = schema_1.DATABASE_DEFINITIONS;
exports.EXTENDED_DATABASE_DEFINITIONS = schema_1.EXTENDED_DATABASE_DEFINITIONS;
function getDatabaseDefinition(id) {
    return exports.ALL_DATABASE_DEFINITIONS.find((db) => db.id === id);
}
function getDatabasesByCategory() {
    const grouped = {};
    for (const db of exports.ALL_DATABASE_DEFINITIONS) {
        if (!grouped[db.category]) {
            grouped[db.category] = [];
        }
        grouped[db.category].push(db);
    }
    return grouped;
}
function getDatabaseIdsByCategory(category) {
    return exports.ALL_DATABASE_DEFINITIONS
        .filter((db) => db.category === category)
        .map((db) => db.id);
}
//# sourceMappingURL=index.js.map