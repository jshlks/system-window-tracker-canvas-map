import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { builtinModules } from 'module';

const isProduction = process.argv.includes('--production');

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  minify: isProduction,
  treeShaking: true,
  sourcemap: !isProduction,
  target: 'ES2020',
  platform: 'node',
  format: 'cjs',
  outfile: 'main.js',
  external: [
    'obsidian',
    'electron',
    ...builtinModules
  ],
  plugins: [
    copy({
      assets: {
        from: ['./manifest.json'],
        to: ['.'],
      },
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
  },
};

esbuild.build(config).catch(() => process.exit(1));

export default config;
