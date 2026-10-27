/**
 * UNCP — Karma del repo + Chromium headless sin sandbox (WSL), para ejecutar specs desde la consola.
 * Uso (ver bitácora, sección 9):
 *   CHROME_BIN=<chromium> npx ng test --source-map=true --watch=false --configuration test \
 *     --karma-config pruebas/karma-headless.js --include <spec> ...
 */
const base = require('../karma.conf.js');

module.exports = function (config) {
  base(config);
  config.set({
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: { ChromeHeadlessNoSandbox: { base: 'ChromeHeadless', flags: ['--no-sandbox'] } },
  });
};
