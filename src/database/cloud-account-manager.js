"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudAccountManager = void 0;
const crypto_1 = require("crypto");
const STORAGE_KEY = "dbchat.cloudAccounts";
const SECRET_PREFIX = "dbchat.cloud.";
class CloudAccountManager {
    static _instance;
    _context;
    _accounts = [];
    _listeners = new Set();
    constructor() { }
    static getInstance() {
        if (!CloudAccountManager._instance) {
            CloudAccountManager._instance = new CloudAccountManager();
        }
        return CloudAccountManager._instance;
    }
    initialize(context) {
        this._context = context;
        this._accounts = context.globalState.get(STORAGE_KEY, []);
    }
    onAccountsChanged(listener) {
        this._listeners.add(listener);
        return { dispose: () => this._listeners.delete(listener) };
    }
    getAccounts() {
        return [...this._accounts].sort((a, b) => a.createdAt - b.createdAt);
    }
    async createAccount(input) {
        if (!this._context) {
            throw new Error("CloudAccountManager not initialized");
        }
        const id = (0, crypto_1.randomUUID)();
        const account = {
            id,
            provider: input.provider,
            name: input.name,
            createdAt: Date.now(),
            region: input.region,
            groupId: input.groupId,
            tenantId: input.tenantId,
            subscriptionId: input.subscriptionId,
        };
        const credentials = {
            accessKeyId: input.accessKeyId,
            secretAccessKey: input.secretAccessKey,
            serviceAccountJson: input.serviceAccountJson,
            clientId: input.clientId,
            clientSecret: input.clientSecret,
        };
        if (Object.values(credentials).some((v) => v)) {
            await this._context.secrets.store(`${SECRET_PREFIX}${id}`, JSON.stringify(credentials));
        }
        this._accounts.push(account);
        await this._context.globalState.update(STORAGE_KEY, this._accounts);
        this._notify();
        return account;
    }
    async deleteAccount(accountId) {
        if (!this._context) {
            throw new Error("CloudAccountManager not initialized");
        }
        this._accounts = this._accounts.filter((a) => a.id !== accountId);
        await this._context.globalState.update(STORAGE_KEY, this._accounts);
        await this._context.secrets.delete(`${SECRET_PREFIX}${accountId}`);
        this._notify();
    }
    async getCredentials(accountId) {
        if (!this._context) {
            return null;
        }
        const json = await this._context.secrets.get(`${SECRET_PREFIX}${accountId}`);
        if (!json) {
            return null;
        }
        try {
            return JSON.parse(json);
        }
        catch {
            return null;
        }
    }
    _notify() {
        for (const listener of this._listeners) {
            listener();
        }
    }
}
exports.CloudAccountManager = CloudAccountManager;
//# sourceMappingURL=cloud-account-manager.js.map