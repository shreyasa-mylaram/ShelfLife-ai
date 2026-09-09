module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0d9488', // Elegant modern teal/sage
        dark: {
          DEFAULT: '#f8f9fc', // Soft light pastel canvas
          lighter: '#f1f5f9', // Soft pastel card hover
          card: '#ffffff',    // Pure crisp white card
          header: '#ffffff',  // Crisp white header
        },
        pastel: {
          mint: '#10b981',
          mintBg: '#ecfdf5',
          mintBorder: '#a7f3d0',
          sky: '#0284c7',
          skyBg: '#f0f9ff',
          skyBorder: '#bae6fd',
          peach: '#d97706',
          peachBg: '#fffbeb',
          peachBorder: '#fde68a',
          rose: '#e11d48',
          roseBg: '#fff1f2',
          roseBorder: '#fecdd3',
          lavender: '#7c3aed',
          lavenderBg: '#f5f3ff',
          lavenderBorder: '#ddd6fe',
          honey: '#ca8a04',
          honeyBg: '#fefce8',
          honeyBorder: '#fef08a',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 170, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 212, 170, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}