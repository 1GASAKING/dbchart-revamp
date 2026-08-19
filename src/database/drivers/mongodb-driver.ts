import type { ConnectionConfig, ConnectionTestResult } from "../types/connection-config";
import type { DatabaseSchema, IDatabaseDriver, QueryResult, SchemaColumn, SchemaTable } from "./database-driver";

export class MongoDBDriver implements IDatabaseDriver {
  readonly databaseId = "mongodb";
  private _client: any;
  private _db: any;
  private _config?: ConnectionConfig;

  async connect(config: ConnectionConfig): Promise<void> {
    const resolved = this.resolveConfig(config);
    this._config = resolved;

    const { MongoClient } = await import("mongodb");
    const uri = resolved.connectionString || this.buildUri(resolved);
    this._client = new MongoClient(uri, {
      ssl: resolved.ssl,
      serverSelectionTimeoutMS: 5000,
    });
    await this._client.connect();
    this._db = this._client.db(resolved.database);
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.close();
      this._client = undefined;
      this._db = undefined;
    }
  }

  async testConnection(config: ConnectionConfig): Promise<ConnectionTestResult> {
    const resolved = this.resolveConfig(config);
    try {
      const { MongoClient } = await import("mongodb");
      const uri = resolved.connectionString || this.buildUri(resolved);
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      await client.close();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }

  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    if (!this._db) {{throw new Error("Not connected");}}
    const start = Date.now();

    // Support MongoDB commands: db.collection.find(), insertOne(), etc.
    const result = await this.executeMongoCommand(sql, params);
    const elapsed = Date.now() - start;

    if (Array.isArray(result)) {
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      return { columns, rows: result, executionTimeMs: elapsed, isResultSet: true };
    }

    return {
      columns: [],
      rows: [],
      executionTimeMs: elapsed,
      isResultSet: false,
      rawOutput: JSON.stringify(result, null, 2),
    };
  }

  async getSchema(): Promise<DatabaseSchema> {
    if (!this._db) {throw new Error("Not connected");}
    const collections = await this._db.listCollections().toArray();
    const tables: SchemaTable[] = [];

    for (const coll of collections) {
      const sample = await this._db.collection(coll.name).findOne();
      const columns: SchemaColumn[] = sample
        ? Object.keys(sample).map((key) => ({
            name: key,
            type: typeof sample[key],
            nullable: true,
          }))
        : [];

      tables.push({
        name: coll.name,
        type: "collection",
        columns,
      });
    }

    return {
      databaseName: this._config?.database ?? "",
      tables,
      relationships: [],
    };
  }

  async listDatabases(): Promise<string[]> {
    if (!this._client) {throw new Error("Not connected");}
    const dbs = await this._client.db().admin().listDatabases();
    return dbs.databases.map((d: any) => d.name);
  }

  async listTables(): Promise<string[]> {
    if (!this._db) {throw new Error("Not connected");}
    const collections = await this._db.listCollections().toArray();
    return collections.map((c: any) => c.name);
  }

  async getTableColumns(table: string): Promise<SchemaColumn[]> {
    if (!this._db) {throw new Error("Not connected");}
    const sample = await this._db.collection(table).findOne();
    return sample
      ? Object.keys(sample).map((key) => ({
          name: key,
          type: typeof sample[key],
          nullable: true,
        }))
      : [];
  }

  isConnected(): boolean {
    return !!this._client;
  }

  private buildUri(config: ConnectionConfig): string {
    const auth = config.username && config.password
      ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@`
      : "";
    return `mongodb://${auth}${config.host}:${config.port}/${config.database ?? ""}`;
  }

  private resolveConfig(config: ConnectionConfig): ConnectionConfig {
    if (!config.connectionString) {return config;}
    try {
      const url = new URL(config.connectionString);
      return {
        ...config,
        host: config.host ?? url.hostname,
        port: config.port ?? (url.port ? parseInt(url.port, 10) : undefined),
        database: config.database ?? url.pathname.replace(/^\//, ""),
        username: config.username ??( url.username || undefined),
        password: config.password ?? ( url.password || undefined),
      };
    } catch {
      {return config;}
    }
  }

  private async executeMongoCommand(command: string, _params?: unknown[]): Promise<unknown> {
    // Parse simple MongoDB shell commands
    const trimmed = command.trim();

    // db.collection.find()
    const findMatch = trimmed.match(/^db\.(\w+)\.find\(\)$/);
    if (findMatch) {
      return await this._db.collection(findMatch[1]).find().limit(100).toArray();
    }

    // db.collection.find({...})
    const findQueryMatch = trimmed.match(/^db\.(\w+)\.find\((\{.*\})\)$/);
    if (findQueryMatch) {
      const query = JSON.parse(findQueryMatch[2].replace(/'/g, '"'));
      return await this._db.collection(findQueryMatch[1]).find(query).limit(100).toArray();
    }

    // db.collection.findOne()
    const findOneMatch = trimmed.match(/^db\.(\w+)\.findOne\(\)$/);
    if (findOneMatch) {
      return await this._db.collection(findOneMatch[1]).findOne();
    }

    // db.collection.countDocuments()
    const countMatch = trimmed.match(/^db\.(\w+)\.countDocuments\(\)$/);
    if (countMatch) {
      return { count: await this._db.collection(countMatch[1]).countDocuments() };
    }

    // db.collection.insertOne({...})
    const insertMatch = trimmed.match(/^db\.(\w+)\.insertOne\((\{.*\})\)$/);
    if (insertMatch) {
      const doc = JSON.parse(insertMatch[2].replace(/'/g, '"'));
      const result = await this._db.collection(insertMatch[1]).insertOne(doc);
      return { insertedId: result.insertedId };
    }

    // db.collection.updateOne({filter}, {$set: {...}})
    const updateMatch = trimmed.match(/^db\.(\w+)\.updateOne\((\{.*\}),\s*(\{.*\})\)$/);
    if (updateMatch) {
      const filter = JSON.parse(updateMatch[2].replace(/'/g, '"'));
      const update = JSON.parse(updateMatch[3].replace(/'/g, '"'));
      const result = await this._db.collection(updateMatch[1]).updateOne(filter, update);
      return { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount };
    }

    // db.collection.deleteOne({...})
    const deleteMatch = trimmed.match(/^db\.(\w+)\.deleteOne\((\{.*\})\)$/);
    if (deleteMatch) {
      const filter = JSON.parse(deleteMatch[2].replace(/'/g, '"'));
      const result = await this._db.collection(deleteMatch[1]).deleteOne(filter);
      return { deletedCount: result.deletedCount };
    }

    // db.collection.drop()
    const dropMatch = trimmed.match(/^db\.(\w+)\.drop\(\)$/);
    if (dropMatch) {
      await this._db.collection(dropMatch[1]).drop();
      return { dropped: true };
    }

    // db.createCollection("name")
    const createCollMatch = trimmed.match(/^db\.createCollection\("(\w+)"\)$/);
    if (createCollMatch) {
      await this._db.createCollection(createCollMatch[1]);
      return { created: createCollMatch[1] };
    }

    // db.getCollectionNames()
    if (trimmed === "db.getCollectionNames()") {
      const collections = await this._db.listCollections().toArray();
      return collections.map((c: any) => c.name);
    }

    // db.stats()
    if (trimmed === "db.stats()") {
      return await this._db.stats();
    }

    throw new Error(`Unsupported MongoDB command: ${trimmed}`);
  }
}