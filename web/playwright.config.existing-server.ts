import { defineConfig, devices } from "@playwright/test";
import otherConfig from "./playwright.config.ts";

// This should match the xc task in ../README.md ### web-dev
const TEST_PORT = 3333;
/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  ...otherConfig,

  webServer: undefined,
  use: {
    ...otherConfig.use,
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: `http://localhost:${TEST_PORT}/pages/`,
  },
});
