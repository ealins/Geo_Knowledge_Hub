import test from "node:test";
import assert from "node:assert/strict";
import { ccOf, orgOf, cityOf } from "./places-lib.mjs";

test("country code from the last part, UK becomes GB", () => {
  assert.equal(ccOf("Frankfurt am Main, Hessen, DE", "adzuna"), "DE");
  assert.equal(ccOf("London, UK", "adzuna"), "GB");
  assert.equal(ccOf("Denver, CO", "company-boards"), "US");
  assert.equal(ccOf("Mountain View, CA", "company-boards"), "US");
  assert.equal(ccOf("Manchester, Hybrid", "jobsac-gis"), null);
});
test("institution from discovered programmes and university job adverts", () => {
  assert.deepEqual(orgOf({ kind: "course", source: "discovered-programmes", location: "University of Twente, NL" }), { name: "University of Twente", cc: "NL" });
  assert.deepEqual(orgOf({ kind: "job", source: "jobsac-gis", summary: "Birmingham City University. GIS geospatial", location: "Birmingham" }), { name: "Birmingham City University", cc: null });
  assert.equal(orgOf({ kind: "job", source: "adzuna", summary: "Trigis. Wer wir sind", location: "Deutschland, DE" }), null);
});
test("whole campus name kept, district names skipped", () => {
  assert.deepEqual(orgOf({ kind: "course", source: "discovered-programmes", location: "University of California, Los Angeles, US" }), { name: "University of California, Los Angeles", cc: "US" });
  assert.deepEqual(cityOf({ kind: "job", source: "adzuna", location: "Altstadt, Weimar, DE" }), { name: "Weimar", cc: "DE" });
  assert.equal(cityOf({ kind: "job", source: "collected", location: "ESA careers" }), null);
});
test("city skips country-only and remote locations", () => {
  assert.deepEqual(cityOf({ kind: "job", source: "adzuna", location: "Nijeveen, Meppel, NL" }), { name: "Nijeveen", cc: "NL" });
  assert.equal(cityOf({ kind: "job", location: "Deutschland, DE" }), null);
  assert.equal(cityOf({ kind: "paper", location: "Paris" }), null);
});
