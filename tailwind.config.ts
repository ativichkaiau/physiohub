import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ph: {
          bg: "var(--ph-bg)",
          surface: "var(--ph-surface)",
          surface2: "var(--ph-surface-2)",
          text: "var(--ph-text)",
          muted: "var(--ph-muted)",
          accent: "var(--ph-accent)",
          accent2: "var(--ph-accent-2)",
          curve1: "var(--ph-curve-1)",
          curve2: "var(--ph-curve-2)",
          curveRef: "var(--ph-curve-ref)",
          axis: "var(--ph-axis)",
          grid: "var(--ph-grid)",
          warn: "var(--ph-warn)"
        }
      },
      borderRadius: {
        ph: "var(--ph-radius)"
      },
      boxShadow: {
        ph: "var(--ph-shadow)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
