import React from "react";
import { DogeCounter } from "../common/doge-countup";
import { Header } from "../common/header";
import { useGameStore, useHashRate } from "../engine/game";
import "../odometer.css";
import Modal from "react-modal";
import { SettingsModal } from "./settings-modal";
import ReactGA from "react-ga";

const DogeIcon = () => (
  <img
    src="/assets/dogecoin-logo.png"
    style={{ height: "1rem", paddingRight: "0.5rem" }}
  />
);

export const MyStuff: React.FC = () => {
  const gameStore = useGameStore();
  const hashRate = useHashRate();

  const [isResetModalOpen, setResetModalOpen] = React.useState(false);

  React.useEffect(() => {
    if (isResetModalOpen) {
      ReactGA.modalview("/settings");
    }
  }, [isResetModalOpen]);

  return (
    <div className="panel my-panel" data-testid="rb-inventory-panel">
      <Header>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Much Inventory
          <img
            data-testid="rb-settings-open"
            src="/assets/crappy-gear.svg"
            style={{ height: "1.5rem", cursor: "pointer" }}
            onClick={() => {
              setResetModalOpen(true);
              gameStore.pause();
            }}
          />
        </div>
      </Header>
      <Modal
        isOpen={isResetModalOpen}
        onRequestClose={() => {
          setResetModalOpen(false);
          gameStore.resume();
        }}
        ariaHideApp={false}
        style={{ overlay: { zIndex: 1000 } }}
      >
        <SettingsModal
          closeModal={() => {
            setResetModalOpen(false);
            gameStore.resume();
          }}
        />
      </Modal>
      <div
        style={{
          padding: 10,
          fontFamily: "Comic Mono",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ paddingRight: "0.5rem" }} data-testid="rb-dogecoin-label">Dogecoin:</div>
          <DogeCounter dogecoin={gameStore.dogecoin} />
          <DogeIcon />
        </div>
        <div
          style={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span data-testid="rb-usd-line">USD: ${gameStore.usd.toFixed(2)}</span>
        </div>
        <div
          style={{
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span data-testid="rb-level-line">Level: {gameStore.phase}</span>
        </div>

        {(gameStore.largeMiners > 0 ||
          gameStore.mediumMiners > 0 ||
          gameStore.smallMiners > 0) && (
          <>
            <div
              style={{
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                paddingTop: 10,
              }}
            >
              Mining Stuff
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <span data-testid="rb-hash-rate-line">HASH RATE: {hashRate.toFixed(2)}</span>{" "}
              <div style={{ paddingRight: "0.2rem" }} />
              <DogeIcon /> per sec
            </div>

            {gameStore.smallMiners > 0 && (
              <div data-testid="rb-crappy-miners-line">Crappy Miners: {gameStore.smallMiners}</div>
            )}
            {gameStore.mediumMiners > 0 && (
              <div data-testid="rb-decent-miners-line">Decent Miners: {gameStore.mediumMiners}</div>
            )}
            {gameStore.largeMiners > 0 && (
              <div data-testid="rb-good-miners-line">Good Miners: {gameStore.largeMiners}</div>
            )}
          </>
        )}
        {gameStore.realEstate.length > 0 && (
          <>
            <div style={{ marginTop: 10, fontWeight: "bold" }} data-testid="rb-properties-heading">Properties</div>
            {gameStore.realEstate.map((place) => (
              <div key={place} data-testid={`rb-property-${place.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{place}</div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
