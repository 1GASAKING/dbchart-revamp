import type { CanonicalSchema } from "../types";

/**
 * Serialize a canonical schema to JSON.
 *
 * This emits the canonical schema shape (entities + relations) so it can be
 * round-tripped losslessly through {@link parseJson}.
 */
export function serializeJson(schema: CanonicalSchema): string {
  return JSON.stringify(schema, null, 2);
}