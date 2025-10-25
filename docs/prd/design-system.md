# Design System

**Complete Design System:** See [design-system.md](./design-system.md)

**v0 Component Prompts:** See [v0-prompts.md](./v0-prompts.md)

## Design Philosophy Summary

**"Reverence for the written word meets modern minimalism"**

Inspired by:
- iOS Books app (clean, focused reading)
- Illuminated manuscripts (warmth, craftsmanship)
- Apple HIG (clarity, restraint, delight)

## Quick Reference

**Color Palette:**
```css
--parchment: #F9F6F0;      /* Warm background */
--ink: #1A1614;            /* Text (never pure black) */
--gold: #D4A574;           /* Accent, highlights */
--sepia: #8B7355;          /* Secondary UI */
--crimson: #A4443E;        /* Errors only */
```

**Typography:**
```css
--font-reading: 'Merriweather', Georgia, serif;  /* 20px, 1.75 line-height */
--font-ui: -apple-system, system-ui, sans-serif;  /* 16px, 1.5 line-height */
```

**Animation:**
```css
--duration-fast: 200ms;
--duration-normal: 300ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);  /* Apple's ease */
```

**Spacing:** 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96)

## Key Design Decisions

1. **Warm, not cold** - Parchment backgrounds, gold accents (not blue/gray)
2. **Generous spacing** - 80px reading margins, 1.75 line-height
3. **Minimal animation** - Only hover, modal entry, audio playing indicator
4. **Serif for content** - Sans for UI chrome
5. **Subtle interactions** - Low-opacity highlights, 1px underlines
6. **Apple-level polish** - Clean shadows, smooth easing, attention to detail

## Component-Specific Notes

**DefinitionSidebar:** Desktop = slide from right (400px), Mobile = bottom sheet (80vh)

**ClickableWord:** Hover = subtle gold background (8% opacity) + gold underline

**AudioButton:** Idle = parchment bg, Playing = gold bg with pulse animation

**VocabularyList:** White cards on parchment, subtle shadow, hover lift

---
