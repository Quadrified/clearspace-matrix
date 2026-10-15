import js from '@eslint/js';
import ts from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import react from 'eslint-plugin-react';
import a11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
export default ts.config(
  { ignores: ['dist/**', 'client-dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': hooks, react, 'jsx-a11y': a11y },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...a11y.flatConfigs.recommended.rules,
      ...hooks.configs.recommended.rules,
      'jsx-a11y/label-has-associated-control': [
        'error',
        { controlComponents: ['Select'], depth: 3 },
      ],
      // Initial focus is intentional in native modal dialogs, never on page load.
      'jsx-a11y/no-autofocus': 'off',
      'react/prop-types': 'off', // TypeScript validates component props.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'worker/**/*.mjs', 'tests/**/*.mjs', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
