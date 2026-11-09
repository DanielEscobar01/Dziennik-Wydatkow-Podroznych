// PL: Importuj czytnik skoroszytów działający lokalnie w przeglądarce. | ES-CO: Importa el lector Excel que funciona localmente en el navegador.
import { readSheet } from 'read-excel-file/browser';

// PL: Ogranicz kwotę do dwóch miejsc dziesiętnych zgodnych z bazą. | ES-CO: Redondea el importe a dos decimales como en la base.
function roundAmount(value) { return Number(Number(value).toFixed(2)); }
// PL: Ogranicz kurs do ośmiu miejsc dziesiętnych zgodnych z bazą. | ES-CO: Redondea la tasa a ocho decimales como en la base.
function roundRate(value) { return Number(Number(value).toFixed(8)); }

// PL: Ujednolić tekst, myślniki i polskie znaki do porównań nazw. | ES-CO: Normaliza texto, guiones y acentos para comparar nombres.
function normalizeText(value) {
  // PL: Zamień brakującą wartość na pusty tekst. | ES-CO: Convierte valores vacíos en texto vacío.
  const text = String(value ?? '');
  // PL: Usuń znaki diakrytyczne i porównuj tekst bez rozróżniania wielkości liter. | ES-CO: Quita tildes y compara sin distinguir mayúsculas.
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

// PL: Zamień datę komórki Excela na format ISO wymagany przez PostgreSQL. | ES-CO: Convierte la fecha Excel a ISO para PostgreSQL.
function dateToIso(value) {
  // PL: Zachowaj datę odczytaną jako obiekt JavaScript. | ES-CO: Conserva fechas que el lector devuelve como objeto Date.
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(0, 10);
  // PL: Wyodrębnij datę z tekstu ISO, jeśli komórka nie była datą Excela. | ES-CO: Extrae la fecha ISO si la celda no se leyó como fecha.
  const match = String(value ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  // PL: Zwróć poprawny dzień albo pustą wartość do walidacji. | ES-CO: Devuelve una fecha válida o vacío para validarla.
  return match ? match[1] : '';
}

function timeToText(value) {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString().slice(11, 16);
  const text = String(value ?? '').trim();
  const isoTime = text.match(/T(\d{2}:\d{2})/);
  return isoTime ? isoTime[1] : text;
}

function splitProviderReference(value) {
  const [provider, ...referenceParts] = String(value ?? '').split(' · ');
  return { provider: provider.trim(), reference: referenceParts.join(' · ').trim() || null };
}

function numericPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return roundAmount(value);
  const text = String(value ?? '').trim();
  if (!text || /mil|mile/i.test(text) || !(/[¥₩€$]|zł|\bPLN\b|\bJPY\b|\bKRW\b/i.test(text))) return null;
  const match = text.match(/[\d][\d\s\u00a0]*(?:[,.]\d{1,2})?/);
  return match ? roundAmount(Number(match[0].replace(/[\s\u00a0]/g, '').replace(',', '.'))) : null;
}

function currencyForPrice(value) {
  const text = String(value ?? '');
  if (text.includes('¥')) return 'JPY';
  if (text.includes('₩')) return 'KRW';
  if (text.includes('zł')) return 'PLN';
  if (text.includes('€')) return 'EUR';
  return null;
}

// PL: Wczytaj lokalny arkusz i przygotuj tylko wiersze mające dodatnią kwotę PLN. | ES-CO: Lee el Excel local y prepara filas con un PLN positivo.
export async function parseExpenseWorkbook(file) {
  // PL: Odczytaj dziennik i podsumowanie bez wysyłania pliku na serwer. | ES-CO: Lee diario y resumen sin subir el archivo al servidor.
  const [diaryRows, summaryRows] = await Promise.all([readSheet(file, 'Dziennik'), readSheet(file, 'Podsumowanie')]);
  // PL: Sprawdź nagłówki, aby uniknąć importu z niezgodnego układu kolumn. | ES-CO: Valida encabezados para evitar importar columnas equivocadas.
  const headers = diaryRows[8] || [];
  // PL: Wymagaj nazw kolumn potrzebnych do stworzenia rekordu wydatku. | ES-CO: Exige los encabezados necesarios para un gasto.
  if (headers[1] !== 'Data' || headers[3] !== 'Kategoria' || headers[5] !== 'Kwota' || headers[6] !== 'Status') throw new Error('Nie rozpoznano kolumn dziennika wydatków.');
  // PL: Zapisz hotele z wierszy 37–42 arkusza Podsumowanie. | ES-CO: Guarda hoteles de las filas 37–42 del resumen.
  const hotelRows = summaryRows.slice(36, 42);
  // PL: Zapisz loty z wierszy 48–51 arkusza Podsumowanie. | ES-CO: Guarda vuelos de las filas 48–51 del resumen.
  const flightRows = summaryRows.slice(47, 51);
  // PL: Zapisz przejazdy z wierszy 57–64 arkusza Podsumowanie. | ES-CO: Guarda transportes de las filas 57–64 del resumen.
  const transportRows = summaryRows.slice(56, 64);
  // PL: Pobierz wszystkie daty zaplanowane w prawej części dziennika. | ES-CO: Obtén todas las fechas planeadas en la parte derecha del diario.
  const rawDays = diaryRows.slice(9).map((row) => ({ row, date: dateToIso(row[10]) })).filter((item) => item.date && item.row[9]);
  // PL: Usuń powtarzające się daty i zachowaj ich kolejność. | ES-CO: Elimina fechas repetidas conservando el orden.
  const uniqueDays = [...new Map(rawDays.map((item) => [item.date, item])).values()];
  // PL: Odmów importu skoroszytu, który nie ma planu dni. | ES-CO: Rechaza un Excel que no contiene fechas del itinerario.
  if (!uniqueDays.length) throw new Error('Nie znaleziono planu dni w arkuszu Dziennik.');
  // PL: Odczytaj pełną nazwę podróży z panelu podsumowania. | ES-CO: Lee el nombre del viaje desde el panel de resumen.
  const summaryTitle = String(summaryRows[1]?.[1] ?? '').trim();
  // PL: Skróć tytuł panelu do nazwy wyjazdu. | ES-CO: Reduce el título del panel al nombre del viaje.
  const tripName = summaryTitle.split(/\s+[–—]\s+/)[0].replace(/^Podróż\s*/i, '').trim() || 'Nowa podróż';
  // PL: Ustaw budżet dzienny zapisany w komórce B6 dziennika. | ES-CO: Lee el presupuesto diario desde la celda B6 del diario.
  const dailyBudgetPln = Number(diaryRows[5]?.[1]) || 0;
  // PL: Ustaw saldo przed podróżą zapisane w komórce J6 dziennika. | ES-CO: Lee el saldo disponible desde la celda J6 del diario.
  const availableBeforeTripPln = Number(diaryRows[5]?.[9]) || 0;
  // PL: Zbuduj mapę wydatków hotelowych do rozpoznania miasta dnia. | ES-CO: Prepara hoteles para identificar la ciudad de cada fecha.
  const hotelDescriptions = new Map(diaryRows.slice(9).filter((row) => row[3] === 'Hotel' && row[4]).map((row) => [dateToIso(row[1]), String(row[4]).trim().split(/\s+[–—]\s+/)[0]]));
  // PL: Przekształć komórki podróży w osobne rekordy dni. | ES-CO: Convierte las celdas del itinerario en registros de días.
  const tripDays = uniqueDays.map(({ row, date }) => ({ tripDate: date, destination: hotelDescriptions.get(date) || String(row[9]).trim(), country: String(row[9]).trim(), dailyBudgetPln }));
  // PL: Utwórz klucz importu wyjazdu stabilny dla jego nazwy i daty początku. | ES-CO: Crea una clave estable por nombre del viaje y fecha de inicio.
  const tripSourceRef = `excel:${normalizeText(tripName)}:${uniqueDays[0].date}`;
  // PL: Przechowuj konfigurację wyjazdu niezależnie od interfejsu aplikacji. | ES-CO: Devuelve la configuración del viaje separada de la interfaz.
  const trip = { name: tripName, startDate: uniqueDays[0].date, endDate: uniqueDays[uniqueDays.length - 1].date, dailyBudgetPln, availableBeforeTripPln, sourceRef: tripSourceRef };
  const hotelReservations = hotelRows.flatMap((row, index) => {
    const city = String(row[1] ?? '').trim();
    const name = String(row[2] ?? '').trim();
    const checkIn = dateToIso(row[3]);
    const checkOut = dateToIso(row[4]);
    if (!name || !checkIn || !checkOut) return [];
    const provider = splitProviderReference(row[7]);
    const currencyCode = normalizeText(city) === 'seul' ? 'KRW' : 'JPY';
    const amountLocal = numericPrice(row[8]);
    const nights = Number(row[5]) || 0;
    const plnPerNight = Number(row[9]) || 0;
    return [{
      type: 'hotel',
      sortOrder: index,
      sourceRef: `excel:Podsumowanie!B${index + 37}`,
      title: name,
      city,
      checkIn,
      checkOut,
      nights,
      provider: provider.provider,
      bookingReference: provider.reference,
      priceText: String(row[8] ?? '').trim(),
      amountLocal,
      currencyCode: amountLocal == null ? null : currencyCode,
      amountPln: nights && plnPerNight ? roundAmount(nights * plnPerNight) : null,
      plnPerNight: plnPerNight || null,
    }];
  });
  const flightReservations = flightRows.flatMap((row, index) => {
    const flightNumber = String(row[1] ?? '').trim();
    const route = String(row[2] ?? '').trim();
    const flightDate = dateToIso(row[3]);
    if (!flightNumber || !route || !flightDate) return [];
    const provider = splitProviderReference(row[7]);
    const airline = flightNumber.startsWith('LO') ? { name: 'LOT Polish Airlines', logo: 'lot' } : flightNumber.startsWith('NH') ? { name: 'ANA', logo: 'ana' } : flightNumber.startsWith('KE') ? { name: 'Korean Air', logo: 'korean-air' } : { name: provider.provider, logo: null };
    const priceText = String(row[8] ?? '').trim();
    const totalPriceText = typeof row[9] === 'string' ? row[9].trim() : null;
    const currencyCode = currencyForPrice(row[8]);
    return [{
      type: 'flight',
      sortOrder: index,
      sourceRef: `excel:Podsumowanie!B${index + 48}`,
      flightNumber,
      route,
      flightDate,
      departureTime: timeToText(row[4]),
      arrivalTime: timeToText(row[5]),
      airlineName: airline.name,
      airlineLogo: airline.logo,
      provider: provider.provider,
      bookingReference: provider.reference,
      priceText,
      totalPriceText,
      amountLocal: currencyCode && !/mil|mile/i.test(priceText) ? numericPrice(row[8]) : null,
      currencyCode,
      amountPln: numericPrice(row[9]),
    }];
  });
  const reservations = [...hotelReservations, ...flightReservations];
  // PL: Przejdź po wycenionych wierszach wydatków z prawidłowym numerem w Excelu. | ES-CO: Recorre los gastos con precio conservando su fila de Excel.
  const expenses = diaryRows.slice(9).flatMap((row, index) => {
    // PL: Odczytaj kwotę PLN obliczoną przez arkusz. | ES-CO: Lee el importe PLN calculado por la hoja.
    const amountPln = Number(row[5]);
    // PL: Pomijaj puste miejsca i pozycje, które nie mają jeszcze ceny. | ES-CO: Omite espacios y gastos que aún no tienen precio.
    if (!Number.isFinite(amountPln) || amountPln <= 0) return [];
    // PL: Odczytaj datę dnia, kategorię, opis, status i sposób płatności. | ES-CO: Lee fecha, categoría, descripción, estado y medio de pago.
    const expenseDate = dateToIso(row[1]);
    // PL: Normalizuj kategorię do tekstu zapisywanego w bazie. | ES-CO: Normaliza la categoría que se guardará en la base.
    const category = String(row[3] ?? 'Inne').trim() || 'Inne';
    // PL: Zachowaj opis z arkusza. | ES-CO: Conserva la descripción del Excel.
    let description = String(row[4] ?? '').trim();
    // PL: Zachowaj status z arkusza albo użyj statusu podróży. | ES-CO: Conserva el estado del Excel o usa estado de viaje.
    const status = String(row[6] ?? 'W Podróży').trim() || 'W Podróży';
    // PL: Zachowaj sposób płatności, jeśli arkusz go zawiera. | ES-CO: Conserva la forma de pago si está informada.
    const payment = String(row[7] ?? '').trim() || null;
    // PL: Zatrzymaj import z komunikatem, jeśli rekord nie ma poprawnej daty. | ES-CO: Rechaza filas con fecha inválida.
    if (!expenseDate) throw new Error(`Nieprawidłowa data w wierszu ${index + 10}.`);
    // PL: Utwórz bezpieczny wariant opisu do dopasowania szczegółów waluty. | ES-CO: Normaliza la descripción para buscar moneda y tasa.
    const normalizedDescription = normalizeText(description);
    // PL: Ustaw domyślnie kwotę bazową w PLN, gdy arkusz nie ma waluty lokalnej. | ES-CO: Usa PLN si el Excel no informa una moneda local.
    let amountLocal = roundAmount(amountPln);
    // PL: Ustaw domyślnie kod PLN dla pozycji bez ceny lokalnej. | ES-CO: Usa PLN para filas sin precio local.
    let currencyCode = 'PLN';
    // PL: Ustaw kurs jeden do jednego dla kwot zapisanych już w PLN. | ES-CO: Usa tasa uno a uno para importes en PLN.
    let plnPerUnit = 1;
    // PL: Wybierz hotel pasujący do opisu nocy w dzienniku. | ES-CO: Busca el hotel correspondiente a la noche del diario.
    if (category === 'Hotel') {
      // PL: Usuń numer nocy, aby dopasować nazwę hotelu z podsumowania. | ES-CO: Quita el número de noche para comparar el hotel.
      const hotelKey = normalizeText(description.replace(/\s*·\s*Noc\s+\d+\/\d+$/i, ''));
      // PL: Odszukaj wiersz hotelu, którego miasto i nazwa tworzą opis dziennika. | ES-CO: Encuentra el hotel por ciudad y nombre.
      const hotel = hotelRows.find((detail) => normalizeText(`${detail[1]} - ${detail[2]}`) === hotelKey);
      // PL: Oblicz kwotę i kurs noclegu z całkowitej waluty rezerwacji. | ES-CO: Calcula importe y tasa por noche desde el total reservado.
      if (hotel) {
        // PL: Odczytaj liczbę nocy w rezerwacji. | ES-CO: Lee cuántas noches tiene la reserva.
        const nights = Number(hotel[5]);
        // PL: Odczytaj kwotę całej rezerwacji w walucie local. | ES-CO: Lee el total local de la reserva.
        const localTotal = Number(hotel[8]);
        // PL: Odczytaj kwotę PLN za noc zapisaną w arkuszu. | ES-CO: Lee el PLN por noche registrado en la hoja.
        const plnPerNight = Number(hotel[9]);
        // PL: Rozłóż kwotę rezerwacji równo między noce i zaokrąglij do skali bazy. | ES-CO: Divide la reserva por noche y redondea según la base.
        if (nights > 0 && localTotal > 0 && plnPerNight > 0) {
          amountLocal = roundAmount(localTotal / nights);
          // PL: Rozpoznaj won dla Seulu i jen dla pozostałych hoteli. | ES-CO: Identifica won para Seúl y yen para los demás hoteles.
          currencyCode = normalizeText(hotel[1]) === 'seul' ? 'KRW' : 'JPY';
          // PL: Ustal kurs na podstawie kwoty PLN za noc z Excela. | ES-CO: Calcula la tasa desde el PLN por noche del Excel.
          plnPerUnit = roundRate(plnPerNight / amountLocal);
        }
      }
    }
    // PL: Dopasuj loty z detailami w arkuszu Podsumowanie. | ES-CO: Busca el vuelo relacionado en el resumen.
    if (category === 'Loty') {
      // PL: Powiąż nazwy linii lotniczych z kodami lotów w arkuszu. | ES-CO: Relaciona aerolíneas con códigos de vuelo del Excel.
      const flightCode = normalizedDescription.includes('korean air') ? 'KE2156' : normalizedDescription.includes('ana') ? 'NH523' : normalizedDescription.startsWith('lot') ? 'LO79' : '';
      // PL: Odszukaj cenę local i PLN dla rozpoznanego lotu. | ES-CO: Encuentra precios local y PLN del vuelo reconocido.
      const flight = flightRows.find((detail) => String(detail[1] ?? '').trim() === flightCode);
      // PL: Ustaw walutę local, gdy cena lotu jest jednoznaczna. | ES-CO: Conserva la moneda local cuando la tarifa es simple.
      if (flight && flightCode === 'NH523' && typeof flight[8] === 'string') {
        // PL: Zamień cenę w jenach na liczbę. | ES-CO: Convierte el precio en yenes a número.
        const localValue = Number(flight[8].replace(/[^\d]/g, ''));
        // PL: Zapisz cenę biletu w jenach. | ES-CO: Guarda el precio del boleto en yenes.
        if (localValue > 0) { amountLocal = roundAmount(localValue); currencyCode = 'JPY'; plnPerUnit = roundRate(amountPln / amountLocal); }
      }
      // PL: Zostaw bilety mieszane jako PLN i zachowaj mile oraz euro w opisie. | ES-CO: Guarda la tarifa mixta en PLN y conserva millas y euros en la descripción.
      if (flight && flightCode === 'KE2156' && String(flight[8]).trim()) description = `${description} · ${String(flight[8]).trim()}`;
    }
    // PL: Dopasuj przejazdy o cenie local w wierszach transportu. | ES-CO: Busca transportes con precio local.
    if (category === 'Transport') {
      // PL: Usuń typ transportu i szczegół w nawiasie przed porównaniem trasy. | ES-CO: Quita tipo y notas entre paréntesis al comparar rutas.
      const routeKey = normalizeText(description.replace(/^(pociąg|autobus|shinkansen)\s*:\s*/i, '').replace(/\s*\([^)]*\)/g, ''));
      // PL: Znajdź wiersz z tą samą trasą w podsumowaniu. | ES-CO: Encuentra la misma ruta en el resumen.
      const transport = transportRows.find((detail) => normalizeText(detail[2]).startsWith(routeKey));
      // PL: Użyj ceny local tylko wtedy, gdy jest liczbą z arkusza. | ES-CO: Usa precio local solo cuando el Excel lo da como número.
      if (transport && Number(transport[8]) > 0) {
        // PL: Zachowaj kwotę w jenach, a PLN potraktuj jako podstawę kursu. | ES-CO: Conserva yenes y calcula la tasa desde el PLN del Excel.
        amountLocal = roundAmount(Number(transport[8]));
        // PL: Przejazd z ceną w japońskim rozkładzie jest w jenach. | ES-CO: El trayecto con tarifa del horario japonés está en yenes.
        currencyCode = 'JPY';
        // PL: Zachowaj wartość PLN policzoną przez arkusz. | ES-CO: Conserva el equivalente PLN del Excel.
        plnPerUnit = roundRate(amountPln / amountLocal);
      }
    }
    // PL: Zwróć rekord gotowy do importu z oryginalnym numerem wiersza. | ES-CO: Devuelve el gasto listo para importar con su fila de origen.
    return [{ expenseDate, category, description, amountLocal, currencyCode, plnPerUnit, amountPln: roundAmount(amountPln), status, payment, sourceRef: `excel:Dziennik!B${index + 10}` }];
  });
  // PL: Zwróć ustawienia podróży, plan dni i wydatki jako osobne zbiory danych. | ES-CO: Devuelve viaje, itinerario y gastos como datos separados.
  return { trip, tripDays, expenses, reservations };
}
