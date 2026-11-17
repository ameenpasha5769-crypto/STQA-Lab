const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: '7b46y9',
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/api/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    video: false,
    screenshotOnRunFailure: true,
    retries: {
      runMode: 0,
      openMode: 0
    },
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'results/mochawesome',
      overwrite: false,
      html: false,
      json: true
    },
    setupNodeEvents(on, config) {
      // Node event listeners
    }
  }
});
