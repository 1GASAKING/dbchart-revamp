"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_COLORS = exports.DATA_TYPES = void 0;
const schema_field_1 = require("../../packages/schema/src/types/schema-field");
/** Re-exported from the schema SDK as the single source of truth */
exports.DATA_TYPES = schema_field_1.FIELD_DATA_TYPES;
/**
 * Curated palette of colors used to visually differentiate schema nodes.
 * Colors are chosen to remain distinguishable on dark editor backgrounds.
 */
exports.NODE_COLORS = [
    "#E53935", // red
    "#D81B60", // pink
    "#8E24AA", // purple
    "#5E35B1", // deep purple
    "#3949AB", // indigo
    "#1E88E5", // blue
    "#039BE5", // light blue
    "#00ACC1", // cyan
    "#00897B", // teal
    "#43A047", // green
    "#7CB342", // light green
    "#C0CA33", // lime
    "#FDD835", // yellow
    "#FFB300", // amber
    "#FB8C00", // orange
    "#F4511E", // deep orange
    "#6D4C41", // brown
    "#546E7A", // blue gray
];
//# sourceMappingURL=const.js.map