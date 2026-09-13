const path = require("path");

module.exports = {
  rootDir: __dirname,
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.js", "<rootDir>/src/**/*.test.jsx"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleFileExtensions: ["js", "jsx", "json"],
  transform: {
    "^.+\\.(js|jsx)$": [
      "babel-jest",
      {
        configFile: path.resolve(__dirname, "babel.config.test.js"),
        babelrc: false,
      },
    ],
  },
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "<rootDir>/test/styleMock.js",
    "\\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$": "<rootDir>/test/fileMock.js",
  },
  clearMocks: true,
  restoreMocks: true,
};
