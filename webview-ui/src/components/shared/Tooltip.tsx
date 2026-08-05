import { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TooltipBubble = styled.div<{
  $top: number;
  $left: number;
  $arrowLeft: number;
  $visible: boolean;
  $arrowUp: boolean;
}>`
  position: fixed;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  transform: translateX(-50%);
  z-index: 99999;
  pointer-events: none;
  white-space: nowrap;
  padding: 3px 8px;
  font-size: 12px;
  line-height: 1.4;
  font-family: var(--vscode-font-family);
  color: var(--vscode-editorHoverWidget-foreground, #cccccc);
  background-color: var(--vscode-editorHoverWidget-background, #2d2d2d);
  border: 1px solid var(--vscode-editorHoverWidget-border, #555555);
  border-radius: 3px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.15s ease;

  /* Arrow pointing down (tooltip above element) */
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: ${({ $arrowLeft }) => $arrowLeft}px;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--vscode-editorHoverWidget-border, #555555);
  }

  &::before {
    content: "";
    position: absolute;
    top: 100%;
    left: ${({ $arrowLeft }) => $arrowLeft}px;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--vscode-editorHoverWidget-background, #2d2d2d);
    z-index: 1;
  }

  /* Arrow pointing up (tooltip below element) */
  ${({ $arrowUp, $arrowLeft }) =>
    !$arrowUp &&
    `
    &::after {
      top: auto;
      bottom: 100%;
      left: ${$arrowLeft}px;
      border-top-color: transparent;
      border-bottom-color: var(--vscode-editorHoverWidget-border, #555555);
    }
    &::before {
      top: auto;
      bottom: 100%;
      left: ${$arrowLeft}px;
      border-top-color: transparent;
      border-bottom-color: var(--vscode-editorHoverWidget-background, #2d2d2d);
    }
  `}
`;

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip = ({ text, children }: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowLeft, setArrowLeft] = useState(0);
  const [arrowUp, setArrowUp] = useState(true);
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updatePosition = useCallback(() => {
    if (!wrapperRef.current || !bubbleRef.current) return;

    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    const bw = bubbleRect.width || bubbleWidth || 80;
    const bh = bubbleRect.height || 28;

    // Center the tooltip on the wrapper
    let left = wrapperRect.left + wrapperRect.width / 2;
    let top = wrapperRect.top - bh - 10;
    let arrowPointsUp = true;

    // If not enough space above, show below
    if (top < 2) {
      top = wrapperRect.bottom + 10;
      arrowPointsUp = false;
    }

    // Keep within viewport horizontally
    const halfWidth = bw / 2;
    if (left - halfWidth < 4) {
      left = halfWidth + 4;
    } else if (left + halfWidth > window.innerWidth - 4) {
      left = window.innerWidth - halfWidth - 4;
    }

    // Calculate where the arrow should point (center of wrapper relative to bubble)
    const bubbleLeft = left - bw / 2;
    const wrapperCenter = wrapperRect.left + wrapperRect.width / 2;
    setArrowLeft(wrapperCenter - bubbleLeft);
    setBubbleWidth(bw);
    setPosition({ top, left });
    setArrowUp(arrowPointsUp);
  }, [bubbleWidth]);

  const show = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  };

  const hide = () => {
    timeoutRef.current = setTimeout(() => setVisible(false), 50);
  };

  useEffect(() => {
    if (visible) {
      const raf = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(raf);
    }
  }, [visible, updatePosition]);

  return (
    <Wrapper ref={wrapperRef} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      <TooltipBubble
        ref={bubbleRef}
        $top={position.top}
        $left={position.left}
        $arrowLeft={arrowLeft}
        $visible={visible}
        $arrowUp={arrowUp}
      >
        {text}
      </TooltipBubble>
    </Wrapper>
  );
};

export default Tooltip;