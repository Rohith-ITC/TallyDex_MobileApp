import { colors } from './colors';
import { fonts, type } from './typography';
import { motion, radii, sizes, space } from './spacing';

export const theme = { colors, fonts, type, space, radii, sizes, motion } as const;
export type Theme = typeof theme;

export { colors, fonts, type, space, radii, sizes, motion };
export { darkColors, lightColors } from './colors';
export type { ColorToken, Palette } from './colors';
export type { TypeToken } from './typography';
