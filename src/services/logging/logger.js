"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Simple logging utility for the extension's backend code.
 * Uses VS Code's OutputChannel which must be initialized from extension.ts
 * to ensure proper registration with the extension context.
 */
class Logger {
    static instance;
    outputChannel;
    static isVerbose = process.env.IS_DEV === "true";
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    initialize(outputChannel) {
        this.outputChannel = outputChannel;
    }
    log(message, isDevOnly = false) {
        if (isDevOnly && Logger.isVerbose) {
            return;
        }
        if (this.outputChannel) {
            if (typeof message === "object") {
                this.outputChannel.appendLine(JSON.stringify(message, null, 2));
            }
            else {
                this.outputChannel.appendLine(message);
            }
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map