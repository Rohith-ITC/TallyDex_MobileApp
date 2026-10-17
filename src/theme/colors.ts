/**
 * TallyDex colour tokens, from TallyDEx_/nav/app.css and login/styles.css.
 * Screens and components use these names only, never hex literals.
 */
export const lightColors = {
  accent: '#E46C0C',
  accentHi: '#F07E22',
  accentLo: '#C95F0A',
  accentTint: 'rgba(228,108,12,0.09)',
  accentTint2: 'rgba(228,108,12,0.18)',
  accentRing: 'rgba(228,108,12,0.16)',
  fieldTint: 'rgba(253,238,226,0.38)',

  chrome: '#000000',
  chromeText: '#FFFFFF',
  chromeMuted: '#8E8E93',
  chromeActiveBg: 'rgba(255,255,255,0.08)',
  chromeLine: 'rgba(255,255,255,0.08)',
  chromeCard: 'rgba(255,255,255,0.04)',
  chromePressed: 'rgba(255,255,255,0.05)',
  chromeBorder: 'rgba(255,255,255,0.22)',
  navy: '#071523',

  canvas: '#EEF0F3',
  surface: '#FFFFFF',
  surface2: '#F7F8FA',
  surface3: '#EFF1F5',
  line: '#E2E5EA',
  lineSoft: '#EDEFF3',

  text: '#0C0F14',
  text2: '#4B525E',
  text3: '#7B8494',
  text4: '#A2AAB8',
  onAccent: '#FFFFFF',

  ok: '#0B8A5F',
  okBg: '#E6F6F0',
  okLine: '#BCE6D6',
  warn: '#A75B0C',
  warnBg: '#FDF2E4',
  warnLine: '#F2DCBF',
  danger: '#C93838',
  dangerBg: '#FDECEC',
  dangerLine: '#F6CFCF',
  info: '#3552C4',
  infoBg: '#ECEFFC',
  infoLine: '#D2D9F6',

  scrim: 'rgba(10,12,16,0.45)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof lightColors;
export type Palette = Record<ColorToken, string>;

/** Dark palette from app.css. Not switched on in draft 1. */
export const darkColors: Palette = {
  ...lightColors,
  canvas: '#0A0C10',
  surface: '#14171C',
  surface2: '#1A1E24',
  surface3: '#21262E',
  line: '#262C35',
  lineSoft: '#1E232A',
  text: '#EDEFF3',
  text2: '#AEB6C2',
  text3: '#838D9B',
  text4: '#67707E',
  fieldTint: 'rgba(228,108,12,0.06)',
  accentTint: 'rgba(228,108,12,0.14)',
  accentTint2: 'rgba(228,108,12,0.22)',
  ok: '#4ED0A2',
  okBg: 'rgba(11,138,95,0.16)',
  warn: '#E8A75B',
  warnBg: 'rgba(167,91,12,0.18)',
  danger: '#F08A8A',
  dangerBg: 'rgba(201,56,56,0.16)',
  info: '#93A6F5',
  infoBg: 'rgba(53,82,196,0.18)',
};

export const colors = lightColors;
