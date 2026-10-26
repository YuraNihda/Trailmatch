/** Neutral tokens: wireframes are monochrome and no design system exists yet (see README). */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#18181b", panel: "#dededf", accent: "#3f444b" },
      fontFamily: { sans: ["DM Sans", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
