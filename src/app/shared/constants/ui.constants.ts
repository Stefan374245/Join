/**
 * Constants for UI dimensions and breakpoints
 */

export const BREAKPOINTS = {
  XS: 410,
  SM: 600,
  MD: 650,
  LG: 768,
  XL: 968,
  XXL: 1200
} as const;

export const DROPDOWN = {
  MAX_HEIGHT: '300px',
  DEFAULT_VISIBLE_ITEMS: 5
} as const;

export const DIMENSIONS = {
  AVATAR_SIZE: 40,
  ICON_SIZE: 24,
  CARD_MIN_WIDTH: 280,
  CARD_MAX_WIDTH: 1200,
  CONTENT_MAX_WIDTH: 1000
} as const;

/**
 * Media query helpers
 */
export const MEDIA_QUERIES = {
  XS: `(max-width: ${BREAKPOINTS.XS}px)`,
  SM: `(max-width: ${BREAKPOINTS.SM}px)`,
  MD: `(max-width: ${BREAKPOINTS.MD}px)`,
  LG: `(max-width: ${BREAKPOINTS.LG}px)`,
  XL: `(max-width: ${BREAKPOINTS.XL}px)`,
  XXL: `(max-width: ${BREAKPOINTS.XXL}px)`
} as const;
