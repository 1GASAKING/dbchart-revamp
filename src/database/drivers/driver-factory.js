"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRIVER_ALIASES = void 0;
exports.createDrivers = createDrivers;
exports.makeDriverAlias = makeDriverAlias;
exports.getDriverForDatabase = getDriverForDatabase;
const postgresql_driver_1 = require("./postgresql-driver");
const mysql_driver_1 = require("./mysql-driver");
const mongodb_driver_1 = require("./mongodb-driver");
const redis_driver_1 = require("./redis-driver");
const sqlite_driver_1 = require("./sqlite-driver");
const generic_http_driver_1 = require("./generic-http-driver");
const rest_api_driver_1 = require("./rest-api-driver");
const firebase_driver_1 = require("./firebase-driver");
const COMPATIBLE_DRIVERS = {
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
    supabase: "rest-api",
    stripe: "rest-api",
};
function createDrivers() {
    return [
        new postgresql_driver_1.PostgreSQLDriver(),
        new mysql_driver_1.MySQLDriver(),
        new mongodb_driver_1.MongoDBDriver(),
        new redis_driver_1.RedisDriver(),
        new sqlite_driver_1.SQLiteDriver(),
        new generic_http_driver_1.GenericHTTPDriver(),
        new rest_api_driver_1.RestApiDriver(),
        new firebase_driver_1.FirebaseDriver(),
    ];
}
/**
 * Clones a base driver while preserving its prototype methods, then
 * overrides its `databaseId` for an aliased database.
 *
 * NOTE: a plain `{...base}` spread drops class methods (they live on the
 * prototype), which is why we re-establish the prototype here.
 */
function makeDriverAlias(base, aliasId) {
    const clone = Object.assign(Object.create(Object.getPrototypeOf(base)), base);
    clone.databaseId = aliasId;
    return clone;
}
function getDriverForDatabase(databaseId) {
    if (COMPATIBLE_DRIVERS[databaseId]) {
        return COMPATIBLE_DRIVERS[databaseId];
    }
    return "generic-http";
}
exports.DRIVER_ALIASES = COMPATIBLE_DRIVERS;
//# sourceMappingURL=driver-factory.js.map