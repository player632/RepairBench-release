import React, { useEffect, useRef, useState, useCallback } from "react";

const SmoothCaret = ({ containerRef, wordSpanRefs, currWordIndex, currCharIndex, startIndex, status, theme }) => {
  const [pos, setPos] = useState({ x: 0, y: 0, height: 0, visible: false });
  const frameRef = useRef(null);

  const calcPosition = useCallback(() => {
    if (status === "finished" || !containerRef?.current) {
      setPos((p) => ({ ...p, visible: false }));
      return;
    }

    const wordRef = wordSpanRefs[currWordIndex];
    if (!wordRef?.current) return;

    const wordEl = wordRef.current;
    const chars = wordEl.querySelectorAll("span");

    if (!chars.length) return;

    let targetEl;
    let placeAfter = false;

    if (currCharIndex < 0) {
      targetEl = chars[0];
      placeAfter = false;
    } else if (currCharIndex >= chars.length - 1) {
      targetEl = chars[chars.length - 1];
      placeAfter = true;
    } else {
      targetEl = chars[currCharIndex + 1];
      placeAfter = false;
    }

    if (!targetEl) {
      targetEl = chars[chars.length - 1];
      placeAfter = true;
    }

    // Use offsetLeft/offsetTop which are relative to offsetParent (the position:relative container)
    // These correctly account for scroll position within overflow:hidden containers
    const charRect = targetEl.getBoundingClientRect();
    const wordRect = wordEl.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // x: character position relative to container
    const x = placeAfter
      ? charRect.right - containerRect.left
      : charRect.left - containerRect.left;

    // y: use the word element's offsetTop (scroll-independent)
    // The word's offsetTop is relative to the .words div, which is inside the type-box
    // We need position relative to the type-box (the position:relative container)
    const container = containerRef.current;
    let yOffset = 0;
    let el = wordEl;
    while (el && el !== container) {
      yOffset += el.offsetTop;
      el = el.offsetParent;
      if (el === container) break;
    }

    setPos({ x, y: yOffset, height: charRect.height, visible: true });
  }, [containerRef, wordSpanRefs, currWordIndex, currCharIndex, startIndex, status]);

  useEffect(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(calcPosition);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [calcPosition]);

  if (!pos.visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "2px",
        height: `${pos.height}px`,
        background: theme.stats,
        borderRadius: "1px",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 80ms ease-out",
        pointerEvents: "none",
        zIndex: 10,
        willChange: "transform",
      }}
    />
  );
};

export default SmoothCaret;
