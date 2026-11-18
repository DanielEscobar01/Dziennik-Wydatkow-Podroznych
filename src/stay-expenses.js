// PL: Rozpoznaj kategorie wydatków transportowych wykluczane z kosztu pobytu. | ES-CO: Identifica las categorías de transporte que se excluyen del costo de estancia.
export function isTransportExpense(expense) {
  // PL: Traktuj loty i transport jako wydatki poza pobytem. | ES-CO: Excluye vuelos y transporte de los gastos de estancia.
  return expense.category === 'Loty' || expense.category === 'Transport';
}

// PL: Oblicz średni i najwyższy dzienny koszt pobytu dla wybranej trasy. | ES-CO: Calcula el costo diario promedio y máximo de la estancia para el itinerario elegido.
export function summarizeStayExpenses(expenses, tripDates) {
  // PL: Zainicjuj sumę dla każdego dnia trasy, także bez wydatków. | ES-CO: Inicializa el total de cada día del itinerario, incluso si no hay gastos.
  const totals = new Map(tripDates.map((date) => [date, 0]));
  // PL: Dodaj tylko wydatki nietransportowe przypisane do dni tej trasy. | ES-CO: Suma solo gastos no relacionados con transporte asignados a días del itinerario.
  for (const expense of expenses) {
    // PL: Pomiń transport oraz wydatki spoza wybranego zakresu dat. | ES-CO: Omite transporte y gastos fuera del rango de fechas seleccionado.
    if (isTransportExpense(expense) || !totals.has(expense.date)) continue;
    // PL: Dodaj kwotę wydatku do sumy właściwego dnia. | ES-CO: Añade el importe del gasto al total del día correspondiente.
    totals.set(expense.date, totals.get(expense.date) + Number(expense.plnAmount));
  }
  // PL: Zamień mapę dziennych sum na rekordy gotowe do analizy. | ES-CO: Convierte el mapa de totales diarios en registros listos para analizar.
  const dailyTotals = [...totals].map(([date, total]) => ({ date, total }));
  // PL: Uwzględnij w średniej tylko dni z dodatnim kosztem. | ES-CO: Incluye en el promedio solo los días con un costo positivo.
  const activeDays = dailyTotals.filter((day) => day.total > 0);
  // PL: Oblicz sumę kosztów z wszystkich dni trasy. | ES-CO: Calcula el costo total de todos los días del itinerario.
  const total = dailyTotals.reduce((sum, day) => sum + day.total, 0);
  // PL: Znajdź dzień z największą sumą albo zwróć null przy braku kosztów. | ES-CO: Encuentra el día más costoso o devuelve null si no hay gastos.
  const highestDay = activeDays.reduce((highest, day) => !highest || day.total > highest.total ? day : highest, null);
  // PL: Zwróć średnią na aktywny dzień i najwyższy dzienny koszt. | ES-CO: Devuelve el promedio por día activo y el costo diario máximo.
  return {
    // PL: Zabezpiecz obliczenie średniej dla pustej listy aktywnych dni. | ES-CO: Evita dividir por cero si no hay días activos.
    averagePerDay: activeDays.length ? total / activeDays.length : 0,
    // PL: Udostępnij znaleziony dzień o najwyższym koszcie. | ES-CO: Expone el día con el costo más alto.
    highestDay,
  };
}
