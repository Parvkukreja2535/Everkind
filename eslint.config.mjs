import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { rules: { "react/no-unescaped-entities": "off" } },
  { ignores: [".next/**", "node_modules/**", "docs/**", "next-env.d.ts"] },
];

export default config;
