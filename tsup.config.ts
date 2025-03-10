import { defineConfig } from "tsup";

export default defineConfig([
  // ESM Build
  {
    entry: ["src/index.ts"],
    outDir: "dist",
    format: ["esm", "cjs"],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    minify: true,
  },
]);
