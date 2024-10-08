import { factory } from '@zzxming/eslint-config';

export default factory({
  overrides: [
    {
      ignores: ['docs/dev.js', 'docs/dev.js.map', 'docs/table-creator.css', 'docs/index.css'],
    },
    {
      rules: {
        'unicorn/prefer-dom-node-dataset': 'off',
        'no-cond-assign': 'off',
        'ts/no-unused-expressions': 'off',
        'ts/no-this-alias': 'off',
        'unicorn/no-this-assignment': 'off',
      },
    },
  ],
});
