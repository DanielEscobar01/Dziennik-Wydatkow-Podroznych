// PL: Załaduj runner testów Node.js. | ES-CO: Importa el ejecutor de pruebas de Node.js.
import test from 'node:test';
// PL: Załaduj asercje ścisłego porównywania wyników. | ES-CO: Importa aserciones de comparación estricta.
import assert from 'node:assert/strict';
// PL: Pobierz funkcję podsumowującą wydatki pobytu. | ES-CO: Importa la función que resume los gastos de estancia.
import { summarizeStayExpenses } from './stay-expenses.js';

// PL: Utwórz wydatek testowy z datą, kategorią i kwotą PLN. | ES-CO: Crea un gasto de prueba con fecha, categoría e importe en PLN.
const expense = (date, category, plnAmount) => ({ date, category, plnAmount });

// PL: Potwierdź, że loty i transport nie wpływają na średnią ani rekordowy dzień. | ES-CO: Confirma que vuelos y transporte no afectan el promedio ni el día máximo.
test('excludes flights and transport from both average and most expensive day', () => {
  // PL: Zsumuj typowe koszty pobytu razem z kosztami transportu do wykluczenia. | ES-CO: Incluye gastos habituales y costos de transporte que deben excluirse.
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
  // PL: Sprawdź średnią wyłącznie dla dni z kosztami pobytu. | ES-CO: Comprueba el promedio solo para días con gastos de estancia.
  assert.equal(result.averagePerDay, 600);
  // PL: Sprawdź dzień o największej sumie po pominięciu transportu. | ES-CO: Comprueba el día de mayor gasto tras excluir el transporte.
  assert.deepEqual(result.highestDay, { date: '2026-11-21', total: 700 });
});

// PL: Sprawdź wynik dla pustego zestawu oraz samych wydatków transportowych. | ES-CO: Verifica el resultado sin gastos y con solo gastos de transporte.
test('returns no highest day and zero average for empty or transport-only expenses', () => {
  // PL: Uruchom oba przypadki, które nie mają kosztów pobytu. | ES-CO: Ejecuta ambos casos sin costos de estancia.
  for (const expenses of [[], [expense('2026-11-19', 'Loty', 6005.14), expense('2026-11-19', 'Transport', 200)]]) {
    // PL: Potwierdź zerową średnią i brak najwyższego dnia. | ES-CO: Confirma un promedio cero y la ausencia de día máximo.
    assert.deepEqual(summarizeStayExpenses(expenses, ['2026-11-19']), { averagePerDay: 0, highestDay: null });
  }
});

// PL: Sprawdź, że uwzględniane są tylko daty wybranego planu podróży. | ES-CO: Verifica que solo se incluyan fechas del itinerario seleccionado.
test('uses only dates belonging to the selected itinerary', () => {
  // PL: Umieść wydatki zarówno wewnątrz, jak i poza zakresem trasy. | ES-CO: Incluye gastos dentro y fuera del rango del itinerario.
  const result = summarizeStayExpenses([
    expense('2026-11-18', 'Hotel', 5000),
    expense('2026-11-20', 'Jedzenie', 60),
  ], ['2026-11-20']);
  // PL: Potwierdź, że koszt spoza trasy nie zmienia średniej. | ES-CO: Confirma que un gasto fuera del itinerario no altera el promedio.
  assert.equal(result.averagePerDay, 60);
  // PL: Sprawdź rekord dnia ograniczony do daty podróży. | ES-CO: Comprueba el registro máximo limitado a la fecha del viaje.
  assert.deepEqual(result.highestDay, { date: '2026-11-20', total: 60 });
});
