/**
 * MOBILE CONTRACT (FINAL)
 * Mobile is defined as @media (max-width: 1023px).
 * This module is the single source of truth for mobile layout tokens.
 *
 * IMPORTANT:
 * - Mobile tokens are independent from desktop.
 * - Do NOT import desktop tokens here.
 */

export const mobileBreakpointMax = 1023 as const;

/**
 * Mobile page horizontal padding (px).
 * Ensures content never touches the screen edge.
 */
export const mobilePagePaddingX = 16 as const;

/**
 * Mobile spacing between major sections (px).
 */
export const mobileSectionSpacing = {
  sectionGap: 24,
  sectionPaddingY: 32,
} as const;

/**
 * Stack gaps used on mobile (px).
 */
export const mobileStackGaps = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * Card padding scale on mobile (px).
 */
export const mobileCardPadding = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

/**
 * Button heights used on mobile (px).
 * 44px is the standard comfortable tap target.
 */
export const mobileButtonHeights = {
  primary: 44,
  secondary: 44,
  compact: 40,
} as const;

/**
 * Hero heights used on mobile (px).
 * Keep strong, but allow content below to appear quickly.
 */
export const mobileHeroHeights = {
  home: 360,
  shop: 200,
  explore: 280,
} as const;

/**
 * Footer spacing used on mobile (px).
 */
export const mobileFooterSpacing = {
  paddingY: 32,
  preFooterSpacer: 32,
} as const;

/**
 * Mobile typography scale (px).
 */
export const mobileTypographyScale = {
  heroTitle: 34,
  h2: 24,
  body: 15,
  small: 13,
  button: 14,
} as const;


