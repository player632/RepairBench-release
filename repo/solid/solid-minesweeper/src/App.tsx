import { type Component } from "solid-js";
import { Game } from "./components/Game";

const App: Component = () => {
  return (
    <div class="fixed inset-0 overflow-hidden px-10 py-4">
      <div class="flex h-full flex-col items-center justify-center">
        <h1 class="text-4xl font-bold tracking-wide" data-rb-title="">Minesweeper</h1>
        <Game />
      </div>
    </div>
  );
};

export default App;
