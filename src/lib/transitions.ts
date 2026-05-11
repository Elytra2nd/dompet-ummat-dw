// Standardized transition presets for consistent micro-interactions
// Use these classNames for all interactive elements to ensure smooth, unified animations

export const transitionClasses = {
  // Standard transition for color/background changes
  quick: 'transition-all duration-200 ease-out',

  // Standard transition for most interactive elements
  default: 'transition-all duration-300 ease-out',

  // Smooth transition for opacity and visibility changes
  smooth: 'transition-all duration-300 ease-in-out',

  // Slower transition for emphasis/dialog reveals
  emphasis: 'transition-all duration-500 ease-out',

  // Transform-only transitions (prefer these for performance)
  transform: 'transition-transform duration-300 ease-out',
  colorOnly: 'transition-colors duration-300 ease-out',
  opacityOnly: 'transition-opacity duration-300 ease-out',
} as const

// Standard hover/active state patterns
export const interactionPatterns = {
  // Button that pushes down slightly on click
  buttonPress: {
    hover: 'hover:scale-105',
    active: 'active:scale-95',
  },

  // Subtle color shift on hover
  colorShift: {
    hover: 'hover:opacity-80',
    focus: 'focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500',
  },

  // Elevation shift on hover
  elevate: {
    hover: 'hover:shadow-lg',
    active: 'active:shadow-sm',
  },

  // Smooth icon transitions
  icon: {
    default: 'transition-transform duration-300 ease-out',
    hover: 'group-hover:scale-110',
  },
} as const

// Easing functions for advanced animations
export const easings = {
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
} as const
