"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeJson = serializeJson;
/**
 * Serialize a canonical schema to JSON.
 *
 * This emits the canonical schema shape (entities + relations) so it can be
 * round-tripped losslessly through {@link parseJson}.
 */
function serializeJson(schema) {
    return JSON.stringify(schema, null, 2);
}
//# sourceMappingURL=json-serializer.js.map