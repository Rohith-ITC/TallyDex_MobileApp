module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // `void promise` marks a deliberate fire-and-forget call.
    'no-void': 'off',
    'no-console': 'error',
  },
  overrides: [
    {
      // Screens and components take colours from src/theme only (rule R23).
      files: ['src/screens/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
            message: 'Use a colour token from src/theme instead of a hex literal.',
          },
          {
            selector: 'Literal[value=/^rgba?\\(/]',
            message: 'Use a colour token from src/theme instead of an rgb()/rgba() literal.',
          },
        ],
      },
    },
    {
      files: ['src/utils/log.ts'],
      rules: { 'no-console': 'off' },
    },
  ],
};
