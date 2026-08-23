export interface SavedConnection {
  id: string;
  name: string;
  databaseId: string;
  groupId?: string;
  host?: string;
  database?: string;
  username?: string;
  ssl?: boolean;
  createdAt: number;
  lastUsed?: number;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface ConnectionFieldDef {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
  options?: readonly { label: string; value: string }[];
  helpText?: string;
  sensitive?: boolean;
  group?: string;
  dependsOn?: { field: string; value: string };
}

export interface DatabaseDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  preview?: boolean;
  installed: boolean;
  fields?: ConnectionFieldDef[];
  defaultPort?: number;
}

export const CATEGORY_ORDER = [
  "SQL",
  "NoSQL",
  "Data Warehouse",
  "Cloud",
  "Lakehouse",
  "Application",
  "File Format",
  "Streaming",
  "Message Queue",
  "Graph",
  "Vector",
  "Cloud Provider",
];