import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['docs/dev.js'],
    },
    {
      rules: {
        'unicorn/prefer-dom-node-dataset': 'off',
      },
    },
  ],
});
