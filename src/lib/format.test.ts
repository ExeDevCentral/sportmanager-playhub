import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  greeting,
} from "./format.ts";

describe("format utilities", () => {
  it("formats currency and handles non-finite numbers", () => {
    assert.match(formatCurrency(15000), /15\.000/);
    assert.match(formatCurrency(Number.NaN), /0/);
  });

  it("formats numbers and percentages safely", () => {
    assert.equal(formatNumber(1234), "1.234");
    assert.equal(formatNumber(Number.POSITIVE_INFINITY), "0");
    assert.equal(formatPercent(74.6), "75%");
    assert.equal(formatPercent(Number.NaN), "0%");
  });

  it("formats valid dates and returns em-dash for invalid dates", () => {
    assert.equal(formatDate(new Date("2026-11-17T12:00:00Z")), "17/11/2026");
    assert.equal(formatDate("not-a-date"), "—");
  });

  it("returns localized greeting based on hour of day", () => {
    assert.equal(greeting(new Date(2026, 0, 1, 9, 0)), "Buenos días");
    assert.equal(greeting(new Date(2026, 0, 1, 15, 0)), "Buenas tardes");
    assert.equal(greeting(new Date(2026, 0, 1, 21, 0)), "Buenas noches");
  });
});
