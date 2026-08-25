import { createElement, type CSSProperties } from "react";
import { getDbIconComponent } from "./db-connection-icons";

interface DbIconProps {
  /** Database id whose client icon should be rendered, e.g. "firebase". */
  databaseId: string;
  /** Icon size in px applied to width and height. Defaults to 16. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a database client icon as an inline SVG React component.
 * Falls back to the VS Code database codicon when no SVG asset exists.
 */
const DbIcon = ({ databaseId, size = 16, className, style }: DbIconProps) => {
  // Bound to a lowercase name and rendered via createElement on purpose:
  // this is a stable element type looked up from the module-level SVGR
  // cache, NOT a component created during render. A PascalCase local used
  // as <Icon /> would trip the react-hooks/static-components rule.
  const icon = getDbIconComponent(databaseId);

  if (!icon) {
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
      {createElement(icon, {
        width: size,
        height: size,
        "aria-hidden": true,
        focusable: false,
      })}
    </span>
  );
};

export default DbIcon;