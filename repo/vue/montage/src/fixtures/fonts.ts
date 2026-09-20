import { FontItem } from "@/models/font";

// Offline stand-in for the removed remote font-listing call. The families below
// are exactly the ones this repository already names in
// src/components/dashboard/sidebar/tabs/text.vue (TEXT_ITEMS), so the fixture
// introduces no data the tree did not already carry, and the listing stays
// deterministic across runs and machines.
const FAMILIES: string[] = [
  "Roboto",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "IBM Plex Serif",
  "Roboto Mono",
  "Inconsolata",
  "Source Code Pro",
  "Dancing Script",
  "Pacifico",
  "Indie Flower",
  "Lobster",
  "Bebas Neue",
  "Titan One"
];

export const LOCAL_FONTS: FontItem[] = FAMILIES.map((family) => ({
  family,
  variants: ["regular"],
  subsets: ["latin"],
  version: "local",
  lastModified: "1970-01-01",
  files: {},
  category: "local",
  kind: "local#font"
}));
