import {
  createSignal,
  createEffect,
  Index,
  onMount,
  onCleanup,
  Show,
  ComponentProps,
  For,
} from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import { createStore, produce } from "solid-js/store";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  CircleCheck,
  CircleCheckBig,
  CircleX,
  Percent,
  RotateCcw,
  Settings,
  Settings2,
} from "lucide-solid";
import { Button, buttonVariants } from "../ui/button";
import { One } from "../Numbers/One";
import { Two } from "../Numbers/Two";
import { Three } from "../Numbers/Three";
import { Four } from "../Numbers/Four";
import { Five } from "../Numbers/Five";
import { Six } from "../Numbers/Six";
import { Seven } from "../Numbers/Seven";
import { Eight } from "../Numbers/Eight";
import { Mine } from "../Mine";
import { Flag } from "../Flag";
import { Slider } from "../ui/slider";
import { Badge } from "../ui/badge";
import {
  generateRows,
  scatterMines,
  calculateNeighbors,
  doZeroOpen,
  initRows,
  paddZeroes,
} from "@/libs/util";
import { defaultCell, difficulties } from "@/libs/constants";
import { Cell, Difficulty } from "@/libs/types";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import { cn } from "@/libs/cn";
import { bindGame } from "@/rb-probe";

const gameWidth = "100%";
const gameHeight = 300;

let isFirstClick = true;

export const minScale = 0;
export const maxScale = 3;
export const stepScale = 0.05;
const [rows, setRows] = createStore<Cell[][]>(
  generateRows(difficulties[0].rows, difficulties[0].cellsPerRow, defaultCell),
);
/**
 * Update row store. Mutate the previous state, no need to return.
 * @param cb Callback function to mutate the state
 */
const updateRows = (cb: (previous: Cell[][]) => void) => {
  setRows(produce(cb));
};
export const [scale, setScale] = createSignal(1);
const [difficulty, setDifficulty] = createSignal(0);
const [remainingFlags, setRemainingFlags] = createSignal(0);
const [isGameOver, setGameOver] = createSignal(false);
const [isGameWon, setGameWon] = createSignal(false);
let boardRef: HTMLDivElement;
// let timerRef = 0;
const [timerRef, setTimerRef] = createSignal(0);

