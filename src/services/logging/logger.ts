import type { OutputChannel } from "vscode";

/**
 * Simple logging utility for the extension's backend code.
 * Uses VS Code's OutputChannel which must be initialized from extension.ts
 * to ensure proper registration with the extension context.
 */
export class Logger {
  private static instance: Logger;
  private outputChannel!: OutputChannel;
  private static isVerbose = process.env.IS_DEV === "true";

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  public initialize(outputChannel: OutputChannel) {
    this.outputChannel = outputChannel;
  }
  public log(message: string | object, isDevOnly: boolean = false) {
    if (isDevOnly && Logger.isVerbose) {
      return;
    }

    if (this.outputChannel) {
      if (typeof message === "object") {
        this.outputChannel.appendLine(JSON.stringify(message, null, 2));
      } else {
        this.outputChannel.appendLine(message);
      }
    }
  }
}
