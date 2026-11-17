import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { firstIssueText, magicLinkSchema, signInSchema, signUpSchema } from "./auth.ts";
import { reservationFormSchema } from "./reservation.ts";

describe("auth validation schemas", () => {
  it("validates signInSchema and rejects short passwords", () => {
    const ok = signInSchema.safeParse({
      email: "admin@playhub.ar",
      password: "Password123!",
    });
    assert.equal(ok.success, true);

    const bad = signInSchema.safeParse({
      email: "admin@playhub.ar",
      password: "123",
    });
    assert.equal(bad.success, false);
    if (!bad.success) {
      assert.match(firstIssueText(bad.error), /8 caracteres/);
    }
  });

  it("validates signUpSchema and magicLinkSchema", () => {
    assert.equal(
      signUpSchema.safeParse({
        firstName: "Exequiel",
        lastName: "",
        email: "exequiel@playhub.ar",
        password: "Password123!",
      }).success,
      true,
    );
    assert.equal(magicLinkSchema.safeParse({ email: "invalid-email" }).success, false);
  });
});

describe("reservationFormSchema", () => {
  it("accepts valid reservation intervals and rejects inverted end times", () => {
    const valid = reservationFormSchema.safeParse({
      court_id: "court-1",
      customer_id: null,
      starts_at: "2026-11-17T18:00:00Z",
      ends_at: "2026-11-17T19:00:00Z",
      kind: "booking",
      title: "Turno Pádel",
      notes: null,
    });
    assert.equal(valid.success, true);

    const invalid = reservationFormSchema.safeParse({
      court_id: "court-1",
      customer_id: null,
      starts_at: "2026-11-17T19:00:00Z",
      ends_at: "2026-11-17T18:00:00Z",
      kind: "booking",
      title: null,
      notes: null,
    });
    assert.equal(invalid.success, false);
  });
});
