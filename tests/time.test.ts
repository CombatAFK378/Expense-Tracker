import { test } from "node:test";
import assert from "node:assert/strict";
import { dayBounds, istYMD, shiftYMD, monthStartYMD, nextMonthStartYMD } from "../lib/time";

test("18:29:59 UTC is still Nov 1 in IST (23:59:59 IST)", () => {
  assert.equal(istYMD(new Date("2026-11-01T18:29:59Z")), "2026-11-01");
});

test("18:30:00 UTC flips to Nov 2 in IST (00:00 IST)", () => {
  assert.equal(istYMD(new Date("2026-11-01T18:30:00Z")), "2026-11-02");
});

test("dayBounds are the correct IST instants", () => {
  const { start, end } = dayBounds("2026-11-01");
  assert.equal(start.toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(end.toISOString(), "2026-11-01T18:29:59.999Z");
});

test("shiftYMD crosses month and year edges", () => {
  assert.equal(shiftYMD("2026-10-31", 1), "2026-11-01");
  assert.equal(shiftYMD("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftYMD("2024-02-28", 1), "2024-02-29"); // leap year
});

test("monthStart / nextMonthStart work across Dec-Jan", () => {
  assert.equal(monthStartYMD("2026-11-15"), "2026-11-01");
  assert.equal(nextMonthStartYMD("2026-11-15"), "2026-12-01");
  assert.equal(nextMonthStartYMD("2026-12-15"), "2027-01-01");
});