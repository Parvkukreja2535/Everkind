import type { Config } from "tailwindcss";

// Everkind design tokens (requirements v1.1, section 11): Evernote-style palette.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        green: { DEFAULT: "#00842A", hover: "#00732A", accent: "#00A82D", tint: "#EEF7F0", soft: "#CFEAD6" },
        ink: "#1A1A1A",
        text: { DEFAULT: "#333333", muted: "#6B6B6B" },
        surface: "#F8F8F8",
        line: "#E6E6E6",
        status: { ok: "#2F6B4F", warn: "#8A5A12", err: "#A23B2C", info: "#2E5A73" },
        amber: { tint: "#FBF5EA", line: "#E5CFA5" },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans Variable"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
      borderRadius: { card: "12px", ctl: "10px" },
      maxWidth: { site: "1200px" },
    },
  },
  plugins: [],
};

export default config;
