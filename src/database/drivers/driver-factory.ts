import type { IDatabaseDriver } from "./database-driver";
import { PostgreSQLDriver } from "./postgresql-driver";
import { MySQLDriver } from "./mysql-driver";
import { MongoDBDriver } from "./mongodb-driver";
import { RedisDriver } from "./redis-driver";
import { SQLiteDriver } from "./sqlite-driver";
import { GenericHTTPDriver } from "./generic-http-driver";
import { RestApiDriver } from "./rest-api-driver";

const COMPATIBLE_DRIVERS: Record<string, string> = {
  greenplum: "postgresql",
  cockroachdb: "postgresql",
  timescale: "postgresql",
  yugabytedb: "postgresql",
  redshift: "postgresql",
  kingbasees: "postgresql",
  netezza: "postgresql",
  questdb: "postgresql",
  risingwave: "postgresql",
  pglite: "postgresql",
  mariadb: "mysql",
  "tiDB": "mysql",
  starrocks: "mysql",
  singlestore: "mysql",
  "apache-doris": "mysql",
  "bunny-database": "mysql",
  valkey: "redis",
  libsql: "sqlite",
  "cloudflare-d1": "sqlite",
  "amazon-documentdb": "mongodb",
  // SDK-free REST services (handled by RestApiDriver profiles)
  firebase: "rest-api",
  supabase: "rest-api",
  stripe: "rest-api",
};

export function createDrivers(): IDatabaseDriver[] {
  return [
    new PostgreSQLDriver(),
    new MySQLDriver(),
    new MongoDBDriver(),
    new RedisDriver(),
    new SQLiteDriver(),
    new GenericHTTPDriver(),
    new RestApiDriver(),
  ];
}

/**
 * Clones a base driver while preserving its prototype methods, then
 * overrides its `databaseId` for an aliased database.
 *
 * NOTE: a plain `{...base}` spread drops class methods (they live on the
 * prototype), which is why we re-establish the prototype here.
 */
export function makeDriverAlias(base: IDatabaseDriver, aliasId: string): IDatabaseDriver {
  const clone = Object.assign(Object.create(Object.getPrototypeOf(base)), base) as IDatabaseDriver;
  (clone as { databaseId: string }).databaseId = aliasId;
  return clone;
}

export function getDriverForDatabase(databaseId: string): string {
  if (COMPATIBLE_DRIVERS[databaseId]) {
    return COMPATIBLE_DRIVERS[databaseId];
  }
  return "generic-http";
}

export const DRIVER_ALIASES: Record<string, string> = COMPATIBLE_DRIVERS;