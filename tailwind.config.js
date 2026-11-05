/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: { navy: "#172554", ink: "#182230", muted: "#667085", canvas: "#f6f7fb" },
      boxShadow: { soft: "0 8px 30px rgba(16, 24, 40, .045)" },
    },
  },
  plugins: [],
};
