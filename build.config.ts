import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig([
  {
    entries: ['src/index'],
    clean: true,
    declaration: true,
    rollup: {
      emitCJS: true,
    },
    externals: ['quill'],
  },
  {
    entries: ['src/index'],
    outDir: 'docs/dev',
    rollup: {
      emitCJS: false,
      output: {
        format: 'umd',
        name: 'TableUp',
        globals: {
          quill: 'Quill',
        },
        exports: 'named',
      },
      esbuild: {
        minify: false,
      },
    },
    declaration: false,
    externals: ['quill'],
  },
]);
