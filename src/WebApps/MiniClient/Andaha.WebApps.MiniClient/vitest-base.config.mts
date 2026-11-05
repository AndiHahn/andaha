import { defineConfig } from 'vitest/config';

// Basis-Konfiguration für den Angular-Unit-Test-Builder (angular.json → test.options.runnerConfig).
// Die CLI überschreibt test.projects und test.include selbst.
export default defineConfig({
  test: {
    // zeitabhängige Specs scheitern unter Last mit dem Standard von 5 s (US-0008 design.md §8.3)
    testTimeout: 15000
  }
});
