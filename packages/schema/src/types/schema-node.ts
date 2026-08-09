import type { DesignField } from "./schema-field";

/** Base node shared by all design types */
export interface DesignNodeBase {
  id: string;
  label: string;
  fields: DesignField[];
  color:string,
}

/** Schema design node (tables, views) */
export interface SchemaNode extends DesignNodeBase {
  kind: "table" | "view";
}

/** Server infrastructure node (servers, databases, load balancers) */
export interface ServerNode extends DesignNodeBase {
  kind: "server" | "database" | "load-balancer";
  host?: string;
  port?: number;
}

/** Endpoint design node (API endpoints) */
export interface EndpointNode extends DesignNodeBase {
  kind: "get" | "post" | "put" | "delete";
  method?: string;
  path?: string;
}