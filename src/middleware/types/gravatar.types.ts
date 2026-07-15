export type GravatarRating = 'g' | 'pg' | 'r' | 'x';

export type GravatarDefaultImage =
  | '404'
  | 'mm'
  | 'identicon'
  | 'monsterid'
  | 'wavatar'
  | 'retro'
  | 'robohash'
  | 'blank';

export interface GravatarOptions {
  size?: string;
  rating?: GravatarRating;
  default?: GravatarDefaultImage;
}
