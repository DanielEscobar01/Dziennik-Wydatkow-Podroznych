function shiftDate(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function buildDailyLocationRanges(rows) {
  const countryDates = new Map();
  rows.forEach((row) => {
    const date = String(row.location_date || '').slice(0, 10);
    const country = String(row.country || '').trim();
    if (!date || !country) return;
    const key = `${country}\u0000${date}`;
    const entry = countryDates.get(key) || { country, date, contexts: new Set() };
    const context = String(row.context || '').trim();
    const details = context.startsWith(`${country}:`) ? context.slice(country.length + 1).trim() : context;
    details.split(',').map((detail) => detail.trim()).filter(Boolean).forEach((detail) => entry.contexts.add(detail));
    countryDates.set(key, entry);
  });
  const ranges = [];
  for (const entry of [...countryDates.values()].sort((a, b) => a.country.localeCompare(b.country) || a.date.localeCompare(b.date))) {
    const previous = ranges.at(-1);
    if (previous && previous.country === entry.country && shiftDate(previous.endDate, 1) === entry.date) {
      previous.endDate = entry.date;
      previous.entries.push(entry);
    } else {
      ranges.push({ country: entry.country, startDate: entry.date, endDate: entry.date, entries: [entry] });
    }
  }
  const dayVisits = ranges.filter((range) => range.startDate === range.endDate);
  return ranges.flatMap((range) => {
    const cuts = [...new Set(dayVisits
      .filter((visit) => visit.country !== range.country && visit.startDate > range.startDate && visit.endDate < range.endDate)
      .map((visit) => visit.startDate))].sort();
    const starts = [range.startDate, ...cuts];
    return starts.map((startDate, index) => {
      // The return day belongs to the later segment, preserving each country-day exactly once.
      const endDate = index < cuts.length ? shiftDate(cuts[index], -1) : range.endDate;
      const contexts = new Set(range.entries
        .filter((entry) => entry.date >= startDate && entry.date <= endDate)
        .flatMap((entry) => [...entry.contexts]));
      return { country: range.country, startDate, endDate, contexts };
    });
  }).sort((a, b) => b.startDate.localeCompare(a.startDate) || b.endDate.localeCompare(a.endDate) || a.country.localeCompare(b.country));
}
