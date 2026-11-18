// PL: Załaduj runner testów Node.js. | ES-CO: Importa el ejecutor de pruebas de Node.js.
import test from 'node:test';
// PL: Załaduj asercje ścisłego porównywania wyników. | ES-CO: Importa aserciones de comparación estricta.
import assert from 'node:assert/strict';
// PL: Pobierz funkcję grupującą dzienne wpisy w przedziały pobytu. | ES-CO: Importa la función que agrupa registros diarios en periodos de estancia.
import { buildDailyLocationRanges } from './daily-location-ranges.js';

// PL: Utwórz przykładowy wpis lokalizacji dla daty i kraju. | ES-CO: Crea un registro de ubicación de ejemplo para una fecha y un país.
const row = (date, country, context = '') => ({ location_date: date, country, context });
// PL: Ogranicz wynik do pól zakresu, które sprawdzają testy. | ES-CO: Reduce el resultado a los campos del periodo que verifican las pruebas.
const periods = (ranges) => ranges.map(({ country, startDate, endDate }) => [country, startDate, endDate]);

// PL: Sprawdź podział pobytu przy wyjeździe, jednodniowej wizycie i powrocie. | ES-CO: Verifica la división de una estancia al salir, visitar otro país por un día y regresar.
test('shows departure, day visit and return without duplicating country-days', () => {
  // PL: Przygotuj kilka kolejnych dni w kraju pobytu oraz dni graniczne w innych krajach. | ES-CO: Prepara días consecutivos en el país de estancia y días límite en otros países.
  const rows = [
    ...[9, 10, 11, 12, 13].map((day) => row(`2025-05-${String(day).padStart(2, '0')}`, 'Estonia')),
    row('2025-05-09', 'Polska'),
    row('2025-05-11', 'Finlandia', 'Wizyta i powrot'),
    row('2025-05-13', 'Polska'),
    row('2025-05-14', 'Polska'),
  ];
  // PL: Zbuduj przedziały z przykładowych wpisów dziennych. | ES-CO: Construye periodos a partir de los registros diarios de ejemplo.
  const ranges = buildDailyLocationRanges(rows);
  // PL: Sprawdź oczekiwane segmenty z podziałem przy wizycie i powrocie. | ES-CO: Comprueba los segmentos esperados alrededor de la visita y el regreso.
  assert.deepEqual(periods(ranges), [
    ['Polska', '2025-05-13', '2025-05-14'],
    ['Estonia', '2025-05-11', '2025-05-13'],
    ['Finlandia', '2025-05-11', '2025-05-11'],
    ['Estonia', '2025-05-09', '2025-05-10'],
    ['Polska', '2025-05-09', '2025-05-09'],
  ]);
  // PL: Rozwiń każdy przedział z powrotem do listy krajów i dat. | ES-CO: Expande cada periodo nuevamente en una lista de países y fechas.
  const expanded = ranges.flatMap(({ country, startDate, endDate }) => {
    // PL: Przygotuj listę dni składających się na bieżący przedział. | ES-CO: Prepara la lista de días del periodo actual.
    const dates = [];
    // PL: Iteruj po kolejnych dniach w UTC, aby uwzględnić zakres domknięty. | ES-CO: Recorre los días consecutivos en UTC e incluye ambos extremos.
    for (let date = new Date(`${startDate}T00:00:00Z`); date.toISOString().slice(0, 10) <= endDate; date.setUTCDate(date.getUTCDate() + 1)) {
      // PL: Dodaj pojedynczy dzień z prefiksem jego kraju. | ES-CO: Añade un día individual con el prefijo de su país.
      dates.push(`${country}:${date.toISOString().slice(0, 10)}`);
    }
    // PL: Zwróć dni rozwiniętego przedziału. | ES-CO: Devuelve los días expandidos del periodo.
    return dates;
  });
  // PL: Potwierdź, że rozwinięte przedziały zachowują każdy wpis dokładnie raz. | ES-CO: Confirma que los periodos expandidos conservan cada registro exactamente una vez.
  assert.deepEqual(expanded.sort(), rows.map((entry) => `${entry.country}:${entry.location_date}`).sort());
});

// PL: Sprawdź ciągłość pobytów, przerwy, konteksty i przejście między latami. | ES-CO: Verifica continuidad, interrupciones, contextos y el cambio de año.
test('keeps continuous stays, gaps, duplicate contexts and year boundaries', () => {
  // PL: Utwórz wpisy z powtórzonym kontekstem, przerwą i granicą roku. | ES-CO: Crea registros con contexto repetido, una interrupción y un cambio de año.
  const ranges = buildDailyLocationRanges([
    row('2025-12-31', 'Estonia', 'Estonia: Przylot'),
    row('2025-12-31', 'Estonia', 'Pobyt'),
    row('2026-01-01', 'Estonia', 'Pobyt'),
    row('2026-01-03', 'Estonia', 'Wylot'),
  ]);
  // PL: Sprawdź połączone dni oraz osobny przedział po luce. | ES-CO: Comprueba los días combinados y el periodo separado después de la interrupción.
  assert.deepEqual(periods(ranges), [
    ['Estonia', '2026-01-03', '2026-01-03'],
    ['Estonia', '2025-12-31', '2026-01-01'],
  ]);
  // PL: Upewnij się, że powtarzające się konteksty zostały scalone bez utraty treści. | ES-CO: Comprueba que los contextos repetidos se combinaron sin perder información.
  assert.deepEqual([...ranges[1].contexts], ['Przylot', 'Pobyt']);
});

// PL: Sprawdź ponowne jednodniowe wyjazdy i przypisanie kontekstu do właściwego segmentu. | ES-CO: Verifica varias visitas de un día y el contexto asignado al segmento correcto.
test('splits repeated day trips and keeps contexts within their segment', () => {
  // PL: Przygotuj pobyt z dwiema jednodniowymi wizytami w innym kraju. | ES-CO: Prepara una estancia con dos visitas de un día a otro país.
  const ranges = buildDailyLocationRanges([
    ...[9, 10, 11, 12, 13].map((day) => row(`2025-05-${String(day).padStart(2, '0')}`, 'Estonia', day === 13 ? 'Wylot' : 'Pobyt')),
    row('2025-05-10', 'Finlandia'),
    row('2025-05-12', 'Finlandia'),
  ]);
  // PL: Sprawdź segmenty utworzone wokół obu wyjazdów. | ES-CO: Comprueba los segmentos creados alrededor de ambas salidas.
  assert.deepEqual(periods(ranges), [
    ['Estonia', '2025-05-12', '2025-05-13'],
    ['Finlandia', '2025-05-12', '2025-05-12'],
    ['Estonia', '2025-05-10', '2025-05-11'],
    ['Finlandia', '2025-05-10', '2025-05-10'],
    ['Estonia', '2025-05-09', '2025-05-09'],
  ]);
  // PL: Potwierdź, że kontekst końcowy nie przecieka do wcześniejszych części pobytu. | ES-CO: Confirma que el contexto final no aparece en segmentos anteriores.
  assert.deepEqual([...ranges.at(-1).contexts], ['Pobyt']);
});
