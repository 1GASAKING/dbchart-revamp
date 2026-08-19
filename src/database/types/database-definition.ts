import { ConnectionField } from "./connection-config";

/**
 * Categories of databases supported by the client.
 */
export const DatabaseCategory = {
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
} as const;

export type DatabaseCategory = (typeof DatabaseCategory)[keyof typeof DatabaseCategory];

/**
 * How a database connection is established.
 */
export const ConnectionMethod = {
  NATIVE: "Native Library",        // Uses npm driver package
  ODBC: "ODBC/JDBC",               // Uses ODBC driver
  HTTP: "HTTP/REST API",           // Uses REST API
  AWS_SDK: "AWS SDK",              // Uses AWS SDK
  GRAPHQL: "GraphQL",              // Uses GraphQL API
  WEBHOOK: "Webhook",              // Uses webhook endpoints
} as const;

export type ConnectionMethod = (typeof ConnectionMethod)[keyof typeof ConnectionMethod];

/**
 * Query language supported by the database.
 */
export const QueryLanguage = {
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
} as const;

export type QueryLanguage = (typeof QueryLanguage)[keyof typeof QueryLanguage];

/**
 * Definition of a single supported database type.
 */
export interface DatabaseDefinition {
  /** Unique identifier (e.g., "postgresql"). */
  id: string;
  /** Display name (e.g., "PostgreSQL"). */
  name: string;
  /** Category the database belongs to. */
  category: DatabaseCategory;
  /** How connections are established. */
  connectionMethod: ConnectionMethod;
  /** Query language used. */
  queryLanguage: QueryLanguage;
  /** Is this a preview release? */
  preview?: boolean;
  /** Package name to install for this driver (if NATIVE). */
  driverPackage?: string;
  /** Package name that contains this driver's type definitions. */
  driverTypesPackage?: string;
  /** Description of what this database is. */
  description: string;
  /** Default port (if applicable). */
  defaultPort?: number;
  /** Connection fields required/supported by this database. */
  fields: ConnectionField[];
  /** Whether the driver is installed and available. */
  installed?: boolean;
  /** Installation instructions if not installed. */
  installHint?: string;
}