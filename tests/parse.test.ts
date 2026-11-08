import { test } from "node:test";
import assert from "node:assert/strict";
import { parseEntry } from "../lib/parse";

test("full entry: name + amount at the end", () => {
  const p = parseEntry("swiggy lunch 120");
  assert.equal(p.name, "swiggy lunch");
  assert.equal(p.paise, 12000);
  assert.equal(p.category, "Food");
});

test("quantity words stay in the name; last number wins", () => {
  const p = parseEntry("2 coffees 40");
  assert.equal(p.name, "2 coffees");
  assert.equal(p.paise, 4000);
});

test("decimals handled as paise", () => {
  const p = parseEntry("auto 99.50");
  assert.equal(p.paise, 9950);
  assert.equal(p.category, "Other");
});

test("no amount = hasAmount false", () => {
  const p = parseEntry("swiggy lunch");
  assert.equal(p.hasAmount, false);
  assert.equal(p.name, "swiggy lunch");
});

test("empty input is safe", () => {
  const p = parseEntry("");
  assert.equal(p.hasAmount, false);
});

test("known merchants map to their category", () => {
  assert.equal(parseEntry("zepto milk 65").category, "Groceries");
  assert.equal(parseEntry("uber home 250").category, "Travel");
  assert.equal(parseEntry("netflix 649").category, "Subscriptions");
});

test("amount-only input has empty name", () => {
  const p = parseEntry("120");
  assert.equal(p.hasAmount, true);
  assert.equal(p.name, "");
});