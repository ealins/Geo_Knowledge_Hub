import test from "node:test";
import assert from "node:assert/strict";
import { degreeOf, languageOf, durationOf, ectsOf, tuitionOf, extractFacts, textOf } from "./facts.mjs";

test("degree from title and url", () => {
  assert.equal(degreeOf("MSc Geomatics Engineering"), "MSc");
  assert.equal(degreeOf("Online Graduate Certificate in GIS | UMaine"), "Certificate");
  assert.equal(degreeOf("Online B.S. in Surveying Engineering Technology", ""), "BSc");
  assert.equal(degreeOf("Geography Master's programme"), "Master");
  assert.equal(degreeOf("Geodesy", "https://x.edu/graduate/phd-geodesy"), "PhD");
  assert.equal(degreeOf("Geospatial Technologies"), "");
});
test("language of instruction", () => {
  assert.equal(languageOf("Language of instruction: English"), "English");
  assert.equal(languageOf("The programme is taught in English and German."), "English and German");
  assert.equal(languageOf("Unterrichtssprache: Deutsch"), "German");
  assert.equal(languageOf("English language requirements: IELTS 6.5"), "");
  assert.equal(languageOf("Select language: English Deutsch"), "");
});
test("duration", () => {
  assert.equal(durationOf("Duration: 4 semesters"), "4 semesters");
  assert.equal(durationOf("Regelstudienzeit: 6 Semester"), "6 semesters");
  assert.equal(durationOf("This is a two-year master programme in geomatics."), "2 years");
  assert.equal(durationOf("The course takes 18 months to complete"), "18 months");
  assert.equal(durationOf("Opening hours 9 months a year"), "");
});
test("ects", () => {
  assert.equal(ectsOf("120 ECTS credits in total, modules of 6 ECTS"), 120);
  assert.equal(ectsOf("30 credit hours"), 0);
});
test("tuition", () => {
  assert.equal(tuitionOf("There are no tuition fees for this programme."), "No tuition fees");
  assert.equal(tuitionOf("Tuition fees are EUR 1,500 per semester."), "EUR 1,500 per semester");
  assert.equal(tuitionOf("Tuition: $1,048 per credit hour"), "$1,048 per credit hour");
  assert.equal(tuitionOf("Application fee: $75"), "");
});
test("extractFacts drops empty facts", () => {
  const f = extractFacts("<html><body><p>Duration: 2 years. Taught in English. Tuition fees: EUR 3,000 per year. 120 ECTS</p></body></html>", { title: "MSc Remote Sensing" });
  assert.deepEqual(f, { degree: "MSc", language: "English", duration: "2 years", ects: 120, tuition: "EUR 3,000 per year" });
  assert.equal(textOf("<script>x</script><b>a</b>&nbsp;b"), "a b");
});
