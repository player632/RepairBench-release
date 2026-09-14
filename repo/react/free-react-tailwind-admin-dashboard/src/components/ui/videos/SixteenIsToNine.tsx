export default function SixteenIsToNine() {
  return (
    <div className="aspect-4/3 overflow-hidden rounded-lg">
      {/* RB-ADAPT (offline determinism, no application logic): upstream embedded a
          third-party video player here, so opening this route fired live external
          requests. The offline verifier must never depend on a third-party host; the
          frame keeps its element, title and aspect-ratio box but loads a same-process
          blank document (zero requests). Original URL: see meta.json
          network.known_externals. */}
      <iframe
        src="about:blank"
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      ></iframe>
    </div>
  );
}
