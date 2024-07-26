import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['docs/dev.js', 'docs/dev.js.map', 'docs/table-creator.css'],
    },
    {
      rules: {
        'unicorn/prefer-dom-node-dataset': 'off',
      },
    },
  ],
});
