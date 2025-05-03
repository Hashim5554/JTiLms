import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				todo: {
					primary: '#9b87f5',
					secondary: '#7E69AB',
					tertiary: '#6E59A5',
					text: '#1A1F2C',
					bg: '#F1F0FB',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-out': {
					'0%': { opacity: '1', transform: 'translateY(0)' },
					'100%': { opacity: '0', transform: 'translateY(10px)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'rotate-y': {
					'0%': { transform: 'rotateY(0deg)' },
					'100%': { transform: 'rotateY(360deg)' }
				},
				'paper-lift': {
					'0%': { transform: 'translateZ(0) translateY(0)', boxShadow: '0 0 0 rgba(0,0,0,0.1)' },
					'100%': { transform: 'translateZ(20px) translateY(-5px)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-out': 'fade-out 0.3s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'rotate-y-slow': 'rotate-y 12s linear infinite',
				'paper-lift': 'paper-lift 0.3s ease-out forwards'
			},
			perspective: {
				'1000': '1000px',
				'2000': '2000px'
			},
			rotateY: {
				'1': '1deg',
				'3': '3deg',
				'5': '5deg',
				'-1': '-1deg',
				'-3': '-3deg',
				'-5': '-5deg'
			},
			translateZ: {
				'2': '2px',
				'5': '5px',
				'10': '10px',
				'20': '20px'
			},
			transformStyle: {
				'preserve-3d': 'preserve-3d'
			},
			backdropFilter: {
				'none': 'none',
				'blur': 'blur(4px)'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities, theme, addComponents, e }: any) {
			const newUtilities = {
				'.perspective-1000': {
					perspective: '1000px'
				},
				'.perspective-2000': {
					perspective: '2000px'
				},
				'.transform-style-3d': {
					transformStyle: 'preserve-3d'
				},
				'.backface-hidden': {
					backfaceVisibility: 'hidden'
				},
				'.rotate-y-1': {
					transform: 'rotateY(1deg)'
				},
				'.rotate-y-3': {
					transform: 'rotateY(3deg)'
				},
				'.rotate-y-5': {
					transform: 'rotateY(5deg)'
				},
				'.rotate-y-neg-1': {
					transform: 'rotateY(-1deg)'
				},
				'.translate-z-2': {
					transform: 'translateZ(2px)'
				},
				'.translate-z-5': {
					transform: 'translateZ(5px)'
				},
				'.translate-z-10': {
					transform: 'translateZ(10px)'
				},
				'.translate-z-20': {
					transform: 'translateZ(20px)'
				}
			};
			addUtilities(newUtilities);

			// Add notepad-specific components
			addComponents({
				'.notepad-container': {
					position: 'relative',
					transformStyle: 'preserve-3d',
					perspective: '1000px'
				},
				'.notepad-paper': {
					backgroundColor: 'white',
					borderRadius: '0.5rem',
					boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
					transition: 'transform 0.3s ease, box-shadow 0.3s ease',
					position: 'relative',
					overflow: 'hidden',
					'&:hover': {
						transform: 'translateZ(10px) translateY(-5px)',
						boxShadow: '0 15px 30px rgba(0,0,0,0.15)'
					}
				},
				'.notepad-line': {
					backgroundColor: 'rgba(159, 122, 234, 0.1)',
					height: '1px',
					width: '100%',
					marginTop: '1.5rem',
					marginBottom: '1.5rem'
				}
			});
		}
	],
} satisfies Config;
