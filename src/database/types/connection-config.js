"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudProvider = exports.ConnectionFieldType = void 0;
// Single source of truth lives in the shared @dbchart/schema package.
// Explicit slice to avoid duplicate star-export collisions in barrels.
var schema_1 = require("@dbchart/schema");
Object.defineProperty(exports, "ConnectionFieldType", { enumerable: true, get: function () { return schema_1.ConnectionFieldType; } });
Object.defineProperty(exports, "CloudProvider", { enumerable: true, get: function () { return schema_1.CloudProvider; } });
//# sourceMappingURL=connection-config.js.map