export const Game = () => {
  const diff = difficulties[difficulty()];
  setRows(initRows(diff));

  setRemainingFlags(diff.mineCount);

  const [translateX, setTranslateX] = createSignal(0);
  const [translateY, setTranslateY] = createSignal(0);
  let mousePosition = [0, 0];
  const [isMouseDown, setMouseDown] = createSignal(false);
  const [isPanning, setPanning] = createSignal(false);

  // RB instrumentation: publish the app's OWN live accessors to the read-only observation
  // bridge. Nothing here writes a signal or changes a render branch.
  bindGame({
    rows: () => rows,
    scale,
    difficulty,
    remainingFlags,
    isGameOver,
    isGameWon,
    timeElapsed,
    timerRef,
    translateX,
    translateY,
    isMouseDown,
    isPanning,
    isFirstClick: () => isFirstClick,
    limits: () => ({ minScale, maxScale, stepScale }),
  });

  const startTimer = () => {
    setTimeElapsed(0);
    setTimerRef(
      window.setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000),
    );
  };

  const stopTimer = () => window.clearInterval(timerRef());

  const onWheel = (e: Event) => {
    const s = (e as WheelEvent).deltaY;
    const sign = s < 0 ? 1 : -1;
    setScale((prev) => {
      const n = Math.round((prev - sign * stepScale) * 100) / 100;
      if (prev < minScale) return minScale;
      if (prev > maxScale) return maxScale;
      return n;
    });
  };

  onMount(() => {
    window.addEventListener("wheel", onWheel);
  });

  onCleanup(() => {
    window.removeEventListener("wheel", onWheel);
  });

  const handleFirstClickMine = (
    cellIndex: number,
    rowIndex: number,
    difficulty: Difficulty,
  ) => {
    const newRows = generateRows(
      difficulty.rows,
      difficulty.cellsPerRow,
      defaultCell,
    );
    const withMines = scatterMines(newRows, difficulty.mineCount, [
      rowIndex,
      cellIndex,
    ]);
    const withNeighbors = calculateNeighbors(withMines);
    withNeighbors[rowIndex][cellIndex].isClicked = true;
    setRows(withNeighbors);
    isFirstClick = false;
    return;
  };

  const onClick = (
    cell: Cell,
    cellIndex: number,
    rowIndex: number,
    difficulty: Difficulty,
  ) => {
    if (isFirstClick && cell.isMine) {
      handleFirstClickMine(cellIndex, rowIndex, difficulty);
      isFirstClick = false;
      return;
    }
    if (cell.isMine) {
      updateRows((prev) => {
        prev.forEach((row) => {
          row.forEach((cell) => {
            if (cell.isMine) {
              cell.isClicked = true;
            }
          });
        });
      });

      setGameOver(true);
      return;
    }
    if (isFirstClick) {
      startTimer();
      isFirstClick = false;
    }
    updateRows((prev) => doZeroOpen(prev, rowIndex, cellIndex));
  };

  return (
    <div class="flex size-full flex-col items-center justify-center gap-5 p-5">
      <div>
        <GameOverAlert />
        <GameWonAlert />
        <Toolbar />
      </div>
      <div
        data-rb-viewport=""
        class="flex size-full justify-center overflow-hidden"
        style={
          {
            // width: gameWidth + "px",
            // height: gameHeight + "px",
            // scale: scale(),
            // "transform-origin": transformOrigin(),
          }
        }
        onMouseDown={(e) => {
          mousePosition = [e.clientX, e.clientY];
          setMouseDown(true);
        }}
        onMouseMove={({ clientX, clientY }) => {
          if (!isMouseDown()) return;
          setPanning(true);
          //   console.log("move");
          const dx = clientX - mousePosition[0];
          const dy = clientY - mousePosition[1];
          //   console.log("dx: ", dx, " dy: ", dy);
          //   setTransform(([x, y]) => [x + dx, y + dy]);
          //   setTranslateX((prev) => prev + dx * 0.5);
          //   setTranslateY((prev) => prev + dy * 0.5);
          setTranslateX((prev) => prev + dx);
          setTranslateY((prev) => prev + dy);
          mousePosition = [clientX, clientY];
        }}
        onMouseUp={(e) => {
          setMouseDown(false);
          setPanning(false);
          e.preventDefault();
        }}
        onMouseLeave={(e) => {
          setMouseDown(false);
          setPanning(false);
          e.preventDefault();
        }}
      >
        <div
          data-rb-board=""
          class="flex flex-col"
          ref={(ref) => (boardRef = ref)}
          style={{
            width: gameWidth + "px",
            height: gameHeight + "px",
            scale: scale(),
            transform:
              "translateX(" +
              translateX() +
              "px)  translateY(" +
              translateY() +
              "px)",
          }}
        >
          <Index each={rows}>
            {(row, rowIndex) => (
              <div
                data-rb-row={rowIndex}
                class="flex"
                style={{
                  width: gameHeight + "px",
                  height:
                    gameHeight / difficulties[difficulty()].cellsPerRow + "px",
                }}
              >
                <Index each={row()}>
                  {(cell, cellIndex) => (
                    <span
                      data-rb-cell=""
                      data-rb-r={rowIndex}
                      data-rb-c={cellIndex}
                      data-is-clicked={cell().isClicked}
                      class={`inline-flex select-none items-center justify-center border-[.5px] transition-colors data-[is-clicked="false"]:hover:bg-muted-foreground ${getCellBg(cell())}`}
                      style={{
                        width:
                          gameHeight / difficulties[difficulty()].cellsPerRow +
                          "px",
                        height:
                          gameHeight / difficulties[difficulty()].cellsPerRow +
                          "px",
                        "font-size": "80%",
                        "pointer-events": isPanning() ? "none" : "auto",
                      }}
                      onClick={() => {
                        if (!cell().isFlagged) {
                          onClick(
                            cell(),
                            cellIndex,
                            rowIndex,
                            difficulties[difficulty()],
                          );
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();

                        // ignore if already clicked
                        if (cell().isClicked) return;

                        setRemainingFlags((prev) =>
                          cell().isFlagged ? prev - 1 : prev + 1,
                        );
                        updateRows(
                          (prev) =>
                            (prev[rowIndex][cellIndex].isFlagged =
                              !cell().isFlagged),
                        );
                      }}
                    >
                      <Show when={cell().isFlagged}>
                        <Flag class="size-3/4" fill="red" data-rb-icon="flag" />
                      </Show>
                      <Show when={cell().isClicked}>
                        <Show
                          when={cell().isMine}
                          fallback={<NeighborsNumber num={cell().neighbors} />}
                        >
                          <Mine
                            class="h-fit bg-destructive"
                            fill="hsl(var(--background))"
                            data-rb-icon="mine"
                          />
                        </Show>
                      </Show>
                    </span>
                  )}
                </Index>
              </div>
            )}
          </Index>
        </div>
      </div>
      <Slider
        data-rb-zoom=""
        class="absolute bottom-10 right-1/2 w-3/4 translate-x-1/2"
        minValue={minScale}
        maxValue={maxScale}
        step={stepScale}
        value={[scale()]}
        onChange={(v) => {
          setScale(v[0]);
        }}
        labelText="Zoom"
      />
    </div>
  );
};

