import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

const dev = process.env.ROLLUP_WATCH;

export default {
  input: "src/sigenergy-home-card.ts",
  output: {
    file: "dist/sigenergy-home-card.js",
    format: "es",
    inlineDynamicImports: true,
    sourcemap: dev ? true : false,
  },
  plugins: [
    resolve(),
    json(),
    typescript({ declaration: false }),
    !dev && terser({ format: { comments: false } }),
  ],
};
