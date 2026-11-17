export function isTransportExpense(expense) {
  return expense.category === 'Loty' || expense.category === 'Transport';
}

export function summarizeStayExpenses(expenses, tripDates) {
  const totals = new Map(tripDates.map((date) => [date, 0]));
  for (const expense of expenses) {
    if (isTransportExpense(expense) || !totals.has(expense.date)) continue;
    totals.set(expense.date, totals.get(expense.date) + Number(expense.plnAmount));
  }
  const dailyTotals = [...totals].map(([date, total]) => ({ date, total }));
  const activeDays = dailyTotals.filter((day) => day.total > 0);
  const total = dailyTotals.reduce((sum, day) => sum + day.total, 0);
  const highestDay = activeDays.reduce((highest, day) => !highest || day.total > highest.total ? day : highest, null);
  return {
    averagePerDay: activeDays.length ? total / activeDays.length : 0,
    highestDay,
  };
}