const GameOverAlert = () => (
  <Show when={isGameOver()}>
    <Alert class="border-destructive" data-rb-alert="over">
      <CircleX class="size-4" color="hsl(var(--destructive))" />
      <AlertTitle data-rb-alert-title="">Game over :(</AlertTitle>
      <AlertDescription>skill issue smh...</AlertDescription>
    </Alert>
  </Show>
);

const GameWonAlert = () => (
  <Show when={isGameWon()}>
    <Alert class="" data-rb-alert="won">
      <CircleCheckBig class="size-4" color="hsl(var(--foreground))" />
      <AlertTitle data-rb-alert-title="">You win :D</AlertTitle>
      <AlertDescription>
        You deserve a cookie! Click{" "}
        <a
          href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          class="text-foreground underline underline-offset-2"
        >
          this
        </a>{" "}
        to collect it ;)
      </AlertDescription>
    </Alert>
  </Show>
);

const [timeElapsed, setTimeElapsed] = createSignal(0);

const Toolbar = () => {
  return (
    <div class="flex w-full items-center justify-center gap-3 pt-3 [&>*]:h-6">
      <Badge variant={"outline"} class="text-muted-foreground" data-rb-badge="difficulty">
        {difficulties[difficulty()].name}
      </Badge>
      <Badge variant={"outline"} data-rb-badge="flags">
        <Flag class="size-4" />
        &nbsp;{remainingFlags()}
      </Badge>
      <Badge
        variant={"outline"}
        class="flex w-16 justify-center text-muted-foreground"
        data-rb-badge="clock"
      >
        <Show
          when={timeElapsed() > 999999}
          fallback={paddZeroes(timeElapsed(), 6)}
        >
          999999
        </Show>
      </Badge>
      <Button
        aria-label="restart"
        variant={"destructive"}
        data-rb-action="restart"
        class="py-2"
        onClick={() => {
          setGameWon(false);
          setTimeElapsed(0);
          window.clearInterval(timerRef());
          setRemainingFlags(difficulties[difficulty()].mineCount);
          setRows(initRows(difficulties[difficulty()]));
        }}
      >
        <RotateCcw size={".75rem"} />
      </Button>
      {/* <Button variant={"secondary"} class="py-2">
        <Settings2 size={".75rem"} />
      </Button> */}
      <SettingsPopover />
    </div>
  );
};

