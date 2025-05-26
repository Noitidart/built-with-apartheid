import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript', 'prettier']
  }),
  {
    rules: {
      // The only way to type JSON in Prisma is with namespaces, so disable this.
      '@typescript-eslint/no-namespace': 'off'
    }
  }
];

export default eslintConfig;
