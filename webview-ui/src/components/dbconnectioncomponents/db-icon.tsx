import type { CSSProperties } from "react";
import { getDbIconSrc } from "./db-connection-icons";

interface DbIconProps {
  /** Database id whose client icon should be rendered, e.g. "firebase". */
  databaseId: string;
  /** Icon size in px applied to width and height. Defaults to 16. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a database client icon image.
 * Falls back to the VS Code database codicon when no icon is registered.
 */
const DbIcon = ({ databaseId, size = 16, className, style }: DbIconProps) => {
  const src = getDbIconSrc(databaseId);

  if (!src) {
    return (
      <i
        className={
          className
            ? `codicon codicon-database ${className}`
            : "codicon codicon-database"
        }
        style={{ fontSize: size, ...style }}
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        flexShrink: 0,
        ...style,
      }}
    >
      <img
        src={src}
        alt={`${databaseId} icon`}
        width={size}
        height={size}
        draggable={false}
      />
    </span>
  );
};

export default DbIcon;