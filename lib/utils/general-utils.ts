/**
 * Curated palette of colors used to visually differentiate schema nodes.
 * Colors are chosen to remain distinguishable on dark editor backgrounds.
 */
export const NODE_COLORS: readonly string[] = [
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

/**
 * Generate a unique id with an optional prefix.
 * @param prefix - prefix for the generated id
 */
export function generateId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Generate a unique id for a design field */
export function generateFieldId(): string {
  return generateId("field");
}

/** Generate a unique id for a design node */
export function generateNodeId(): string {
  return generateId("node");
}

/**
 * Generate a pseudo-random color from the curated node palette.
 * Used as a visual indicator so each schema node is visually distinct.
 */
export function generateNodeColor(): string {
  return NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)];
}
