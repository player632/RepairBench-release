import { makeStyles } from "@material-ui/styles";
import React from "react";

const useStyles = makeStyles({
  root: ({ width, height, correct, left, top, visible }: Props) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    border: "1px solid #FFD1AA",
    width,
    height,
    left,
    top,
    cursor: "pointer",
    backgroundColor: correct ? "#226666" : "#D4726A",
    transitionProperty: "top, left, background-color",
    transitionDuration: ".300s",
    transitionTimingFunction: "ease-in",
  }),

  tileNumber: {
    color: "#FFD1AA",
    fontSize: "1.8em",
    userSelect: "none",
  },
});

type Props = {
  // Repair-Bench instrumentation: the array slot Grid renders this tile from.
  slot?: number;
  // Repair-Bench instrumentation: Grid renders <Tile {...tile} />, so row and column
  // already reach this component at runtime (TileDescriptor in src/lib/common-types.ts);
  // they are declared here only so the read-only data-row / data-column probes below
  // type-check under this project's strict tsconfig. No logic reads them.
  row?: number;
  column?: number;
  tileId: number;
  number: number;
  onClick: (props: Props) => void;
  width: number;
  height: number;
  correct: boolean;
  left: number;
  top: number;
  visible?: boolean;
};

const Tile = (props: Props) => {
  const { number = 0, onClick } = props;
  const styles = useStyles(props);

  return (
    <div
      className={styles.root}
      onClick={() => onClick(props)}
      data-testid={`tile-${number}`}
      data-number={number}
      data-slot={props.slot}
      data-tile-id={props.tileId}
      data-row={props.row}
      data-column={props.column}
      data-left={props.left}
      data-top={props.top}
      data-correct={String(props.correct)}
      data-visible={String(props.visible)}
    >
      <span className={styles.tileNumber} data-testid={`tile-number-${number}`}>
        {number}
      </span>
    </div>
  );
};

export default Tile;
