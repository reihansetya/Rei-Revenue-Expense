// Self-check for the bill schedule math: npx tsx scripts/check-bills.ts
import assert from "node:assert/strict";
import { daysUntil, nextDueAfter, unpaidUntil } from "../src/lib/bills";
import type { Bill } from "../src/types";

const monthly31 = { start_date: "2026-01-31", interval_unit: "month", interval_count: 1 } as const;
// Anchored to the 31st: no drift to the 28th after February
assert.equal(nextDueAfter(monthly31, "2026-01-31"), "2026-02-28");
assert.equal(nextDueAfter(monthly31, "2026-02-28"), "2026-03-31");
assert.equal(nextDueAfter(monthly31, "2026-03-31"), "2026-04-30");

const weekly = { start_date: "2026-10-05", interval_unit: "week", interval_count: 2 } as const;
assert.equal(nextDueAfter(weekly, "2026-10-05"), "2026-10-19");
assert.equal(nextDueAfter(weekly, "2026-10-19"), "2026-11-02");

const leapYearly = { start_date: "2028-02-29", interval_unit: "year", interval_count: 1 } as const;
assert.equal(nextDueAfter(leapYearly, "2028-02-29"), "2029-02-28");
assert.equal(nextDueAfter(leapYearly, "2029-02-28"), "2030-02-28");

// Already settled later periods are skipped (after undoing an older payment)
const rent = { start_date: "2026-08-01", interval_unit: "month", interval_count: 1 } as const;
assert.equal(nextDueAfter(rent, "2026-09-01", new Set(["2026-10-01"])), "2026-11-01");

assert.equal(daysUntil("2026-10-06", "2026-10-03"), 3);
assert.equal(daysUntil("2026-10-01", "2026-10-03"), -2);

// Weekly bill due on 5 and 19 Oct counts twice in October
const weeklyBill = { ...weekly, amount: 100_000, next_due_date: "2026-10-05" } as Bill;
assert.equal(unpaidUntil(weeklyBill, "2026-10-31"), 200_000);

console.log("bills schedule: all checks passed");
