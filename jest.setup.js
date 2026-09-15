// jsdom does not provide TextEncoder/TextDecoder, but newer versions of
// react-router-dom reference them at import time. Polyfill from Node's `util`
// before any jsdom-dependent modules load.
const { TextEncoder, TextDecoder } = require("util");
if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

require("@testing-library/jest-dom");

// The `test` script pins TZ=UTC so nothing depends on the machine's local zone.
// Timezone-sensitive suites override process.env.TZ per case (see test/tz.js).
if (!process.env.TZ) {
  process.env.TZ = "UTC";
}
