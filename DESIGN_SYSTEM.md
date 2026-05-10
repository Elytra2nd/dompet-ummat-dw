# Design System & UI Standards — dompet-ummat-dw

This document outlines the UI/UX standards and design system conventions for consistent, high-quality interfaces across the application.

## TIER 1: Foundation (Completed)
✅ Typography hierarchy (font-bold for h1, semibold for labels)
✅ Color palette standardization (indigo/emerald/rose/amber module colors)
✅ Spacing consistency (px-4, sm:px-6, lg:px-8 responsive pattern)
✅ Bug fixes & link corrections

## TIER 2: Component Consistency (Completed)
✅ **Loading States**: All tables use `<Loader2 className="h-8 w-8 animate-spin text-{color}-400 mx-auto" />` with "Memuat data..." label below
✅ **Empty States**: All data-empty scenarios use `<EmptyState />` component with consistent icon/title/description
✅ **Table Headers**: Standardized to `font-bold text-[10px] uppercase tracking-wider text-slate-500`
✅ **Form Consistency**: Label color `text-slate-600`, submit button `h-11`, field spacing `space-y-2`
✅ **Mobile Fallback**: Table pages include `sm:hidden` card view for mobile users

## TIER 3: Visual Polish (Completed)

### Badge Component
Use the `Badge` component with standardized size variants:
```tsx
// Small badges (9px text)
<Badge size="sm" variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
  Category
</Badge>

// Medium badges (default, 10px text)
<Badge variant="secondary" className="bg-emerald-50 text-emerald-600">
  Status
</Badge>

// Large badges (13px text)
<Badge size="lg" className="bg-blue-50 text-blue-600">
  Label
</Badge>
```

**Size variants:**
- `size="sm"`: `h-4 px-1.5 py-0.5 text-[9px] uppercase` — for compact badge lists
- `size="md"` (default): `h-5 px-2 py-0.5 text-xs uppercase` — standard usage
- `size="lg"`: `h-6 px-3 py-1 text-sm uppercase` — for emphasis

**Do NOT:**
- Mix inline `text-[8px]`, `text-[9px]`, `h-3`, `h-4` with Badge — use size variants instead
- Use variant without clear intent — prefer `outline` for categories, `secondary` for statuses

### Icon Sizing
All Lucide icons in action rows use **`size={16}`** for consistency:
```tsx
<Button variant="ghost" size="icon" aria-label="Lihat detail">
  <Eye size={16} />
</Button>
```

### Chart Configuration
All Recharts use the preset from `@/lib/chart-config`:
```tsx
import { chartColorPalette, getTooltipConfig } from '@/lib/chart-config'

<CartesianGrid strokeDasharray={chartColorPalette.gridDash} stroke={chartColorPalette.grid} />
<Tooltip {...getTooltipConfig()} />
```

### Loading State Colors
Loader icons use the module's accent color:
- Donasi module: `text-indigo-400`
- Mustahik module: `text-emerald-400`
- Ambulan module: `text-rose-400`

## TIER 4: Accessibility & Interaction (Completed)

### Accessibility Requirements
1. **ARIA Labels**: All icon buttons MUST have `aria-label`:
   ```tsx
   <Button aria-label="Edit donatur" size="icon">
     <Edit3 size={16} />
   </Button>
   ```

2. **Semantic HTML**: Use correct semantic tags:
   - `<Button>` for interactive elements (not `<span>`)
   - `<Link>` for navigation (not `<a>`)
   - `<Badge>` for status indicators (not custom `<span>`)

3. **Keyboard Navigation**: All interactive elements should be keyboard accessible
   - Buttons get default focus ring (already in Button component)
   - Links are focusable by default

### Transition Standards
Use transition presets from `@/lib/transitions`:

```tsx
// Quick color transitions (buttons, badges)
className={`${transitionClasses.quick} hover:opacity-80`}

// Default transitions (cards, links)
className={`${transitionClasses.default} hover:shadow-lg`}

// Transform-only (icons, avatars)
className={`${transitionClasses.transform} group-hover:scale-110`}
```

**Standard durations:**
- `duration-200`: Micro-interactions (quick feedback)
- `duration-300`: Default (most elements)
- `duration-500`: Emphasis (modals, reveals)

### Micro-interactions

**Buttons:**
- Hover: Subtle color/opacity change
- Active: `active:scale-95` for tactile feedback (only on primary actions)
- Focus: Ring from component default (no custom needed)

**Table Rows:**
- `hover:bg-slate-50/30` or module color at 50% opacity
- `transition-colors` for smooth color shift

**Cards:**
- `hover:shadow-lg` for elevation
- `transition-all duration-300` for smooth animation

**Icons:**
- `group-hover:scale-110` for action buttons (16px icons)
- No blur or opacity changes — keep icons crisp

### Dark Mode Preparation
The design system is ready for dark mode implementation:
- No hardcoded light-only colors (avoid `#ffffff`, use `white`)
- Color values use Tailwind classes (easy to add `dark:` variants)
- Charts use preset configuration (can accept `theme` param for dark colors)

To implement dark mode:
```tsx
// Example: Add dark variant to any element
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
```

## Common Patterns

### Data Table Loading State
```tsx
{loading ? (
  <TableRow>
    <TableCell colSpan={n} className="h-40 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-{color}-400 mx-auto" />
      <p className="mt-2 text-xs font-bold text-slate-400">Memuat data...</p>
    </TableCell>
  </TableRow>
) : currentItems.length === 0 ? (
  <EmptyState asTableRow colSpan={n} title="Belum ada data" description="..." />
) : (
  currentItems.map(...) // rows
)}
```

### Form Field
```tsx
<div className="space-y-2">
  <Label className="text-xs font-bold text-slate-600 uppercase">Field Name</Label>
  <Input placeholder="..." />
</div>
```

### Action Button Row
```tsx
<div className="flex items-center justify-end gap-1">
  <Link href={`/path/${id}`}>
    <Button variant="ghost" size="icon" aria-label="Lihat detail">
      <Eye size={16} />
    </Button>
  </Link>
  <Button variant="ghost" size="icon" aria-label="Edit" onClick={handleEdit}>
    <Edit3 size={16} />
  </Button>
</div>
```

## Utilities & Constants

### Color Palette Modules
```
Donasi:    indigo-600 (primary), indigo-50/400 (accents)
Mustahik:  emerald-600 (primary), emerald-50/400 (accents)
Ambulan:   rose-600 (primary), rose-50/400 (accents)
Donasi Keluar: amber-600 (primary), amber-50/400 (accents)
```

### Spacing Scale
```
Compact:   gap-1, px-1.5, py-0.5  (badges, pills)
Standard:  gap-2, px-3, py-2      (form fields, buttons)
Relaxed:   gap-4, px-6, py-4      (cards, sections)
Spacious:  gap-6, px-8, py-6      (page-level)
```

### Border Radius
```
sm: rounded-lg (form inputs, small components)
md: rounded-xl (cards, modals)
lg: rounded-2xl (hero sections, features)
```

## Future Considerations

- [ ] Storybook component library documentation
- [ ] Figma design system mirror
- [ ] Dark mode implementation (CSS variables ready)
- [ ] Animated transitions for page navigation
- [ ] Custom focus indicators for better keyboard UX
- [ ] Print styles for reports
- [ ] RTL layout support (if internationalizing)
