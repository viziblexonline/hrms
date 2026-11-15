import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B5E20",
          dark: "#0F3D14",
          light: "#2E7D32",
          soft: "#E8F5E9",
          muted: "#C8E6C9",
          mist: "#F2F7F3",
        },
        ink: {
          DEFAULT: "#122018",
          soft: "#3D5245",
          mute: "#6B7F72",
        },
        gold: {
          DEFAULT: "#C9A227",
          bright: "#E8C547",
          deep: "#8A6B14",
          soft: "#FBF3D8",
          mist: "#F7E9B8",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
        arabic: ["var(--font-arabic)", "Noto Naskh Arabic", "serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(27, 94, 32, 0.06), 0 18px 40px rgba(15, 61, 20, 0.07)",
        lift: "0 24px 50px rgba(15, 61, 20, 0.12)",
        nav: "0 10px 30px rgba(15, 61, 20, 0.10)",
        gold: "0 10px 28px rgba(201, 162, 39, 0.22)",
      },
      borderRadius: {
        panel: "1.75rem",
      },
      backgroundImage: {
        "mesh-green":
          "radial-gradient(ellipse at 20% 10%, rgba(46,125,50,0.18), transparent 45%), radial-gradient(ellipse at 80% 0%, rgba(27,94,32,0.12), transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(200,230,201,0.45), transparent 50%)",
        "arch-fade":
          "linear-gradient(160deg, #0F3D14 0%, #1B5E20 48%, #245c2b 100%)",
        "gold-fade":
          "linear-gradient(135deg, #FFF8E7 0%, #F7E9B8 45%, #F0D78C 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
