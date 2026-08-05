// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DBChatSidebarProvider } from './webview/sidebarProvider';
import { Logger } from './services/logging/logger';

let outputChannel: vscode.OutputChannel;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	outputChannel = vscode.window.createOutputChannel("DBCHAT");
	context.subscriptions.push(outputChannel);
	Logger.getInstance().initialize(outputChannel);
	Logger.getInstance().log("DBCHAT extension activated ");

	

	// Register the sidebar provider
	const sidebarProvider = new DBChatSidebarProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(DBChatSidebarProvider.viewType, sidebarProvider)
	);
	
}

// This method is called when your extension is deactivated
export function deactivate() {}
