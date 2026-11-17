import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeStayExpenses } from './stay-expenses.js';

const expense = (date, category, plnAmount) => ({ date, category, plnAmount });

test('excludes flights and transport from both average and most expensive day', () => {
  const result = summarizeStayExpenses([
    expense('2026-11-19', 'Loty', 6005.14),
    expense('2026-11-20', 'Hotel', '400'),
    expense('2026-11-20', 'Jedzenie', 100),
    expense('2026-11-20', 'Transport', 1000),
    expense('2026-11-21', 'Hotel', 400),
    expense('2026-11-21', 'Atrakcje', 200),
    expense('2026-11-21', 'Zakupy', 50),
    expense('2026-11-21', 'Inne', 50),
    expense('2026-11-22', 'Transport', 2000),
  ], ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23']);
  assert.equal(result.averagePerDay, 600);
  assert.deepEqual(result.highestDay, { date: '2026-11-21', total: 700 });
});

test('returns no highest day and zero average for empty or transport-only expenses', () => {
  for (const expenses of [[], [expense('2026-11-19', 'Loty', 6005.14), expense('2026-11-19', 'Transport', 200)]]) {
    assert.deepEqual(summarizeStayExpenses(expenses, ['2026-11-19']), { averagePerDay: 0, highestDay: null });
  }
});

test('uses only dates belonging to the selected itinerary', () => {
  const result = summarizeStayExpenses([
    expense('2026-11-18', 'Hotel', 5000),
    expense('2026-11-20', 'Jedzenie', 60),
  ], ['2026-11-20']);
  assert.equal(result.averagePerDay, 60);
  assert.deepEqual(result.highestDay, { date: '2026-11-20', total: 60 });
});
