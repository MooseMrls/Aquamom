import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import esbuild from 'esbuild';

// Project convention: components are authored as .js files (no .jsx
// extension) but still use JSX syntax inside them. Vite/esbuild only
// auto-detects JSX syntax by the .jsx/.tsx extension, so this small
// plugin explicitly runs esbuild's JSX transform on every .js file
// under src/ before Vite's own import analysis sees it. This is done
// as an explicit transform (rather than relying on esbuild/optimizeDeps
// config alone) so it behaves the same in dev and in production builds.
function jsxInJs() {
  return {
    name: 'jsx-in-js',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.includes('/src/') || !id.endsWith('.js')) return null;
      const result = await esbuild.transform(code, {
        loader: 'jsx',
        jsx: 'automatic',
        sourcefile: id,
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  plugins: [jsxInJs(), react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    port: 5173,
  },
});

