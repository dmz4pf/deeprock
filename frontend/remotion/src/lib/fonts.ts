import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

const playfair = loadPlayfair("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

const outfit = loadOutfit("normal", {
  weights: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const FONT_SERIF = playfair.fontFamily;
export const FONT_SANS = outfit.fontFamily;
