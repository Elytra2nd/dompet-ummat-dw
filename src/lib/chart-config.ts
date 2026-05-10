// Standardized Recharts configuration presets
// Use these to ensure consistent styling across all charts

export const chartColorPalette = {
  grid: '#f1f5f9',
  gridDash: '3 3',
  axisStroke: '#cbd5e1',
  text: '#64748b',
  textBold: '#475569',
  tooltip: {
    bg: '#ffffff',
    border: 'none',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: 12,
  },
} as const

export const chartAxisConfig = {
  xAxis: {
    fontSize: 11,
    fill: chartColorPalette.text,
    fontWeight: 500,
  },
  yAxis: {
    fontSize: 10,
    fill: chartColorPalette.text,
    fontWeight: 500,
  },
  angleAxis: {
    fontSize: 12,
    fill: chartColorPalette.textBold,
    fontWeight: 700,
  },
} as const

export const getTooltipConfig = () => ({
  contentStyle: {
    backgroundColor: chartColorPalette.tooltip.bg,
    border: chartColorPalette.tooltip.border,
    boxShadow: chartColorPalette.tooltip.shadow,
    borderRadius: chartColorPalette.tooltip.borderRadius,
  },
  cursor: { fill: 'rgba(99, 102, 241, 0.1)' },
})
