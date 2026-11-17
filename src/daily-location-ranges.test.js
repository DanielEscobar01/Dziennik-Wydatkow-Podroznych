import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyLocationRanges } from './daily-location-ranges.js';

const row = (date, country, context = '') => ({ location_date: date, country, context });
const periods = (ranges) => ranges.map(({ country, startDate, endDate }) => [country, startDate, endDate]);

test('shows departure, day visit and return without duplicating country-days', () => {
  const rows = [
    ...[9, 10, 11, 12, 13].map((day) => row(`2025-05-${String(day).padStart(2, '0')}`, 'Estonia')),
    row('2025-05-09', 'Polska'),
    row('2025-05-11', 'Finlandia', 'Wizyta i powrot'),
    row('2025-05-13', 'Polska'),
    row('2025-05-14', 'Polska'),
  ];
  const ranges = buildDailyLocationRanges(rows);
  assert.deepEqual(periods(ranges), [
    ['Polska', '2025-05-13', '2025-05-14'],
    ['Estonia', '2025-05-11', '2025-05-13'],
    ['Finlandia', '2025-05-11', '2025-05-11'],
    ['Estonia', '2025-05-09', '2025-05-10'],
    ['Polska', '2025-05-09', '2025-05-09'],
  ]);
  const expanded = ranges.flatMap(({ country, startDate, endDate }) => {
    const dates = [];
    for (let date = new Date(`${startDate}T00:00:00Z`); date.toISOString().slice(0, 10) <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
      dates.push(`${country}:${date.toISOString().slice(0, 10)}`);
    }
    return dates;
  });
  assert.deepEqual(expanded.sort(), rows.map((entry) => `${entry.country}:${entry.location_date}`).sort());
});

test('keeps continuous stays, gaps, duplicate contexts and year boundaries', () => {
  const ranges = buildDailyLocationRanges([
    row('2025-12-31', 'Estonia', 'Estonia: Przylot'),
    row('2025-12-31', 'Estonia', 'Pobyt'),
    row('2026-01-01', 'Estonia', 'Pobyt'),
    row('2026-01-03', 'Estonia', 'Wylot'),
  ]);
  assert.deepEqual(periods(ranges), [
    ['Estonia', '2026-01-03', '2026-01-03'],
    ['Estonia', '2025-12-31', '2026-01-01'],
  ]);
  assert.deepEqual([...ranges[1].contexts], ['Przylot', 'Pobyt']);
});

test('splits repeated day trips and keeps contexts within their segment', () => {
  const ranges = buildDailyLocationRanges([
    ...[9, 10, 11, 12, 13].map((day) => row(`2025-05-${String(day).padStart(2, '0')}`, 'Estonia', day === 13 ? 'Wylot' : 'Pobyt')),
    row('2025-05-10', 'Finlandia'),
    row('2025-05-12', 'Finlandia'),
  ]);
  assert.deepEqual(periods(ranges), [
    ['Estonia', '2025-05-12', '2025-05-13'],
    ['Finlandia', '2025-05-12', '2025-05-12'],
    ['Estonia', '2025-05-10', '2025-05-11'],
    ['Finlandia', '2025-05-10', '2025-05-10'],
    ['Estonia', '2025-05-09', '2025-05-09'],
  ]);
  assert.deepEqual([...ranges.at(-1).contexts], ['Pobyt']);
});
