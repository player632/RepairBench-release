// @ts-check

import { makeStyles } from "@material-ui/core";
import React from "react";
import Tile from "./Tile";

const useStyles = makeStyles({
  root: (props) => {
    return {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "500px",
    };
  },
  tile: (props) => {
    return {
      width: `${props.tileSize * props.gridSize}px`,
      height: `${props.tileSize * props.gridSize}px`,
      position: "relative",
      textAlign: "center",
    };
  },
});

const Grid = (props) => {
  const { tiles, onTileClick, gridSize } = props;
  const styles = useStyles(props);

  return (
    <div className={styles.root} data-testid="grid-root">
      <div className={styles.tile} data-testid="grid-board">
        {tiles.map((tile, index) => {
          return (
            <Tile
              {...tile}
              slot={index}
              key={`tile-${index}`}
              correct={tile.tileId === tile.number}
              onClick={onTileClick}
              visible={tile.number < gridSize ** 2}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Grid;
