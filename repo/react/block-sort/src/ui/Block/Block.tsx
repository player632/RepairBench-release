import type { Dispatch } from "react";
import { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";

import { encodeForContent } from "@/support/emojiEncoding";
import { useDelayedToggle } from "@/support/useDelayedToggle";

import styles from "./Block.module.css";

export type HideFormat = "glass" | "present" | "ice";

export type Props = {
  moved: boolean;
  revealed?: boolean;
  hideFormat?: HideFormat;
  color: string;
  selected?: boolean | null;
  suggested?: boolean | null;
  /**
   * Used to offset animations
   */
  index?: number;
  locked?: boolean;
  blocked?: boolean;
  spawned?: boolean;
  shape?: string;
  shapeColored?: boolean;
  shadow?: boolean;
  blur?: boolean;
  /** RepairBench instrumentation: stable, build-independent read-only hooks. */
  rbType?: string;
  rbIndex?: number;
  rbSelected?: boolean;
  onPickUp?: Dispatch<DOMRect>;
  onDrop?: VoidFunction;
  onLock?: VoidFunction;
};

const GLASS_COLOR = "#64748b";
const ICE_COLOR = "#CFF2FF";
const PRESENT_COLOR = "#6b0";

const hideFormatToColor = {
  glass: GLASS_COLOR,
  ice: ICE_COLOR,
  present: PRESENT_COLOR
};

export const Block: React.FC<Props> = ({
  revealed = true,
  hideFormat = "glass",
  color,
  shape,
  moved,
  index = 0,
  onLock,
  onDrop,
  onPickUp,
  spawned = false,
  selected = null,
  suggested = null,
  locked = false,
  blocked = false,
  shadow = true,
  blur = false,
  shapeColored = false,
  rbType,
  rbIndex,
  rbSelected = false
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const isLocked = useDelayedToggle(locked, {
    initialValue: false,
    onDelay: 10,
    onOn: onLock
  });
  const isRevealed = useDelayedToggle(revealed, { onDelay: 10 });

  const displayShape = (revealed ? shape : undefined) ?? "❓";

  useEffect(() => {
    if (moved && !selected && !isLocked) {
      onDrop?.();
    }
  }, []);

  useEffect(() => {
    if (!blockRef.current) {
      return;
    }
    if (selected) {
      // Communicate coordinates
      const rect = blockRef.current.getBoundingClientRect();
      onPickUp?.(rect);
    } else {
      const timeoutId = setTimeout(() => {
        onDrop?.();
      }, 10);
      // Allows clearing of sound effect on column sync
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [selected]);

  const hiddenColor = hideFormatToColor[hideFormat];
  const showTopShape = revealed || hideFormat !== "present";

  const isPlacing = useMemo(
    () => !selected && !isLocked && blocked,
    [selected]
  );

  return (
    <div
      ref={blockRef}
      data-rb-block={rbType === undefined ? undefined : "1"}
      data-rb-block-type={rbType}
      data-rb-block-color={color}
      data-rb-index={rbIndex}
      data-rb-selected={rbSelected ? "1" : "0"}
      data-rb-revealed={revealed ? "1" : "0"}
      style={{
        "--cube-color": color,
        "--hidden-color": hiddenColor,
        "--cube-shape-opacity": revealed ? "50%" : "100%",
        "--shape-color": revealed ? "var(--cube-color)" : "var(--hidden-color)",
        "--cube-shape": `'${encodeForContent(displayShape)}'`,
        "--cube-top-shape": showTopShape
          ? `'${encodeForContent(displayShape)}'`
          : "''",
        animationDelay: !locked ? `-${index * 50}ms` : "0"
      }}
      className={clsx(
        "pointer-events-none relative h-block w-block rounded-md",
        {
          [styles.shadow]: shadow && !selected,
          "animate-locked": !selected && isLocked,
          "animate-blocked": blocked,
          "animate-fadeIn": spawned,
          "animate-place": isPlacing && !blocked,
          "translate-y-4": !selected && !isLocked && !blocked && !isPlacing,
          [styles.selected]: selected && !isLocked
        }
      )}
    >
      <div
        className={clsx(
          "absolute bottom-0 h-height-block w-block rounded-md text-center",
          styles.shape,
          shapeColored ? styles.lockNKey : styles.shapeOutline,
          {
            "[transition-duration:0ms]": isRevealed && hideFormat !== "ice",
            "[transition-duration:3s]": hideFormat === "ice",
            [styles.blockGradient]: revealed && !isLocked,
            [styles.gradientLocked]: revealed && isLocked,
            [styles.glass]: !revealed && hideFormat === "glass",
            [styles.present]: !revealed && hideFormat === "present",
            [styles.ice]: !revealed && hideFormat === "ice",
            "blur-[2px]": blur,
            [styles.selectedOutline]: selected,
            [styles.suggestedOutline]: suggested
          }
        )}
      ></div>
    </div>
  );
};
