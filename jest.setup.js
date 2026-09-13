require("@testing-library/jest-dom");

// The `test` script pins TZ=UTC so nothing depends on the machine's local zone.
// Timezone-sensitive suites override process.env.TZ per case (see test/tz.js).
if (!process.env.TZ) {
  process.env.TZ = "UTC";
}
