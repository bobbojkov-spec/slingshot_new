/**
 * DESKTOP CONTRACT (FINAL)
 * Desktop is defined as @media (min-width: 1024px).
 * This module is the single source of truth for desktop layout tokens.
 *
 * IMPORTANT:
 * - Desktop tokens must not be overridden by mobile/tablet logic.
 * - Mobile/tablet must use max-width queries ONLY.
 */

export const desktopBreakpoint = 1024 as const;

/**
 * Desktop container widths (pixels).
 * - `site`: outer design width used across pages
 * - `content`: typical readable content max (if applicable)
 */
export const desktopMaxWidth = 1440 as const;

/**
 * Spacing between major desktop sections (px).
 */
export const desktopSectionSpacing = {
  sectionGap: 64,
  sectionPaddingY: 64,
} as const;

/**
 * Stack gaps used on desktop (px).
 * Mirrors the desktop `Stack` gap scale.
 */
export const desktopStackGaps = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
} as const;

/**
 * Card padding scale on desktop (px).
 * Mirrors the desktop `Card` padding scale.
 */
export const desktopCardPadding = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

/**
 * Button heights used on desktop (px).
 */
export const desktopButtonHeights = {
  primary: 52,
  secondary: 46,
  compact: 48,
} as const;

/**
 * Hero heights used on desktop (px).
 */
export const desktopHeroHeights = {
  home: 400,
  shop: 460,
  explore: 320,
} as const;

/**
 * Footer spacing used on desktop (px).
 */
export const desktopFooterSpacing = {
  height: 250,
  paddingY: 20,
  preFooterSpacer: 80,
} as const;

/**
 * Desktop typography scale (px).
 */
export const desktopTypographyScale = {
  heroTitle: 56,
  h2: 36,
  body: 16,
  small: 14,
  button: 14,
} as const;


