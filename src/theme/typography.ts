import type { TextStyle } from 'react-native';

/**
 * Font files live in android/app/src/main/assets/fonts. On Android the family
 * name is the file name, one family per weight, so styles set fontFamily and
 * never fontWeight (that would make Android synthesise a fake bold).
 */
export const fonts = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  displaySemibold: 'WixMadeforDisplay-SemiBold',
  displayBold: 'WixMadeforDisplay-Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  brand: { fontFamily: fonts.displaySemibold, fontSize: 32, lineHeight: 38, letterSpacing: -1.2 },
  statValue: { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  title: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  overline: { fontFamily: fonts.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  button: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
  buttonSm: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  number: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypeToken = keyof typeof type;
