import type { IDatabaseDriver } from "./database-driver";
import { PostgreSQLDriver } from "./postgresql-driver";
import { MySQLDriver } from "./mysql-driver";
import { MongoDBDriver } from "./mongodb-driver";
import { RedisDriver } from "./redis-driver";
import { SQLiteDriver } from "./sqlite-driver";
import { GenericHTTPDriver } from "./generic-http-driver";

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
};

export function createDrivers(): IDatabaseDriver[] {
  return [
    new PostgreSQLDriver(),
    new MySQLDriver(),
    new MongoDBDriver(),
    new RedisDriver(),
    new SQLiteDriver(),
    new GenericHTTPDriver(),
  ];
}

export function getDriverForDatabase(databaseId: string): string {
  if (COMPATIBLE_DRIVERS[databaseId]) {
    return COMPATIBLE_DRIVERS[databaseId];
  }
  return "generic-http";
}

export const DRIVER_ALIASES: Record<string, string> = COMPATIBLE_DRIVERS;