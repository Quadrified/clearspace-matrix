import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
export default ts.config(
  {
    ignores: [
      'dist/**',
      'client-dist/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...ts.configs.recommendedTypeChecked, a11y.flatConfigs.recommended],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      // Dialogs move focus to their first field on purpose, as native <dialog> guidance advises.
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    // Tests read JSON from storage and drive fake timers, where `any` and bare calls are fine.
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  {
    // The Focus timer is hidden for now. Remove this override when it is restored and its
    // interactive markup is made accessible (TODO).
    files: ['src/features/focus/FocusTimer.tsx'],
    rules: {
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'worker/**/*.mjs', 'tests/**/*.mjs', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
