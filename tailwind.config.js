/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          violet: '#7157F5',
          'violet-hover': '#5F46D8',
          'violet-light': '#F4F1FF',
          'violet-border': '#E4DCFF',
          dark: '#17181C',
          'dark-hover': '#292B30',
        },
        surface: {
          canvas: '#FAFAF9',
          card: '#FFFFFF',
          subtle: '#F8F8F7',
          border: '#ECEEF1',
          'border-hover': '#D0D5DD',
        },
        text: {
          primary: '#17181C',
          secondary: '#667085',
          muted: '#98A2B3',
        },
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f8fafc',
          muted: '#94a3b8'
        }
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        'xs': '0 1px 2px 0 rgba(16, 24, 40, 0.05)',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

