/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  // Disable Preflight (the CSS reset) so Tailwind does not conflict
  // with the existing SCSS styles used throughout CleverDeal.React.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        symphony: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          hover:   '#1e293b',
          active:  '#1e293b',
          border:  '#1e293b',
        },
        channel: {
          symphony: '#6366f1',
          whatsapp: '#22c55e',
          sms:      '#f97316',
          wechat:   '#10b981',
          email:    '#3b82f6',
          secure:   '#8b5cf6',
        },
      },
      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
