import js from '@eslint/js';
import globals from 'globals';

const recommendedConfig = js.configs.recommended;
const baseLanguageOptions = recommendedConfig.languageOptions ?? {};
const baseRules = recommendedConfig.rules ?? {};
const sharedBrowserGlobals = {
  ...globals.browser,
  firebase: 'readonly',
  google: 'readonly',
  showToast: 'readonly',
  showSuccess: 'readonly',
  showError: 'readonly',
  showInfo: 'readonly',
  showWarning: 'readonly',
  dismissAllToasts: 'readonly',
  Toast: 'readonly',
  showLoadingSpinner: 'readonly',
  hideLoadingSpinner: 'readonly',
  showGlobalLoader: 'readonly',
  hideGlobalLoader: 'readonly',
  showLocalLoader: 'readonly',
  showSkeletonLoading: 'readonly',
  simulateNetworkDelay: 'readonly',
  showButtonLoading: 'readonly',
  hideButtonLoading: 'readonly',
  showEmptyState: 'readonly',
  showErrorState: 'readonly',
  withLoadingState: 'readonly',
  LoadingUtils: 'readonly',
  getCurrentUserRole: 'readonly',
  module: 'readonly',
  renderGoals: 'readonly',
  refreshGoalsData: 'readonly',
  renderScheduleEvents: 'readonly',
  renderCalendar: 'readonly',
};

export default [
  {
    name: 'shuttlestats/ignores',
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/assets/**',
      'public/css/**',
      'public/**/*.html',
    ],
  },
  {
    ...recommendedConfig,
    name: 'shuttlestats/browser-scripts',
    files: ['public/js/**/*.js', 'public/config/**/*.js'],
    languageOptions: {
      ...baseLanguageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: sharedBrowserGlobals,
    },
    rules: {
      ...baseRules,
      'no-console': 'off',
    },
  },
  {
    ...recommendedConfig,
    name: 'shuttlestats/node-scripts',
    files: ['*.js', '*.mjs'],
    languageOptions: {
      ...baseLanguageOptions,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: baseRules,
  },
];
