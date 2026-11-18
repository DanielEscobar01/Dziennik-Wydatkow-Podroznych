// PL: Przesuń datę ISO o wskazaną liczbę dni w UTC. | ES-CO: Desplaza una fecha ISO la cantidad indicada de días en UTC.
function shiftDate(date, days) {
  // PL: Utwórz datę UTC, aby zmiana dnia nie zależała od strefy lokalnej. | ES-CO: Crea una fecha UTC para no depender de la zona horaria local.
  const value = new Date(`${date}T00:00:00Z`);
  // PL: Zmień dzień kalendarzowy o podany przyrost. | ES-CO: Ajusta el día del calendario según el desplazamiento.
  value.setUTCDate(value.getUTCDate() + days);
  // PL: Zwróć wyłącznie część daty w formacie YYYY-MM-DD. | ES-CO: Devuelve solo la fecha en formato YYYY-MM-DD.
  return value.toISOString().slice(0, 10);
}

// PL: Zbuduj ciągłe przedziały pobytu na podstawie dziennych wpisów lokalizacji. | ES-CO: Construye periodos continuos de estancia a partir de ubicaciones diarias.
export function buildDailyLocationRanges(rows) {
  // PL: Grupuj wpisy według kraju i dnia, łącząc ich konteksty. | ES-CO: Agrupa los registros por país y día y combina sus contextos.
  const countryDates = new Map();
  // PL: Przetwórz po kolei wszystkie zapisane lokalizacje. | ES-CO: Procesa una por una todas las ubicaciones registradas.
  rows.forEach((row) => {
    // PL: Ujednolić wpis daty do pierwszych dziesięciu znaków. | ES-CO: Normaliza la fecha tomando sus primeros diez caracteres.
    const date = String(row.location_date || '').slice(0, 10);
    // PL: Usuń zbędne odstępy z nazwy kraju. | ES-CO: Quita los espacios sobrantes del nombre del país.
    const country = String(row.country || '').trim();
    // PL: Pomiń rekord, któremu brakuje daty lub kraju. | ES-CO: Omite el registro si falta la fecha o el país.
    if (!date || !country) return;
    // PL: Utwórz jednoznaczny klucz pary kraju i daty. | ES-CO: Crea una clave única para el par de país y fecha.
    const key = `${country}\u0000${date}`;
    // PL: Pobierz grupę dla dnia lub utwórz nową z pustym zbiorem kontekstów. | ES-CO: Obtiene el grupo del día o crea uno con un conjunto vacío de contextos.
    const entry = countryDates.get(key) || { country, date, contexts: new Set() };
    // PL: Oczyść opis kontekstu lokalizacji. | ES-CO: Limpia la descripción del contexto de ubicación.
    const context = String(row.context || '').trim();
    // PL: Usuń powtórzoną nazwę kraju z początku opisu. | ES-CO: Quita del inicio la repetición del nombre del país.
    const details = context.startsWith(`${country}:`) ? context.slice(country.length + 1).trim() : context;
    // PL: Rozdziel opisy po przecinkach i dodaj niepuste wartości bez duplikatów. | ES-CO: Separa las descripciones por comas y agrega valores no vacíos sin duplicados.
    details.split(',').map((detail) => detail.trim()).filter(Boolean).forEach((detail) => entry.contexts.add(detail));
    // PL: Zapisz zaktualizowaną grupę kraju i dnia. | ES-CO: Guarda el grupo actualizado de país y día.
    countryDates.set(key, entry);
  });
  // PL: Przygotuj listę scalonych przedziałów pobytu. | ES-CO: Prepara la lista de periodos de estancia combinados.
  const ranges = [];
  // PL: Uporządkuj grupy według kraju, a następnie daty. | ES-CO: Ordena los grupos por país y luego por fecha.
  for (const entry of [...countryDates.values()].sort((a, b) => a.country.localeCompare(b.country) || a.date.localeCompare(b.date))) {
    // PL: Sprawdź ostatni utworzony przedział. | ES-CO: Consulta el último periodo creado.
    const previous = ranges.at(-1);
    // PL: Połącz dzień z poprzednim przedziałem tego kraju, jeśli jest bezpośrednio kolejny. | ES-CO: Une el día al periodo anterior del mismo país si es consecutivo.
    if (previous && previous.country === entry.country && shiftDate(previous.endDate, 1) === entry.date) {
      // PL: Przesuń koniec ciągłego pobytu na nowy dzień. | ES-CO: Extiende el final de la estancia continua hasta el nuevo día.
      previous.endDate = entry.date;
      // PL: Zachowaj wpis dnia do późniejszego agregowania kontekstów. | ES-CO: Conserva el registro diario para agregar sus contextos después.
      previous.entries.push(entry);
    } else {
      // PL: Rozpocznij nowy przedział pobytu obejmujący ten jeden dzień. | ES-CO: Inicia un nuevo periodo de estancia que cubre solo este día.
      ranges.push({ country: entry.country, startDate: entry.date, endDate: entry.date, entries: [entry] });
    }
  }
  // PL: Wybierz jednodniowe wizyty, które mogą dzielić dłuższy pobyt innego kraju. | ES-CO: Selecciona visitas de un día que pueden dividir una estancia más larga de otro país.
  const dayVisits = ranges.filter((range) => range.startDate === range.endDate);
  // PL: Podziel przedziały na segmenty wokół jednodniowych wizyt w innych krajach. | ES-CO: Divide los periodos en segmentos alrededor de visitas de un día a otros países.
  return ranges.flatMap((range) => {
    // PL: Znajdź wizyty w innych krajach ściśle wewnątrz tego przedziału. | ES-CO: Busca visitas a otros países estrictamente dentro de este periodo.
    const cuts = [...new Set(dayVisits
      .filter((visit) => visit.country !== range.country && visit.startDate > range.startDate && visit.endDate < range.endDate)
      .map((visit) => visit.startDate))].sort();
    // PL: Utwórz punkty rozpoczęcia segmentów z początkiem i wykrytymi podziałami. | ES-CO: Crea los inicios de segmentos con el comienzo y los cortes detectados.
    const starts = [range.startDate, ...cuts];
    // PL: Zbuduj każdy segment, przypisując dzień powrotu do kolejnego segmentu. | ES-CO: Construye cada segmento y asigna el día de regreso al siguiente.
    return starts.map((startDate, index) => {
      // PL: Przypisz dzień powrotu do kolejnego segmentu, aby zachować każdy kraj-dzień dokładnie raz. | ES-CO: Asigna el día de regreso al siguiente segmento para conservar cada combinación país-día una sola vez.
      const endDate = index < cuts.length ? shiftDate(cuts[index], -1) : range.endDate;
      // PL: Zbierz konteksty należące wyłącznie do dni bieżącego segmentu. | ES-CO: Reúne solo los contextos de los días del segmento actual.
      const contexts = new Set(range.entries
        .filter((entry) => entry.date >= startDate && entry.date <= endDate)
        .flatMap((entry) => [...entry.contexts]));
      // PL: Zwróć segment pobytu wraz z zakresem dat i kontekstami. | ES-CO: Devuelve el segmento con sus fechas y contextos.
      return { country: range.country, startDate, endDate, contexts };
    });
  // PL: Uporządkuj wyniki od najnowszego początku, a dalej według końca i kraju. | ES-CO: Ordena los resultados por inicio más reciente, luego por fin y país.
  }).sort((a, b) => b.startDate.localeCompare(a.startDate) || b.endDate.localeCompare(a.endDate) || a.country.localeCompare(b.country));
}
