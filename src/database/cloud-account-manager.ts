import * as vscode from "vscode";
import { randomUUID } from "crypto";
import type { CloudAccount, CloudAccountCredentials, CloudProvider } from "./types/connection-config";

const STORAGE_KEY = "dbchat.cloudAccounts";
const SECRET_PREFIX = "dbchat.cloud.";

export interface CreateCloudAccountInput extends CloudAccountCredentials {
  provider: CloudProvider;
  name: string;
  region?: string;
  projectId?: string;
  tenantId?: string;
  subscriptionId?: string;
}

export class CloudAccountManager {
  private static _instance: CloudAccountManager;
  private _context?: vscode.ExtensionContext;
  private _accounts: CloudAccount[] = [];
  private _listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): CloudAccountManager {
    if (!CloudAccountManager._instance) {
      CloudAccountManager._instance = new CloudAccountManager();
    }
    return CloudAccountManager._instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    this._context = context;
    this._accounts = context.globalState.get<CloudAccount[]>(STORAGE_KEY, []);
  }

  public onAccountsChanged(listener: () => void): { dispose(): void } {
    this._listeners.add(listener);
    return { dispose: () => this._listeners.delete(listener) };
  }

  public getAccounts(): CloudAccount[] {
    return [...this._accounts].sort((a, b) => a.createdAt - b.createdAt);
  }

  public async createAccount(input: CreateCloudAccountInput): Promise<CloudAccount> {
    if (!this._context) { throw new Error("CloudAccountManager not initialized"); }

    const id = randomUUID();
    const account: CloudAccount = {
      id,
      provider: input.provider,
      name: input.name,
      createdAt: Date.now(),
      region: input.region,
      projectId: input.projectId,
      tenantId: input.tenantId,
      subscriptionId: input.subscriptionId,
    };

    const credentials: CloudAccountCredentials = {
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

  public async deleteAccount(accountId: string): Promise<void> {
    if (!this._context) { throw new Error("CloudAccountManager not initialized"); }

    this._accounts = this._accounts.filter((a) => a.id !== accountId);
    await this._context.globalState.update(STORAGE_KEY, this._accounts);
    await this._context.secrets.delete(`${SECRET_PREFIX}${accountId}`);
    this._notify();
  }

  public async getCredentials(accountId: string): Promise<CloudAccountCredentials | null> {
    if (!this._context) { return null; }
    const json = await this._context.secrets.get(`${SECRET_PREFIX}${accountId}`);
    if (!json) { return null; }
    try {
      return JSON.parse(json) as CloudAccountCredentials;
    } catch {
      return null;
    }
  }

  private _notify(): void {
    for (const listener of this._listeners) {
      listener();
    }
  }
}