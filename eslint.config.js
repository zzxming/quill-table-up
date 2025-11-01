import { factory } from '@zzxming/eslint-config';

export default factory({
  typescript: { tsconfigPath: './tsconfig.json' },
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
        'ts/no-this-alias': 'off',
        'ts/no-unsafe-function-type': 'off',
      },
    },
    {
      files: ['**/*.md'],
      rules: {
        'markdown-preferences/heading-casing': [
          'error',
          {
            style: 'Title Case',
            preserveWords: [
              'quill-table-up',
              'Tableup',
              'TableSelection',
              'TableResizeLine',
              'TableResizeBox',
              'TableMenuContextmenu',
              'TableMenuSelect',
              'TableResizeScale',
              'TableAlign',
              'TableVirtualScrollbar',
            ],
          },
        ],
      },
    },
  ],
});
