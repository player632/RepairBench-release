/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.tsx", "modules"],
  theme: {
    extend: {
        colors: {
            primary: "#4493F8", 
            button: "#161B22",
            placeholder: "#A1A1AA",
            background: "#0d1117"
        }
    },
  },
  plugins: [],
}

