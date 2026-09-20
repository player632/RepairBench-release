<template>
  <div id="game">
    <Notifications />
    <Reservations
      v-if="askForReservations()"
      :player="game.players[0]"
      @reservation-selected="declareReservation"
    />
    <Table :game="game" />
    <OptionsMenu />
    <ShowPreviousTrick :trick="game.previousTrick" />
  </div>
</template>

<script setup lang="ts">
import { type PropType, reactive } from "vue";
import Notifications from "@/components/Notifications.vue";
import Table from "@/components/Table.vue";
import OptionsMenu from "@/components/OptionsMenu.vue";
import ShowPreviousTrick from "@/components/ShowPreviousTrick.vue";
import Reservations from "@/components/reservations/Reservations.vue";
import { Game } from "@/models/game";
import { Features } from "@/models/features";
import { RoundState } from "@/models/round";
import { Reservation } from "@/models/reservations";

const props = defineProps({
  game: {
    type: Object as PropType<Game>,
    default: () => Game.singlePlayer(),
  },
});

// This one's essential. With vue 3 we need to explicitly tell vue which part of our
// data is supposed to be reactive. Since we're always passing the same game instance (or parts thereof)
// to all of our components, it's good enough to make the top-level `game` object reactive once.
const game = reactive(props.game);

// [repair-bench instrumentation] publish the EXISTING reactive game object under window.__rbGame.
// One assignment of an already-live reference: it reads no property, writes no property, calls no
// method, adds no listener and changes no value, so it cannot move any measured reading.
window.__rbGame = game;

function askForReservations() {
  if (!Features.enableReservations) {
    return false;
  }

  return game.currentRound.roundState === RoundState.AskingForReservations;
}

function declareReservation(reservation: Reservation) {
  game.players[0].declareReservation(reservation);
  game.currentRound.startRound();
}
</script>

<style scoped>
#game {
  height: 100%;
}
</style>
