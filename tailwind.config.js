/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Brand colors using CSS variables
        brand: {
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          secondary: 'var(--brand-secondary)',
          'secondary-hover': 'var(--brand-secondary-hover)',
        },
        
        // UI colors
        ui: {
          background: 'var(--ui-background)',
          surface: 'var(--ui-surface)',
          'surface-hover': 'var(--ui-surface-hover)',
          border: 'var(--ui-border)',
        },
        
        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        
        // Keep existing gaming colors for backwards compatibility
        gaming: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          accent: '#10B981',
          dark: '#111827',
          darker: '#0F172A',
        }
      },
      
      // Brand gradient backgrounds
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))',
        'brand-gradient-to-br': 'linear-gradient(to bottom right, var(--brand-primary), var(--brand-secondary))',
      },
      
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}