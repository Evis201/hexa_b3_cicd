for (const key of ['localStorage', 'sessionStorage']) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, key);
  if (descriptor && descriptor.configurable) {
    delete globalThis[key];
  }
}

module.exports = require('jest-environment-node').TestEnvironment;
