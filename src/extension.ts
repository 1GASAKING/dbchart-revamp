import * as vscode from 'vscode';
import { DBChatSidebarProvider } from './webview/sidebarProvider';
import { Logger } from './services/logging/logger';
import { ConnectionManager } from './database/connection-manager';
import { CloudAccountManager } from './database/cloud-account-manager';
import { createDrivers, makeDriverAlias, DRIVER_ALIASES } from './database/drivers/driver-factory';

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel("DBCHAT");
  context.subscriptions.push(outputChannel);
  Logger.getInstance().initialize(outputChannel);
  Logger.getInstance().log("DBCHAT extension activated");

  // Initialize the database connection manager
  const connectionManager = ConnectionManager.getInstance();
  connectionManager.initialize(context);

  CloudAccountManager.getInstance().initialize(context);

  // Register all database drivers
  const drivers = createDrivers();
  for (const driver of drivers) {
    connectionManager.registerDriver(driver);
  }

  // Register driver aliases for compatible databases.
  // makeDriverAlias preserves prototype methods (a plain spread would drop them).
  for (const [alias, baseDriver] of Object.entries(DRIVER_ALIASES)) {
    const base = connectionManager.getDriver(baseDriver);
    if (base) {
      connectionManager.registerDriver(makeDriverAlias(base, alias));
    }
  }

  Logger.getInstance().log(`Registered ${drivers.length} database drivers`);

  // Register the sidebar provider
  const sidebarProvider = new DBChatSidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DBChatSidebarProvider.viewType, sidebarProvider)
  );
}

export function deactivate() {
  // Disconnect any active database connections
  ConnectionManager.getInstance().disconnect();
}