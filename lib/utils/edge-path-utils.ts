/**
 * Framework-agnostic SVG path helpers for rendering connection lines and edges.
 *
 * These helpers avoid importing React Flow types so the shared library stays
 * usable from both the extension host and the webview.
 */

export type EdgePathPosition = "left" | "right" | "top" | "bottom";

export interface StepPathParams {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: EdgePathPosition;
  targetPosition: EdgePathPosition;
  /** Distance the path travels straight out of a handle before turning. @default 20 */
  offset?: number;
}

const isHorizontal = (position: EdgePathPosition): boolean =>
  position === "left" || position === "right";

/**
 * Build an orthogonal (step) SVG path between two points.
 *
 * The path travels straight out of the source handle, makes right-angle turns,
 * and enters the target handle straight on.
 */
export function getStepPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  offset = 20,
}: StepPathParams): string {
  const sourceHorizontal = isHorizontal(sourcePosition);
  const targetHorizontal = isHorizontal(targetPosition);

  // Both handles horizontal: out -> vertical -> in.
  if (sourceHorizontal && targetHorizontal) {
    const sourceOutX =
      sourcePosition === "right" ? sourceX + offset : sourceX - offset;
    return `M ${sourceX},${sourceY} L ${sourceOutX},${sourceY} L ${sourceOutX},${targetY} L ${targetX},${targetY}`;
  }

  // Both handles vertical: out -> horizontal -> in.
  if (!sourceHorizontal && !targetHorizontal) {
    const sourceOutY =
      sourcePosition === "bottom" ? sourceY + offset : sourceY - offset;
    return `M ${sourceX},${sourceY} L ${sourceX},${sourceOutY} L ${targetX},${sourceOutY} L ${targetX},${targetY}`;
  }

  // Mixed orientations fall back to a center-routed orthogonal path.
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  return `M ${sourceX},${sourceY} L ${sourceX},${centerY} L ${targetX},${centerY} L ${targetX},${targetY}`;
}