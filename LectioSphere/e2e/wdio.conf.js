exports.config = {
  runner: 'local',
  specs: [
    './test/specs/loginAndHomePage.e2e.js',
    './test/specs/profilePage.e2e.js',
    './test/specs/followPage.e2e.js',
    './test/specs/bookActions.e2e.js',
  ],
  maxInstances: 1,
  hostname: '127.0.0.1',
  port: 4723,
  path: '/',
  capabilities: [{
    'platformName': 'Android',
    'appium:deviceName': 'RZCTB0HSM7B',
    'appium:automationName': 'UiAutomator2',
    'appium:appPackage': 'host.exp.exponent',
    'appium:appActivity': 'host.exp.exponent.LauncherActivity',
    'appium:noReset': true,
    'appium:newCommandTimeout': 3600
  }],
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },
  reporters: [
    ['allure', {
      outputDir: 'allure-results',
      disableWebdriverStepsReporting: true,
      disableWebdriverScreenshotsReporting: false,
    }]
  ],
  services: [],
  afterTest: async function(test, context, { passed }) {
    if (!passed) {
      const name = `./test/screenshots/${test.title.replace(/\s+/g,'_')}.png`;
      try {
        await browser.saveScreenshot(name);
      } catch (e) {
        console.warn(e.message);
      }
    }
  }
};