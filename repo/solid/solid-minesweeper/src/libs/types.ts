export type Difficulty = {
  name: string;
  rows: number;
  cellsPerRow: number;
  mineCount: number;
};

export type Cell = {
  isMine: boolean;
  isFlagged: boolean;
  isClicked: boolean;
  neighbors: number;
};
