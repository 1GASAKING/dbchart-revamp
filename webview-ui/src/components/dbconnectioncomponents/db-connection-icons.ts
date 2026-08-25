import type { ComponentType, SVGProps } from "react";

/**
 * SVGs under assets/icons/ are compiled into React components by
 * vite-plugin-svgr at build time (`*.svg?react`, see vite.config.ts), so they
 * are rendered as real inline SVG elements - no raw HTML strings involved.
 *
 * The file name (without extension) must match the database id,
 * e.g. firebase.svg => "firebase".
 * Add a new client icon to assets/icons/ and it is picked up automatically -
 * no code changes needed.
 */
export type DbIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const dbIconModules = import.meta.glob("../../../../assets/icons/*.svg?react", {
  eager: true,
  import: "ReactComponent",
}) as Record<string, DbIconComponent>;

export const getDbIconComponent = (dbId: string): DbIconComponent | null => {
  const moduleKey = Object.keys(dbIconModules).find((key) =>
    key.endsWith(`/${dbId}.svg`)
  );
  return moduleKey ? (dbIconModules[moduleKey] ?? null) : null;
};