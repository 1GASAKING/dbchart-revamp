/**
 * Client icons are imported statically as SVG asset URLs (Vite inlines small
 * SVGs as data URIs at build time) and mapped by database id, e.g.:
 *
 *   import firebase from "../../../../assets/icons/firebase.svg";
 *   export const dbIconMap = { firebase };
 *
 * Add a new icon to assets/icons/, import it here and register it in
 * {@link dbIconMap} under the database id it belongs to.
 */
import firebase from "../../../../assets/icons/firebase.svg";

/** Maps a database id to its client icon source. */
export const dbIconMap: Record<string, string> = {
  firebase,
};

/** Returns the icon source for a database id, or null when none is registered. */
export const getDbIconSrc = (dbId: string): string | null =>
  dbIconMap[dbId] ?? null;