"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const sidebarProvider_1 = require("./webview/sidebarProvider");
const logger_1 = require("./services/logging/logger");
const connection_manager_1 = require("./database/connection-manager");
const cloud_account_manager_1 = require("./database/cloud-account-manager");
const driver_factory_1 = require("./database/drivers/driver-factory");
let outputChannel;
function activate(context) {
    outputChannel = vscode.window.createOutputChannel("DBCHAT");
    context.subscriptions.push(outputChannel);
    logger_1.Logger.getInstance().initialize(outputChannel);
    logger_1.Logger.getInstance().log("DBCHAT extension activated");
    // Initialize the database connection manager
    const connectionManager = connection_manager_1.ConnectionManager.getInstance();
    connectionManager.initialize(context);
    cloud_account_manager_1.CloudAccountManager.getInstance().initialize(context);
    // Register all database drivers
    const drivers = (0, driver_factory_1.createDrivers)();
    for (const driver of drivers) {
        connectionManager.registerDriver(driver);
    }
    // Register driver aliases for compatible databases.
    // makeDriverAlias preserves prototype methods (a plain spread would drop them).
    for (const [alias, baseDriver] of Object.entries(driver_factory_1.DRIVER_ALIASES)) {
        const base = connectionManager.getDriver(baseDriver);
        if (base) {
            connectionManager.registerDriver((0, driver_factory_1.makeDriverAlias)(base, alias));
        }
    }
    logger_1.Logger.getInstance().log(`Registered ${drivers.length} database drivers`);
    // Register the sidebar provider
    const sidebarProvider = new sidebarProvider_1.DBChatSidebarProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarProvider_1.DBChatSidebarProvider.viewType, sidebarProvider));
}
function deactivate() {
    // Disconnect any active database connections
    connection_manager_1.ConnectionManager.getInstance().disconnect();
}
//# sourceMappingURL=extension.js.map