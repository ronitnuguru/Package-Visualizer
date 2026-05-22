const { jestConfig } = require("@salesforce/sfdx-lwc-jest/config");

module.exports = {
  ...jestConfig,
  moduleNameMapper: {
    ...jestConfig.moduleNameMapper,
    "^lightning/emptyState$":
      "<rootDir>/force-app/test/jest-mocks/lightning/emptyState.js",
    "^lightning/modal$":
      "<rootDir>/force-app/test/jest-mocks/lightning/modal.js",
    "^lightning/modalHeader$":
      "<rootDir>/force-app/test/jest-mocks/lightning/modalHeader.js",
    "^lightning/refresh$":
      "<rootDir>/force-app/test/jest-mocks/lightning/refresh.js",
    "^@salesforce/community/basePath$":
      "<rootDir>/force-app/test/jest-mocks/@salesforce/community/basePath.js"
  },
  modulePathIgnorePatterns: ["<rootDir>/.localdevserver"]
};
