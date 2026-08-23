/**
 * The file name (without extension) must match the database id, e.g. firebase.svg => "firebase".
 * Add a new client icon to assets/icons/ and it is picked up automatically - no code changes needed.
 */
const dbIconModules = import.meta.glob("../../../../assets/icons/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

export const getDbIcon = (dbId: string): string | null => {
  const moduleKey = Object.keys(dbIconModules).find((key) =>
    key.endsWith(`/${dbId}.svg`)
  );
  return moduleKey ? (dbIconModules[moduleKey] ?? null) : null;
};