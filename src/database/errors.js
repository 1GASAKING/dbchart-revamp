"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeConnectionError = normalizeConnectionError;
/**
 * Normalize an arbitrary error thrown by a database driver into a
 * detailed, human-readable message plus a structured `details` map.
 *
 * Database clients (pg, mysql2, mongodb, ioredis, http/axios, etc.) attach
 * different metadata to their errors (code, errno, sqlState, syscall,
 * address, port, response, cause). This collects the common ones so the UI
 * can show a much richer failure reason than a bare `err.message`.
 */
function normalizeConnectionError(err, config) {
    const anyErr = err;
    const details = {};
    const code = anyErr?.code ?? anyErr?.errno ?? anyErr?.sqlState ?? anyErr?.codeError;
    if (code !== undefined && code !== null) {
        details.code = String(code);
    }
    if (anyErr?.sqlState) {
        details.sqlState = String(anyErr.sqlState);
    }
    if (anyErr?.errno !== undefined && anyErr?.errno !== code) {
        details.errno = anyErr.errno;
    }
    if (anyErr?.syscall) {
        details.syscall = String(anyErr.syscall);
    }
    if (anyErr?.address) {
        details.address = String(anyErr.address);
    }
    if (anyErr?.port !== undefined && anyErr?.port !== null) {
        details.port = anyErr.port;
    }
    // HTTP / REST / Axios-shaped errors
    const responseStatus = anyErr?.response?.status ?? anyErr?.status ?? anyErr?.statusCode;
    if (responseStatus !== undefined && responseStatus !== null) {
        details.httpStatus = Number(responseStatus);
    }
    const responseStatusText = anyErr?.response?.statusText ?? anyErr?.statusText;
    if (responseStatusText) {
        details.httpStatusText = String(responseStatusText);
    }
    if (anyErr?.response?.data) {
        const data = anyErr.response.data;
        details.responseBody =
            typeof data === "string" ? data : JSON.stringify(data, null, 2);
    }
    // Postgres allows a host/port/address on the error itself.
    if (anyErr?.host) {
        details.host = String(anyErr.host);
    }
    // Always reflect the connection target the user requested.
    if (config?.host) {
        details.host = config.host;
    }
    if (config?.port !== undefined && config?.port !== null) {
        details.port = config.port;
    }
    if (config?.database) {
        details.database = config.database;
    }
    const base = err instanceof Error ? err.message : err !== undefined && err !== null ? String(err) : "Unknown error";
    const parts = [base];
    if (details.code) {
        parts.push(`[code: ${details.code}]`);
    }
    if (details.syscall) {
        parts.push(`(${details.syscall})`);
    }
    if (details.address && details.port !== undefined) {
        parts.push(`at ${details.address}:${details.port}`);
    }
    if (details.httpStatus) {
        parts.push(`HTTP ${details.httpStatus}${details.httpStatusText ? ` ${details.httpStatusText}` : ""}`);
    }
    return { message: parts.join(" "), details };
}
//# sourceMappingURL=errors.js.map