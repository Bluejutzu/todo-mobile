import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['./src/**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react,
            'react-native': reactNative,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...reactNative.configs.all.rules,
            'react/react-in-jsx-scope': 'off',
            'react-native/no-color-literals': 'off',
            'react-native/sort-styles': 'off',
            'react-native/no-raw-text': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        ignores: ['node_modules/', '.expo/', 'dist/', 'web-build/'],
    }
);
