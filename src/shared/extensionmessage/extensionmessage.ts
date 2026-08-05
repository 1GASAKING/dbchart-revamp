export const ExtensionMessageType = {
    WORKSPACEUPDATED: 0,
    SET_APP_MODE: 1,
} as const;

export type ExtensionMessageType = (typeof ExtensionMessageType)[keyof typeof ExtensionMessageType];