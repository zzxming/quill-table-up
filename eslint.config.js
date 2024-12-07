import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['docs/dev.js', 'docs/dev.js.map', 'docs/table-creator.css', 'docs/index.css'],
    },
    {
      rules: {
        'unicorn/prefer-dom-node-dataset': 'off',
        'unicorn/consistent-function-scoping': 'off',
        'no-cond-assign': 'off',
        'new-cap': 'off',
      },
    },
  ],
});
