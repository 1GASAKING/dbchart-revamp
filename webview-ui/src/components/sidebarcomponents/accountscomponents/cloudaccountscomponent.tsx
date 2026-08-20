import { useEffect, useState } from "react";
import { vscode } from "../../../utils/vscode";
import { WebviewMessageType } from "@shared/webview/webviewmessage";
import { ExtensionMessageType } from "@shared/extensionmessage/extensionmessage";
import type { ExtensionMessage } from "@shared/extensionmessage/types";

interface CloudAccount {
  id: string;
  provider: string;
  name: string;
  createdAt: number;
  region?: string;
  projectId?: string;
  tenantId?: string;
  subscriptionId?: string;
}

const S = {
  wrap: { display: "flex", flexDirection: "column", gap: "6px" } as React.CSSProperties,
  list: { display: "flex", flexDirection: "column", gap: "4px" } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  name: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as React.CSSProperties,
  iconBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    padding: 0,
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px solid transparent",
    borderRadius: "4px",
    fontSize: "12px",
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid var(--vscode-input-border)",
    background: "var(--vscode-input-background)",
    color: "var(--vscode-input-foreground)",
    fontSize: "12px",
    marginBottom: "4px",
  } as React.CSSProperties,
  label: { fontSize: "11px", marginBottom: "2px", color: "var(--vscode-descriptionForeground)" } as React.CSSProperties,
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px dashed var(--vscode-panel-border)",
    borderRadius: "4px",
    fontSize: "11px",
    alignSelf: "flex-start",
  } as React.CSSProperties,
  empty: { fontSize: "11px", color: "var(--vscode-descriptionForeground)", padding: "4px 2px" } as React.CSSProperties,
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: "6px",
    border: "1px solid var(--vscode-panel-border)",
    borderRadius: "4px",
  } as React.CSSProperties,
  actions: { display: "flex", gap: "4px", justifyContent: "flex-end" } as React.CSSProperties,
  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    cursor: "pointer",
    background: "transparent",
    color: "var(--vscode-foreground)",
    border: "1px solid var(--vscode-panel-border)",
    borderRadius: "4px",
    fontSize: "11px",
  } as React.CSSProperties,
};

const PROVIDER_OPTIONS = [
  { value: "aws", label: "AWS" },
  { value: "gcp", label: "Google Cloud (GCP)" },
  { value: "azure", label: "Azure" },
];

const emptyForm = {
  provider: "aws",
  name: "",
  region: "",
  projectId: "",
  tenantId: "",
  subscriptionId: "",
  accessKeyId: "",
  secretAccessKey: "",
  serviceAccountJson: "",
  clientId: "",
  clientSecret: "",
};

const CloudAccountsComponent = () => {
  const [accounts, setAccounts] = useState<CloudAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    vscode._postMessage({ messageType: WebviewMessageType.DB_LIST_CLOUD_ACCOUNTS });

    const handleMessage = (event: MessageEvent) => {
      const message: ExtensionMessage = event.data;
      switch (message.type) {
        case ExtensionMessageType.DB_CLOUD_ACCOUNTS_LISTED:
          setAccounts(message.payload.accounts);
          break;
        case ExtensionMessageType.DB_CLOUD_ACCOUNT_CREATED:
          setAccounts((prev) => [...prev, message.payload.account]);
          setShowForm(false);
          setForm({ ...emptyForm });
          break;
        case ExtensionMessageType.DB_CLOUD_ACCOUNT_DELETED:
          setAccounts((prev) => prev.filter((a) => a.id !== message.payload.accountId));
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const update = (key: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = () => {
    const name = form.name.trim();
    if (!name) return;
    vscode._postMessage({
      messageType: WebviewMessageType.DB_CREATE_CLOUD_ACCOUNT,
      payload: {
        provider: form.provider as "aws" | "gcp" | "azure",
        name,
        region: form.region || undefined,
        projectId: form.projectId || undefined,
        tenantId: form.tenantId || undefined,
        subscriptionId: form.subscriptionId || undefined,
        accessKeyId: form.accessKeyId || undefined,
        secretAccessKey: form.secretAccessKey || undefined,
        serviceAccountJson: form.serviceAccountJson || undefined,
        clientId: form.clientId || undefined,
        clientSecret: form.clientSecret || undefined,
      },
    });
  };

  const remove = (id: string) => {
    vscode._postMessage({
      messageType: WebviewMessageType.DB_DELETE_CLOUD_ACCOUNT,
      payload: { accountId: id },
    });
  };

  const providerIcon = (provider: string) => {
    if (provider === "aws") return "codicon-cloud";
    if (provider === "azure") return "codicon-cloud";
    return "codicon-cloud";
  };

  return (
    <div style={S.wrap}>
      <div style={S.list}>
        {accounts.map((a) => (
          <div key={a.id} style={S.row}>
            <i className={providerIcon(a.provider)} style={{ fontSize: "12px" }} />
            <span style={S.name}>{a.name}</span>
            <span style={{ fontSize: "10px", opacity: 0.7 }}>{a.provider}</span>
            <button style={S.iconBtn} title="Delete account" onClick={() => remove(a.id)}>
              <i className="codicon codicon-trash" />
            </button>
          </div>
        ))}
        {accounts.length === 0 && <div style={S.empty}>No cloud accounts</div>}
      </div>

      {showForm ? (
        <div style={S.form}>
          <div style={S.label}>Provider</div>
          <select style={S.input} value={form.provider} onChange={(e) => update("provider", e.target.value)}>
            {PROVIDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div style={S.label}>Account name *</div>
          <input style={S.input} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Production AWS" />

          {form.provider === "aws" && (
            <>
              <div style={S.label}>Region</div>
              <input style={S.input} value={form.region} onChange={(e) => update("region", e.target.value)} placeholder="us-east-1" />
              <div style={S.label}>Access Key ID</div>
              <input style={S.input} value={form.accessKeyId} onChange={(e) => update("accessKeyId", e.target.value)} />
              <div style={S.label}>Secret Access Key</div>
              <input type="password" style={S.input} value={form.secretAccessKey} onChange={(e) => update("secretAccessKey", e.target.value)} />
            </>
          )}

          {form.provider === "gcp" && (
            <>
              <div style={S.label}>Project ID</div>
              <input style={S.input} value={form.projectId} onChange={(e) => update("projectId", e.target.value)} />
              <div style={S.label}>Service Account JSON</div>
              <textarea style={S.input} rows={3} value={form.serviceAccountJson} onChange={(e) => update("serviceAccountJson", e.target.value)} />
            </>
          )}

          {form.provider === "azure" && (
            <>
              <div style={S.label}>Tenant ID</div>
              <input style={S.input} value={form.tenantId} onChange={(e) => update("tenantId", e.target.value)} />
              <div style={S.label}>Subscription ID</div>
              <input style={S.input} value={form.subscriptionId} onChange={(e) => update("subscriptionId", e.target.value)} />
              <div style={S.label}>Client ID</div>
              <input style={S.input} value={form.clientId} onChange={(e) => update("clientId", e.target.value)} />
              <div style={S.label}>Client Secret</div>
              <input type="password" style={S.input} value={form.clientSecret} onChange={(e) => update("clientSecret", e.target.value)} />
            </>
          )}

          <div style={S.actions}>
            <button style={S.actionBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button style={S.actionBtn} onClick={submit}>Save</button>
          </div>
        </div>
      ) : (
        <button style={S.addBtn} onClick={() => setShowForm(true)}>
          <i className="codicon codicon-cloud" /> Register cloud account
        </button>
      )}
    </div>
  );
};

export default CloudAccountsComponent;