/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                ,
                orange: {
                        50: 'var(--theme-surface, #fff7ed)',
                        100: '#ffedd5',
                        200: 'var(--theme-border, #fed7aa)',
                        300: '#fdba74',
                        400: '#fb923c',
                        500: 'var(--theme-primary, #f97316)',
                        600: 'var(--theme-accent, #ea580c)',
                        700: '#c2410c',
                        800: '#9a3412',
                        900: '#7c2d12'
                },
                amber: {
                        50: '#fffbeb',
                        100: '#fef3c7',
                        200: '#fde68a',
                        300: '#fcd34d',
                        400: '#fbbf24',
                        500: 'var(--theme-secondary, #f59e0b)',
                        600: '#d97706',
                        700: '#b45309',
                        800: '#92400e',
                        900: '#78350f'
                }
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        },
                        'fade-in': {
                                '0%': { opacity: '0', transform: 'translateY(20px)' },
                                '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        'fade-in-up': {
                                '0%': { opacity: '0', transform: 'translateY(40px)' },
                                '100%': { opacity: '1', transform: 'translateY(0)' }
                        },
                        'slide-in-right': {
                                '0%': { transform: 'translateX(100%)' },
                                '100%': { transform: 'translateX(0)' }
                        },
                        'slide-in-left': {
                                '0%': { transform: 'translateX(-100%)' },
                                '100%': { transform: 'translateX(0)' }
                        },
                        'scale-in': {
                                '0%': { transform: 'scale(0.9)', opacity: '0' },
                                '100%': { transform: 'scale(1)', opacity: '1' }
                        },
                        'bounce-in': {
                                '0%': { transform: 'scale(0.3)', opacity: '0' },
                                '50%': { transform: 'scale(1.05)' },
                                '70%': { transform: 'scale(0.9)' },
                                '100%': { transform: 'scale(1)', opacity: '1' }
                        },
                        'shimmer': {
                                '0%': { transform: 'translateX(-100%)' },
                                '100%': { transform: 'translateX(100%)' }
                        },
                        'float': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-20px)' }
                        },
                        'pulse-glow': {
                                '0%, 100%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.5)' },
                                '50%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.8)' }
                        },
                        'spin-slow': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' }
                        },
                        'wiggle': {
                                '0%, 100%': { transform: 'rotate(-3deg)' },
                                '50%': { transform: 'rotate(3deg)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'fade-in': 'fade-in 0.6s ease-out',
                        'fade-in-up': 'fade-in-up 0.8s ease-out',
                        'slide-in-right': 'slide-in-right 0.5s ease-out',
                        'slide-in-left': 'slide-in-left 0.5s ease-out',
                        'scale-in': 'scale-in 0.4s ease-out',
                        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        'shimmer': 'shimmer 2s infinite',
                        'float': 'float 3s ease-in-out infinite',
                        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                        'spin-slow': 'spin-slow 8s linear infinite',
                        'wiggle': 'wiggle 1s ease-in-out infinite'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};