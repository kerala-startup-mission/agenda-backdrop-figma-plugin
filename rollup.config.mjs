import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"
import html from "@rollup/plugin-html"
import svelte from "rollup-plugin-svelte"
import terser from "@rollup/plugin-terser"

const production = !process.env.ROLLUP_WATCH

/**
 * @type {import('rollup').RollupOptions}
 */
const mainConfig = {
  input: `src/main.ts`,
  output: {
    format: `iife`,
    name: `ui`,
    file: `dist/bundle.js`,
  },
  plugins: [
    typescript(),
    svelte({
      // Component CSS is injected at runtime; the UI is a single inline HTML file anyway.
      emitCss: false,
      compilerOptions: {
        dev: !production,
      },
    }),
    resolve({
      browser: true,
      dedupe: (importee) => importee === `svelte` || importee.startsWith(`svelte/`),
    }),
    commonjs(),
    html({
      fileName: `ui.html`,
      template({ bundle }) {
        return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>AutoDrop</title>
  </head>
  <body>
    <script>${bundle[`bundle.js`].code}</script>
  </body>
</html>
        `
      },
    }),
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
  onwarn(warning, warn) {
    // Svelte's runtime has internal import cycles; they're harmless noise.
    if (warning.code === `CIRCULAR_DEPENDENCY` && warning.ids?.every((id) => id.includes(`node_modules/svelte/`))) return
    warn(warning)
  },
}

/**
 * @type {import('rollup').RollupOptions}
 */
const codeConfig = {
  input: `src/code.ts`,
  output: {
    file: `dist/code.js`,
    format: `cjs`,
    name: `code`,
  },
  plugins: [
    typescript(),
    commonjs(),
    resolve({
      browser: true,
    }),
    production && terser(),
  ],
}

const config = [mainConfig, codeConfig]

export default config