/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Primary font for body text
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Heading font
        heading: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        // Monospace font for code
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Custom font sizes for better hierarchy
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      colors: {
        // Existing Tailwind compatibility colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Bootstrap-inspired color palette for E-learning
        'bs-primary': 'var(--bs-primary)',
        'bs-secondary': 'var(--bs-secondary)',
        'bs-success': 'var(--bs-success)',
        'bs-danger': 'var(--bs-danger)',
        'bs-warning': 'var(--bs-warning)',
        'bs-info': 'var(--bs-info)',
        'bs-light': 'var(--bs-light)',
        'bs-dark': 'var(--bs-dark)',
        
        // Bootstrap grays
        'bs-gray': {
          100: 'var(--bs-gray-100)',
          200: 'var(--bs-gray-200)',
          300: 'var(--bs-gray-300)',
          400: 'var(--bs-gray-400)',
          500: 'var(--bs-gray-500)',
          600: 'var(--bs-gray-600)',
          700: 'var(--bs-gray-700)',
          800: 'var(--bs-gray-800)',
          900: 'var(--bs-gray-900)',
        },
        
        // Education-themed colors using Bootstrap variables
        blue: {
          50: '#f0f8ff',
          100: 'var(--bs-primary-bg-subtle)',
          500: 'var(--bs-primary)',
          600: 'var(--bs-primary-text-emphasis)',
          700: 'var(--bs-blue)',
          DEFAULT: 'var(--bs-primary)',
        },
        green: {
          50: '#f0fff4',
          100: 'var(--bs-success-bg-subtle)',
          500: 'var(--bs-success)',
          600: 'var(--bs-success-text-emphasis)',
          700: 'var(--bs-green)',
          DEFAULT: 'var(--bs-success)',
        },
        orange: {
          50: '#fff7ed',
          100: 'var(--bs-warning-bg-subtle)',
          500: 'var(--bs-warning)',
          600: 'var(--bs-warning-text-emphasis)',
          700: 'var(--bs-orange)',
          DEFAULT: 'var(--bs-warning)',
        },
        red: {
          50: '#fef2f2',
          100: 'var(--bs-danger-bg-subtle)',
          500: 'var(--bs-danger)',
          600: 'var(--bs-danger-text-emphasis)',
          700: 'var(--bs-red)',
          DEFAULT: 'var(--bs-danger)',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          500: 'var(--bs-purple)',
          600: '#7c3aed',
          700: '#6d28d9',
          DEFAULT: 'var(--bs-purple)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
