import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCSVContent, escapeCsv } from "./csv.ts";

describe("csv helpers", () => {
  it("escapes nullish values, quotes, commas, semicolons, and newlines", () => {
    assert.equal(escapeCsv(null), "");
    assert.equal(escapeCsv(undefined), "");
    assert.equal(escapeCsv(42), "42");
    assert.equal(escapeCsv('hola, "mundo"'), '"hola, ""mundo"""');
    assert.equal(escapeCsv("a;b"), '"a;b"');
    assert.equal(escapeCsv("linea1\r\nlinea2"), '"linea1\r\nlinea2"');
  });

  it("builds CSV content with headers and rows", () => {
    const csv = buildCSVContent(
      ["Cancha", "Precio", "Estado"],
      [
        ["Pádel 1", 18000, "Confirmada"],
        ["Fútbol 5", 32000, "Pendiente, seña"],
      ],
    );
    assert.equal(
      csv,
      'Cancha,Precio,Estado\nPádel 1,18000,Confirmada\nFútbol 5,32000,"Pendiente, seña"',
    );
  });
});