const SettingsPopover = () => {
  const [isOpen, setOpen] = createSignal(true);
  const [selected, setSelected] = createSignal(0);
  const budgetDifficulty = difficulty();
  return (
    <Popover open={isOpen()} onOpenChange={(b) => setOpen(b)}>
      <PopoverTrigger
        class={cn(buttonVariants({ variant: "secondary" }), "h-6 py-2")}
        data-rb-action="settings"
      >
        <Settings2 size={".75rem"} />
      </PopoverTrigger>
      <PopoverContent class="flex flex-col gap-2" data-rb-settings="content">
        <PopoverTitle>Settings</PopoverTitle>
        <h2 class="text-sm italic">Standard mode</h2>
        <Index each={Object.values(difficulties)}>
          {(diff, i) => (
            <div
              data-rb-difficulty={diff().name}
              data-rb-selected={selected() === i}
              class={`rounded-md border p-2 transition-colors hover:bg-secondary ${
                selected() === i ? "bg-secondary" : "bg-background"
              }`}
              onClick={() => {
                setSelected(i);
              }}
            >
              <h3 class="text-sm font-semibold">{diff().name}</h3>
              <ul class="flex items-center justify-start gap-1 text-xs text-muted-foreground">
                <li>
                  {diff().rows}&times;{diff().cellsPerRow}
                </li>
                <li aria-hidden>•</li>
                <li class="flex items-center">
                  {diff().mineCount}{" "}
                  <Mine
                    // TODO ugh I shouldn't have to use margin
                    class="mt-[.1rem] size-3"
                    fill="hsl(var(--foreground))"
                  />
                </li>
                <li aria-hidden>•</li>
                <li class="flex items-center">
                  {(
                    (diff().mineCount / (diff().rows * diff().cellsPerRow)) *
                    100
                  ).toFixed(2)}
                  <Percent class="size-3" />
                </li>
              </ul>
            </div>
          )}
        </Index>
        <div class="w-full">
          <Button
            class="float-end"
            data-rb-action="start"
            onClick={() => {
              const diff = difficulties[selected()];
              setDifficulty(selected());
              setRemainingFlags(difficulties[budgetDifficulty].mineCount);
              setRows(initRows(diff));
              setTimeElapsed(0);
              setOpen(false);
            }}
          >
            start
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const NeighborsNumber = (props: { num: number }) => (
  <div class="flex items-center justify-center" data-rb-icon="number">
    <Show when={props.num <= 0 || props.num > 8}>&nbsp;</Show>
    <Show when={props.num === 1}>
      <One class="size-3/4" />
    </Show>
    <Show when={props.num === 2}>
      <Two class="size-3/4" />
    </Show>
    <Show when={props.num === 3}>
      <Three class="size-3/4" />
    </Show>
    <Show when={props.num === 4}>
      <Four class="size-3/4" />
    </Show>
    <Show when={props.num === 5}>
      <Five class="size-3/4" />
    </Show>
    <Show when={props.num === 6}>
      <Six class="size-3/4" />
    </Show>
    <Show when={props.num === 7}>
      <Seven class="size-3/4" />
    </Show>
    <Show when={props.num === 8}>
      <Eight class="size-3/4" />
    </Show>
  </div>
);

const getCellBg = (cell: Cell) => {
  // if (cell.isFlagged) {
  //   return "bg-secondary";
  // }
  if (!cell.isClicked && !cell.isMine) {
    return "bg-background";
  }
  if (cell.isMine && cell.isClicked) {
    return "bg-destructive";
  }
  // cell is clicked
  return "bg-secondary";
};
