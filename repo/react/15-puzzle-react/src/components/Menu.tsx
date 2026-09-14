import {
  AppBar,
  Avatar,
  Button,
  Chip,
  Toolbar,
  Typography,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import {
  Alarm,
  CompareArrows,
  Pause,
  PlayArrow,
  PowerSettingsNew,
  Replay,
} from "@material-ui/icons";
import React from "react";
import MediaQuery from "react-responsive";
import { GameStatus, GAME_PAUSED, GAME_STARTED } from "../lib/game-status";

const useStyles = makeStyles({
  root: {
    backgroundColor: "rgb(232, 232, 232)",
  },

  toolbar: {
    ["@media (max-width: 414px)"]: {
      justifyContent: "center",
    },
  },

  title: {
    color: "#000",
    flexGrow: 1,
  },
});

type Props = {
  seconds: number;
  moves: number;
  onResetClick: () => void;
  onPauseClick: () => void;
  onNewClick: () => void;
  gameState: GameStatus;
};

const Menu = (props: Props) => {
  const {
    seconds = 0,
    moves = 0,
    onResetClick,
    onPauseClick,
    onNewClick,
    gameState,
  } = props;
  const classes = useStyles(props);

  return (
    <AppBar position="static" className={classes.root} data-testid="menu-appbar">
      <Toolbar className={classes.toolbar} data-testid="menu-toolbar">
        <MediaQuery query="(min-width: 772px)">
          <Typography className={classes.title} variant="h6" component="div" data-testid="menu-title">
            React Puzzle Games - 15 Puzzle
          </Typography>
        </MediaQuery>

        <Button
          aria-label="Start a new game"
          data-testid="menu-new-game"
          onClick={onNewClick}
          startIcon={<PowerSettingsNew className="menuIcon" />}
        >
          <MediaQuery query="(min-width: 772px)">
            <Typography component="span" variant="button">
              New game
            </Typography>
          </MediaQuery>
        </Button>
        <Button
          aria-label="Pause/Continue current game."
          data-testid="menu-pause"
          onClick={onPauseClick}
          startIcon={
            gameState === GAME_PAUSED ? (
              <PlayArrow className="menuIcon" />
            ) : (
              <Pause className="menuIcon" />
            )
          }
          disabled={gameState !== GAME_STARTED}
        >
          <MediaQuery query="(min-width: 772px)">
            <Typography component="span" variant="button" data-testid="menu-pause-label">
              {gameState === GAME_PAUSED ? "Pause" : "Continue"}
            </Typography>
          </MediaQuery>
        </Button>
        <Button
          aria-label="Reset game"
          data-testid="menu-reset"
          onClick={onResetClick}
          startIcon={<Replay />}
        >
          <MediaQuery query="(min-width: 772px)" component="span">
            Reset game
          </MediaQuery>
        </Button>
        <Chip
          data-testid="menu-time-chip"
          avatar={
            <Avatar>
              <Alarm />
            </Avatar>
          }
          label={
            <>
              <MediaQuery query="(min-width: 772px)" component="span">
                Time Elapsed:
              </MediaQuery>
              <Typography component="span" data-testid="menu-time-value">{seconds}s</Typography>
            </>
          }
        />
        <Chip
          data-testid="menu-moves-chip"
          avatar={
            <Avatar>
              <CompareArrows />
            </Avatar>
          }
          label={
            <>
              <MediaQuery query="(min-width: 772px)" component="span">
                Moves so far:
              </MediaQuery>
              <Typography component="span" data-testid="menu-moves-value">{moves}</Typography>
            </>
          }
        />
      </Toolbar>
    </AppBar>
  );
};

export default Menu;
