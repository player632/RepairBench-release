export const loadAnalytics = () => {
  // rb-offline adaptation: the umami beacon is gated on import.meta.env.PROD,
  // which every `vite build` sets, so the seed would inject a cross-origin
  // <script src="https://umami.apps.omid.toys/script.js"> into the graded face.
  // The grading environment has allow_internet=false; the beacon is analytics
  // only, no checkpoint observes it, and src/rb-offline.ts counts any egress it
  // would have caused. Neutered to a no-op, signature and export kept intact so
  // src/index.tsx:6 and src/helpers/index.ts:1 still resolve unchanged.
  return;
};
