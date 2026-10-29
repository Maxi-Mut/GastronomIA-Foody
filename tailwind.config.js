/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        foody: {
          sidebar: '#133829',
          sidebarHover: '#1a4a37',
          sidebarActive: 'rgba(255, 255, 255, 0.12)',
          bg: '#F8F7F2',
          bgDark: '#121513',
          card: '#FFFFFF',
          cardDark: '#1E2320',
          gold: '#D4AF37',
          goldLight: '#F5E7B2',
          greenDark: '#133829',
          greenAccent: '#2E7D52',
          textMain: '#232724',
          textMuted: '#68706A',
          border: '#E8E6DF',
          warningBg: '#FFFBEB',
          warningBorder: '#FDE68A',
          warningText: '#92400E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 14px -2px rgba(19, 56, 41, 0.06)',
        'card': '0 4px 20px -2px rgba(19, 56, 41, 0.08)',
        'float': '0 12px 30px -4px rgba(19, 56, 41, 0.14)',
      }
    },
  },
  plugins: [],
}
