import { defineConfig, type UserConfig } from "tsdown";

const shared: UserConfig = {
  entry: ["./src/index.mts"],

  outDir: "build",

  minify: true,

  // Requires @arethetypeswrong/core
  attw: {
    profile: "node16",
  },

  // Generate TypeScript declaration files (`.d.ts`)
  dts: true,

  failOnWarn: true,

  // TODO: Not sure about this https://tsdown.dev/reference/api/Interface.UserConfig#fixedextension
  //fixedExtension: true,

  publint: true,
};

export default defineConfig([
  {
    ...shared,
    platform: "node",
  },
  {
    ...shared,
    platform: "browser",
    format: "cjs",
  },
]);
