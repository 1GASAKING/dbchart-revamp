/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg?react" {
  import * as React from "react";

  export const ReactComponent: React.FunctionComponent<
    React.ComponentProps<"svg"> & { title?: string; titleId?: string; desc?: string; descId?: string }
  >;
}

