"use strict";
/**
 * Shared database runtime types — the single source of truth used by both the
 * extension host (drivers, connection manager) and the webview UI
 * (schema tree, data grid, query editor).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryLanguage = exports.ConnectionMethod = exports.DatabaseCategory = exports.CloudProvider = exports.ConnectionFieldType = void 0;
exports.ConnectionFieldType = {
    TEXT: "text",
    PASSWORD: "password",
    NUMBER: "number",
    SELECT: "select",
    CHECKBOX: "checkbox",
    FILE: "file",
    TEXTAREA: "textarea",
    JSON: "json",
    URL: "url",
};
exports.CloudProvider = {
    AWS: "aws",
    GCP: "gcp",
    AZURE: "azure",
};
exports.DatabaseCategory = {
    SQL: "SQL",
    NOSQL: "NoSQL",
    DATA_WAREHOUSE: "Data Warehouse",
    CLOUD: "Cloud",
    LAKEHOUSE: "Lakehouse",
    APPLICATION: "Application",
    FILE_FORMAT: "File Format",
    STREAMING: "Streaming",
    MESSAGE_QUEUE: "Message Queue",
    GRAPH: "Graph",
    VECTOR: "Vector",
    CLOUD_PROVIDER: "Cloud Provider",
};
exports.ConnectionMethod = {
    NATIVE: "Native Library",
    ODBC: "ODBC/JDBC",
    HTTP: "HTTP/REST API",
    AWS_SDK: "AWS SDK",
    GRAPHQL: "GraphQL",
    WEBHOOK: "Webhook",
};
exports.QueryLanguage = {
    SQL: "SQL",
    MQL: "MongoDB Query Language",
    REDIS: "Redis Commands",
    CQL: "Cassandra Query Language",
    CYPHER: "Cypher (Neo4j)",
    ELASTICSEARCH_DSL: "Elasticsearch DSL",
    INFLUXQL: "InfluxQL",
    REST: "REST API",
    MEMCACHED: "Memcached Commands",
    GRAPHQL: "GraphQL",
};
//# sourceMappingURL=database.js.map