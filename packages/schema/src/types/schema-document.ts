import type { SchemaNode } from "./schema-node";
import type { ServerNode } from "./schema-node";
import type { EndpointNode } from "./schema-node";
import type { DesignRelationship } from "./schema-relationship";

/** Schema design file (tables, views, relationships) */
export interface SchemaDesign {
  type: "schema";
  nodes: SchemaNode[];
  relationships: DesignRelationship[];
}

/** Server infrastructure design file */
export interface ServerDesign {
  type: "server";
  nodes: ServerNode[];
  relationships: DesignRelationship[];
}

/** Endpoint design file */
export interface EndpointDesign {
  type: "endpoint";
  nodes: EndpointNode[];
  relationships: DesignRelationship[];
}

/** A design file can be any of the supported design types */
export type DesignFile = SchemaDesign | ServerDesign | EndpointDesign;