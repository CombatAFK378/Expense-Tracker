-- Rebuild the composite index with DESC ordering to match every hot query
-- (dashboard recent list, month-range summary, timeline) — one index scan,
-- no sort step.
DROP INDEX IF EXISTS "Expense_userId_spentAt_idx";
CREATE INDEX "Expense_userId_spentAt_idx" ON "Expense"("userId", "spentAt" DESC);