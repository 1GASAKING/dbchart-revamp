export const ExtensionMessageType = {
    WORKSPACEUPDATED: 0,
    SET_APP_MODE: 1,
    FILE_OPENED: 2,
    FILE_SAVE_RESULT: 3,
} as const;

export type ExtensionMessageType = (typeof ExtensionMessageType)[keyof typeof ExtensionMessageType];