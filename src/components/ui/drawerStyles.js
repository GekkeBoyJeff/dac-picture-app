// Token-backed class strings shared by drawers/panels.
// Prefer the <Surface> primitive for new code; these remain so existing
// consumers pick up the "Refined Midnight + Gold" language during migration.

export const drawerShellClass =
  "rounded-t-[1.75rem] border border-hairline-strong bg-raised shadow-[0_-1px_0_rgba(245,241,232,0.06)_inset,0_-24px_60px_rgba(0,0,0,0.6)]"

export const drawerHeaderClass = "border-b border-hairline"

export const drawerCardClass =
  "rounded-2xl border border-hairline bg-surface shadow-[0_1px_0_rgba(245,241,232,0.04)_inset]"

export const drawerCompactCardClass = "rounded-xl border border-hairline bg-surface"

export const drawerOptionCardClass =
  "rounded-lg border border-hairline bg-surface shadow-[0_1px_0_rgba(245,241,232,0.04)_inset]"

export const drawerSoftPillClass =
  "rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-ink-muted"

export const drawerInnerCardClass = "rounded-2xl border border-hairline bg-raised"

export const drawerSectionLabelClass = "text-[0.7rem] uppercase tracking-[0.2em] text-ink-dim"

export const drawerSectionHelpClass = "text-xs leading-5 text-ink-muted"

export const drawerButtonBaseClass = "transition-all duration-200"

export const drawerFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-0"