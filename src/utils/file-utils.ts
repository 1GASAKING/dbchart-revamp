import * as vscode from "vscode";

/** Supported content encodings for reading/writing files. */
export type FileEncoding = "utf8" | "base64";

/**
 * Read a UTF-8 text file from a VS Code URI.
 *
 * @param uri the file location
 * @returns the file contents as a string
 */
export async function readFile(uri: vscode.Uri): Promise<string> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return decodeUtf8(bytes);
}

/**
 * Write content to a VS Code URI, creating the file if needed.
 *
 * @param uri      the destination path
 * @param content  the string to write
 * @param encoding how to decode `content` into bytes. @default "utf8"
 */
export async function writeFile(
  uri: vscode.Uri,
  content: string,
  encoding: FileEncoding = "utf8"
): Promise<void> {
  const bytes = encoding === "base64" ? decodeBase64(content) : encodeUtf8(content);
  await vscode.workspace.fs.writeFile(uri, bytes);
}

/**
 * Decode a UTF-8 byte array into a string.
 *
 * Implemented manually to avoid depending on `Buffer`, `TextDecoder`, or other
 * Node/DOM globals that are not exposed by the workspace type-checker.
 */
function decodeUtf8(bytes: Uint8Array): string {
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
      i += 1;
    } else if (byte < 0xe0) {
      const code = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      result += String.fromCharCode(code);
      i += 2;
    } else if (byte < 0xf0) {
      const code =
        ((byte & 0x0f) << 12) |
        ((bytes[i + 1] & 0x3f) << 6) |
        (bytes[i + 2] & 0x3f);
      result += String.fromCharCode(code);
      i += 3;
    } else {
      const code =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      const cp = code - 0x10000;
      result += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
      i += 4;
    }
  }
  return result;
}

/** Encode a string into a UTF-8 byte array. */
function encodeUtf8(input: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < input.length; i++) {
    let code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      const low = input.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = (code - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
        i += 1;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

/** Decode a base64 string into bytes. */
function decodeBase64(input: string): Uint8Array {
  const clean = input.replace(/\s/g, "");
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Map<string, number>();
  for (let i = 0; i < alphabet.length; i++) {
    lookup.set(alphabet[i], i);
  }

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const char of clean) {
    if (char === "=") {
      break;
    }
    const value = lookup.get(char);
    if (value === undefined) {
      continue;
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}