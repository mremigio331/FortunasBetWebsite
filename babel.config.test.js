/**
 * Babel config used only by Jest (via `babel-jest` in jest.config.js).
 *
 * It mirrors the presets the webpack build already applies through babel-loader
 * (`@babel/preset-env` + `@babel/preset-react`), with two test-only tweaks:
 *   - preset-env targets the running Node version, so no unnecessary downleveling
 *   - JSX uses the automatic runtime, so test files don't need a React import
 *
 * Kept in a separate file (rather than a root babel.config.js) so the webpack
 * build keeps using its own inline babel-loader options unchanged.
 */
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
