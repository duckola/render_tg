/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-red': '#550508',
        'button-yellow': '#FBCD36',
        'text-dark': '#333333',
        'form-bg': '#F0F0F0',
        'border-color': '#E0E0E0',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'custom': '9px',
      },
    },
  },
  plugins: [],
}

