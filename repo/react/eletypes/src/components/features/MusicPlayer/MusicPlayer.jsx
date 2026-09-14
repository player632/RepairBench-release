import React from "react";

const MusicPlayer = ({ disabled, isZenMode }) => {
  const height = isZenMode ? "80" : "240";

  return (
    <div
      style={{
        display: disabled ? "none" : "block",
        transition: "opacity 0.2s",
      }}
    >
      <iframe
        style={{ borderRadius: "12px" }}
        title="spotify-player"
        src="https://open.spotify.com/embed/playlist/07iwWrF9q54KJ8XaolRj5Y?utm_source=generator&theme=0"
        width="100%"
        height={height}
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      />
    </div>
  );
};

export default MusicPlayer;
