import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import autoprefixer from 'autoprefixer';
import { dest, parallel, series, src, task, watch } from 'gulp';
import cleanCSS from 'gulp-clean-css';
import less from 'gulp-less';
import postcss from 'gulp-postcss';
import pxtorem from 'postcss-pxtorem';
import { rollup } from 'rollup';
import { dts } from 'rollup-plugin-dts';
import svg from 'rollup-plugin-svg-import';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distBundle = resolve(__dirname, './dist');
const demoBundle = resolve(__dirname, './docs');

const buildDts = async () => {
  const bundle = await rollup(
    {
      input: './src/index.ts',
      external: [/^quill/],
      treeshake: true,
      plugins: [dts({ tsconfig: './tsconfig.json' })],
    },
  );
  return bundle.write({
    file: resolve(distBundle, 'index.d.ts'),
    sourcemap: false,
    format: 'es',
  });
};
const buildTs = async (isDev: boolean = false) => {
  const plugins = [
    typescript({ tsconfig: './tsconfig.json', exclude: ['src/__tests__'] }),
    nodeResolve(),
    svg({ stringify: true }),
  ];
  !isDev && plugins.push(terser());
  const bundle = await rollup(
    {
      input: './src/index.ts',
      external: [/^quill/],
      treeshake: true,
      plugins,
    },
  );
  if (!isDev) {
    await bundle.write({
      file: resolve(distBundle, 'index.umd.js'),
      sourcemap: true,
      format: 'umd',
      name: 'TableUp',
      globals: {
        quill: 'Quill',
      },
      exports: 'named',
    });
  }

  await bundle.write({
    file: resolve(demoBundle, 'index.umd.js'),
    sourcemap: true,
    format: 'umd',
    name: 'TableUp',
    globals: {
      quill: 'Quill',
    },
    exports: 'named',
  });
  return bundle.write({
    file: resolve(distBundle, 'index.js'),
    sourcemap: true,
    format: 'es',
  });
};
const buildTheme = async (isDev: boolean = false) => {
  const bunlde = await src(['./src/style/index.less', './src/style/table-creator.less'])
    .pipe(less())
    .pipe(
      postcss([
        autoprefixer(),
        pxtorem({
          rootValue: 16,
          propList: ['*'],
          selectorBlackList: ['.ql-'],
        }),
      ]),
    );
  if (!isDev) {
    await bunlde
      .pipe(
        cleanCSS({}, (details) => {
          console.log(
            `${details.name}: ${details.stats.originalSize / 1000} KB -> ${
              details.stats.minifiedSize / 1000
            } KB`,
          );
        }),
      )
      .pipe(dest(distBundle));
  }
  return bunlde.pipe(dest(demoBundle));
};

const dev = () => {
  watch(['./src/**/*.ts', '!./src/**/__tests__/**/*'], parallel(buildTs.bind(undefined, true), buildDts));
  watch('./src/**/*.less', buildTheme.bind(undefined, true));
};
task('dev', series(dev));

task('default', parallel(
  buildTs.bind(undefined, false),
  buildDts,
  buildTheme.bind(undefined, false),

  buildTs.bind(undefined, true),
  buildTheme.bind(undefined, true),
));
