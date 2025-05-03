import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { babel } from '@rollup/plugin-babel';
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

async function buildDts() {
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
}

const plugins = [
  typescript({ tsconfig: './tsconfig.json', exclude: ['src/__tests__/**/*'] }),
  nodeResolve({ extensions: ['.js', '.ts'] }),
  svg({ stringify: true }),
];
async function buildEsm(_isDev: boolean = false) {
  const bundle = await rollup(
    {
      input: './src/index.ts',
      external: [/^quill/],
      treeshake: true,
      plugins,
    },
  );
  return bundle.write({
    file: resolve(distBundle, 'index.js'),
    sourcemap: true,
    format: 'es',
  });
}
async function buildUmd(isDev: boolean = false) {
  const bundle = await rollup(
    {
      input: './src/index.ts',
      external: [/^quill/],
      treeshake: true,
      plugins: [
        ...plugins,
        babel({
          babelHelpers: 'bundled',
          presets: [
            [
              '@babel/preset-env',
              {
                targets: {
                  browsers: ['> 0.25%', 'last 2 versions'],
                },
                modules: false,
              },
            ],
          ],
          exclude: 'node_modules/**',
          extensions: ['.js', '.ts'],
        }),
      ],
    },
  );
  const umdOutput = [resolve(demoBundle, 'index.umd.js')];
  if (!isDev) {
    umdOutput.push(resolve(distBundle, 'index.umd.js'));
  }

  return Promise.all(umdOutput.map(file => bundle.write({
    file,
    sourcemap: true,
    format: 'umd',
    name: 'TableUp',
    globals: {
      quill: 'Quill',
    },
    exports: 'named',
    strict: true,
  })));
}
async function buildTs(isDev: boolean = false) {
  !isDev && plugins.push(terser());

  return Promise.all([
    buildEsm(isDev),
    buildUmd(isDev),
  ]);
}
async function buildTheme(isDev: boolean = false) {
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
}

function dev() {
  watch(['./src/**/*.ts', '!./src/**/__tests__/**/*'], parallel(buildTs.bind(undefined, true), buildDts));
  watch('./src/**/*.less', buildTheme.bind(undefined, true));
  spawn('node', ['./server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}
task('dev', series(dev));

task('default', parallel(
  buildTs.bind(undefined, false),
  buildDts,
  buildTheme.bind(undefined, false),

  buildTs.bind(undefined, true),
  buildTheme.bind(undefined, true),
));
