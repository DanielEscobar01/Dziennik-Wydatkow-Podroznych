// PL: Importuj oficjalny klient Supabase do logowania i bezpiecznego dostępu do tabeli. | ES-CO: Importa el cliente oficial de Supabase para el acceso y la autenticación.
import { createClient } from '@supabase/supabase-js';
// PL: Importuj Chart.js z kontrolerami potrzebnymi do wykresów dziennych i kołowych. | ES-CO: Importa Chart.js con controladores para gráficos diarios y circulares.
import Chart from 'chart.js/auto';

// PL: Pobierz publiczny adres projektu z lokalnego pliku środowiskowego. | ES-CO: Lee la URL pública del proyecto desde el archivo local de entorno.
const projectUrl = import.meta.env.VITE_SUPABASE_URL;
// PL: Pobierz klucz publishable przeznaczony do aplikacji przeglądarkowej. | ES-CO: Lee la clave publishable destinada a la aplicación del navegador.
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// PL: Ustaw unikalny klucz tabeli wydatków w bazie Supabase. | ES-CO: Define el nombre de la tabla de gastos en Supabase.
const TABLE_NAME = 'expenses';
// PL: Uporządkuj nazwy walut widoczne na formularzu i liście wydatków. | ES-CO: Organiza los nombres de monedas visibles en el formulario y el diario.
const currencyNames = { JPY: 'Japoński jen', KRW: 'Won południowokoreański', PLN: 'Polski złoty', EUR: 'Euro', USD: 'Dolar amerykański', GBP: 'Funt szterling', CHF: 'Frank szwajcarski', CZK: 'Korona czeska', HUF: 'Forint węgierski', SEK: 'Korona szwedzka', NOK: 'Korona norweska', DKK: 'Korona duńska', CAD: 'Dolar kanadyjski', AUD: 'Dolar australijski', SGD: 'Dolar singapurski', HKD: 'Dolar hongkoński', CNY: 'Juan chiński', INR: 'Rupia indyjska', THB: 'Bat tajski', TRY: 'Lira turecka', BRL: 'Real brazylijski', MXN: 'Peso meksykańskie', ZAR: 'Rand południowoafrykański', NZD: 'Dolar nowozelandzki', RON: 'Lej rumuński', BGN: 'Lew bułgarski', ISK: 'Korona islandzka', IDR: 'Rupia indonezyjska', ILS: 'Nowy szekel izraelski', MYR: 'Ringgit malezyjski', PHP: 'Peso filipińskie' };
// PL: Ustal wspólną kolejność kategorii w statystykach i wykresach. | ES-CO: Define el orden de categorías en estadísticas y gráficas.
const expenseCategories = ['Hotel', 'Loty', 'Transport', 'Jedzenie', 'Atrakcje', 'Zakupy', 'Inne'];
// PL: Użyj różnych kolorów dla rozróżnienia kategorii na wykresach. | ES-CO: Usa colores variados para diferenciar categorías.
const chartColors = ['#16716b', '#4a7fa0', '#e5b34f', '#de7157', '#76a99b', '#d48b52', '#718797'];
// PL: Sformatuj wartości pieniężne według polskich separatorów i dwóch miejsc. | ES-CO: Formatea importes con separadores polacos y dos decimales.
const formatter = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// PL: Utwórz klienta Supabase z trwałą sesją i obsługą linku email. | ES-CO: Crea el cliente de Supabase con sesión persistente y enlaces de correo.
const supabase = createClient(projectUrl, publishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
// PL: Pobierz formularze, listy i panel logowania potrzebne do obsługi strony. | ES-CO: Obtén formularios, listas y panel de acceso necesarios para la página.
const loginForm = document.querySelector('#loginForm');
// PL: Pobierz formularz dodawania wydatku. | ES-CO: Obtén el formulario para registrar gastos.
const expenseForm = document.querySelector('#expenseForm');
// PL: Pobierz okno dialogowe formularza wydatku. | ES-CO: Obtén el diálogo del formulario de gastos.
const expenseDialog = document.querySelector('#expenseDialog');
// PL: Pobierz główną listę dni podróży. | ES-CO: Obtén la lista principal de días del viaje.
const dayList = document.querySelector('#dayList');
// PL: Pobierz listę wydatków dla wybranego dnia. | ES-CO: Obtén la lista de gastos del día seleccionado.
const expenseList = document.querySelector('#expenseList');
// PL: Pobierz pola daty, waluty, kwoty i kursu w formularzu. | ES-CO: Obtén los campos de fecha, moneda, importe y tasa.
const dateInput = document.querySelector('#expenseDate');
// PL: Pobierz rozwijaną listę walut. | ES-CO: Obtén la lista desplegable de monedas.
const currencyInput = document.querySelector('#expenseCurrency');
// PL: Pobierz pole niestandardowego kodu waluty. | ES-CO: Obtén el campo para un código de moneda personalizado.
const customCurrencyInput = document.querySelector('#customCurrency');
// PL: Pobierz pole kwoty w walucie lokalnej. | ES-CO: Obtén el campo del importe en moneda local.
const amountInput = document.querySelector('#expenseAmount');
// PL: Pobierz pole kursu PLN za jednostkę waluty. | ES-CO: Obtén el campo de tasa PLN por unidad de moneda.
const rateInput = document.querySelector('#exchangeRate');
// PL: Pobierz pole statusu przechowywanego razem z wydatkiem. | ES-CO: Obtén el campo del estado que se guarda con cada gasto.
const statusInput = document.querySelector('#expenseStatus');
// PL: Pobierz przycisk importowania skoroszytu. | ES-CO: Obtén el botón para importar el Excel.
const importExcelButton = document.querySelector('#importExcelButton');
// PL: Pobierz ukryte lokalne pole wyboru pliku Excel. | ES-CO: Obtén el selector local de archivos Excel.
const excelFileInput = document.querySelector('#excelFileInput');
// PL: Pobierz selektor prywatnych wyjazdów użytkownika. | ES-CO: Obtén el selector de viajes privados del usuario.
const tripSelector = document.querySelector('#tripSelector');
// PL: Przechowuj aktualną sesję bez umieszczania jej w DOM. | ES-CO: Guarda la sesión actual fuera del DOM.
let currentUser = null;
// PL: Przechowuj tylko wydatki zwrócone dla zalogowanego użytkownika. | ES-CO: Conserva solo los gastos del usuario autenticado.
let expenses = [];
// PL: Przechowuj wyjazdy i ich dni zwrócone przez RLS dla bieżącego konta. | ES-CO: Guarda viajes y días devueltos por RLS para la cuenta activa.
let trips = [];
// PL: Wybierz aktualny wyjazd bez ustawień wpisanych na stałe w kodzie. | ES-CO: Mantiene el viaje activo fuera de las constantes del código.
let currentTrip = null;
// PL: Pomijaj początkowe zdarzenie Auth do zakończenia odczytu sesji. | ES-CO: Ignora el evento inicial de Auth hasta terminar de leer la sesión.
let authInitialized = false;
// PL: Zachowaj najnowszą sesję otrzymaną przed końcem inicjalizacji. | ES-CO: Conserva la última sesión recibida antes de iniciar.
let pendingAuthSession = null;
// PL: Odróżnij brak zdarzenia od zdarzenia z wylogowaniem, gdzie sesja jest null. | ES-CO: Distingue ausencia de evento de un cierre de sesión con valor null.
let hasPendingAuthEvent = false;
// PL: Zaznacz początkowo pierwszy dzień podróży. | ES-CO: Selecciona inicialmente el primer día del viaje.
let selectedDate = '';
// PL: Numeruj żądania kursu, aby starsza odpowiedź nie nadpisała nowszej. | ES-CO: Numera las solicitudes de tasa para ignorar respuestas antiguas.
let rateRequest = 0;
// PL: Zachowaj datę kursu zwróconą przez serwis albo dzień wydatku dla kursu ręcznego. | ES-CO: Conserva la fecha de la tasa o la fecha del gasto si se ingresa a mano.
let currentRateDate = null;
// PL: Zablokuj wielokrotny zapis tego samego formularza w trakcie żądania. | ES-CO: Evita guardar dos veces mientras la solicitud está activa.
let savingExpense = false;
// PL: Przechowuj instancje wykresów, aby aktualizować je zamiast dublować. | ES-CO: Conserva los gráficos para actualizarlos sin duplicarlos.
let dailyChart = null;
// PL: Przechowuj wykresu podziału kategorii. | ES-CO: Conserva la gráfica de categorías.
let categoryChart = null;
// PL: Zachowaj identyfikator timera powiadomienia, aby móc go odświeżyć. | ES-CO: Conserva el temporizador del aviso para poder reiniciarlo.
let toastTimer;

// PL: Zwróć wszystkie daty podróży w lokalnym południu, unikając przesunięć strefy czasowej. | ES-CO: Devuelve las fechas del viaje al mediodía local para evitar cambios de zona horaria.
function datesInTrip() {
  // PL: Zwróć daty zapisane w planie aktywnego wyjazdu. | ES-CO: Devuelve fechas del itinerario del viaje activo.
  return currentTrip ? currentTrip.days.map((day) => day.date) : [];
}

// PL: Wybierz dzisiejszy dzień podróży lub jej pierwszy zapisany dzień. | ES-CO: Elige hoy si está en el viaje o el primer día del itinerario.
function initialSelectedDate() {
  // PL: Obsłuż konto bez wybranego wyjazdu. | ES-CO: Maneja una cuenta sin viaje seleccionado.
  if (!currentTrip) return '';
  // PL: Odczytaj bieżący dzień według lokalnego kalendarza. | ES-CO: Lee la fecha actual del calendario local.
  const today = new Date().toISOString().slice(0, 10);
  // PL: Zachowaj dziś, gdy jest dniem podróży. | ES-CO: Conserva hoy si forma parte del viaje.
  if (today >= currentTrip.startDate && today <= currentTrip.endDate) return today;
  // PL: W przeciwnym razie zacznij od pierwszego dnia podróży. | ES-CO: De lo contrario, empieza por el primer día del viaje.
  return datesInTrip()[0] || currentTrip.startDate;
}

// PL: Znajdź nazwę miejsca zapisaną dla konkretnej daty. | ES-CO: Encuentra el destino guardado para una fecha.
function destinationForDate(date) { return currentTrip?.days.find((day) => day.date === date)?.destination || currentTrip?.name || 'Podróż'; }
// PL: Zwróć budżet konkretnego dnia lub budżet domyślny wyjazdu. | ES-CO: Devuelve el presupuesto del día o el general del viaje.
function dailyBudgetForDate(date) { return Number(currentTrip?.days.find((day) => day.date === date)?.dailyBudget ?? currentTrip?.dailyBudget ?? 0); }

// PL: Zamień wartość liczbową na czytelny zapis PLN albo innej waluty. | ES-CO: Convierte un valor numérico a un formato legible en PLN u otra moneda.
function money(value, currency = 'PLN') {
  // PL: Użyj polskiego formatu i bezpiecznego zera dla błędnej wartości. | ES-CO: Usa el formato polaco y cero si el valor no es válido.
  return `${formatter.format(Number(value) || 0)} ${currency}`;
}

// PL: Formatuj oryginalną kwotę zgodnie z jej kodem waluty. | ES-CO: Formatea el importe original según su código de moneda.
function localMoney(value, currency) {
  // PL: Najpierw zastosuj standardowe formatowanie ISO waluty. | ES-CO: Primero aplica el formato estándar ISO de la moneda.
  try { return new Intl.NumberFormat('pl-PL', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0); }
  // PL: Pokaż kod obok liczby, jeśli przeglądarka nie zna kodu waluty. | ES-CO: Muestra el código junto al valor si el navegador no reconoce la moneda.
  catch { return `${formatter.format(value)} ${currency}`; }
}

// PL: Formatuj datę dnia według polskich nazw miesięcy i dni tygodnia. | ES-CO: Formatea fechas con nombres polacos de meses y días.
function dateLabel(date, options = { day: 'numeric', month: 'long' }) {
  // PL: Ustaw południe, aby formatowanie nie zmieniło dnia przy zmianie czasu. | ES-CO: Usa el mediodía para que el formato no cambie de día por la zona horaria.
  return new Intl.DateTimeFormat('pl-PL', options).format(new Date(`${date}T12:00:00`));
}

// PL: Odczytaj wydatki przypisane do wybranego dnia. | ES-CO: Filtra los gastos asociados al día seleccionado.
function dayExpenses(date) { return expenses.filter((item) => item.date === date); }
// PL: Zsumuj utrwalone kwoty PLN dla wskazanego dnia. | ES-CO: Suma los importes PLN guardados para el día indicado.
function dayTotal(date) { return dayExpenses(date).reduce((sum, item) => sum + Number(item.plnAmount), 0); }

// PL: Escapuj tekst przed wstawieniem go do szablonu HTML. | ES-CO: Escapa el texto antes de insertarlo en una plantilla HTML.
function escapeHTML(value) {
  // PL: Zamień znaki specjalne na encje, aby opis nie mógł wstrzyknąć HTML. | ES-CO: Convierte caracteres especiales para impedir que la descripción inserte HTML.
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

// PL: Pokaż formularz logowania albo panel aplikacji zależnie od sesji. | ES-CO: Muestra el acceso o la aplicación según exista una sesión.
function renderAuthState() {
  // PL: Odczytaj oba widoki, których widoczność zależy od zalogowania. | ES-CO: Obtén las dos vistas que dependen del inicio de sesión.
  const authPanel = document.querySelector('#authPanel');
  // PL: Pobierz główną aplikację z listą i podsumowaniem. | ES-CO: Obtén la aplicación con el resumen y el diario.
  const appContent = document.querySelector('#appContent');
  // PL: Ukryj dane, gdy nie ma bieżącego użytkownika. | ES-CO: Oculta los datos cuando no hay usuario activo.
  authPanel.hidden = Boolean(currentUser);
  // PL: Pokaż dziennik dopiero po uwierzytelnieniu. | ES-CO: Muestra el diario solo después de autenticar.
  appContent.hidden = !currentUser;
}

// PL: Renderuj selektor tylko z podróży zwróconych dla bieżącego konta. | ES-CO: Renderiza el selector con viajes visibles para la cuenta activa.
function renderTripSelector() {
  // PL: Wypełnij opcje nazwami podróży z Supabase. | ES-CO: Llena las opciones con viajes de Supabase.
  tripSelector.innerHTML = trips.map((trip) => `<option value="${escapeHTML(trip.id)}">${escapeHTML(trip.name)}</option>`).join('');
  // PL: Pokaż listę tylko wtedy, gdy jest co wybierać. | ES-CO: Muestra la lista solo cuando hay opciones.
  tripSelector.hidden = trips.length === 0;
  // PL: Pokaż informację pustą, jeśli użytkownik nie ma podróży. | ES-CO: Muestra un estado vacío cuando no hay viajes.
  document.querySelector('#tripSelectorEmpty').hidden = trips.length > 0;
  // PL: Ustaw bieżący wyjazd w selektorze. | ES-CO: Selecciona el viaje actual en la lista.
  if (currentTrip) tripSelector.value = currentTrip.id;
}

// PL: Załaduj podróże i ich dni dla bieżącego użytkownika. | ES-CO: Carga viajes y días del usuario autenticado.
async function loadTrips() {
  // PL: Wyczyść wszystkie dane przy braku sesji. | ES-CO: Limpia datos cuando no hay sesión activa.
  if (!currentUser) { trips = []; currentTrip = null; expenses = []; renderAuthState(); render(); return; }
  // PL: Zachowaj właściciela, aby odrzucić wynik po zmianie konta. | ES-CO: Conserva el usuario para descartar respuestas de otra sesión.
  const ownerId = currentUser.id;
  // PL: Pokaż, że konfiguracja wyjazdów jest pobierana. | ES-CO: Indica que se están cargando los viajes.
  document.querySelector('#syncStatus').textContent = 'Pobieranie podróży…';
  // PL: Pobierz tylko własne wyjazdy i ich dni, zgodnie z RLS. | ES-CO: Consulta solo viajes propios y sus días, respetando RLS.
  const { data, error } = await supabase.from('trips').select('id,user_id,name,start_date,end_date,daily_budget_pln,available_before_trip_pln,source_ref,trip_days(id,trip_date,destination,country,daily_budget_pln)').eq('user_id', ownerId).order('start_date', { ascending: false });
  // PL: Odrzuć wynik, jeśli użytkownik w międzyczasie się zmienił. | ES-CO: Descarta resultados si cambió el usuario durante la consulta.
  if (!currentUser || currentUser.id !== ownerId) return;
  // PL: Pokaż błąd bez wyświetlania danych podróży z poprzedniego konta. | ES-CO: Muestra error sin conservar datos del usuario anterior.
  if (error) { trips = []; currentTrip = null; expenses = []; renderTripSelector(); render(); showToast('Nie udało się pobrać podróży. Sprawdź migrację Supabase.'); return; }
  // PL: Zamień wiersze relacji na format używany przez interfejs. | ES-CO: Convierte las filas relacionadas al formato de la interfaz.
  trips = (data || []).map((row) => ({ id: row.id, userId: row.user_id, name: row.name, startDate: row.start_date, endDate: row.end_date, dailyBudget: Number(row.daily_budget_pln), availableBeforeTrip: Number(row.available_before_trip_pln), sourceRef: row.source_ref, days: (row.trip_days || []).map((day) => ({ id: day.id, date: day.trip_date, destination: day.destination, country: day.country || '', dailyBudget: day.daily_budget_pln == null ? null : Number(day.daily_budget_pln) })).sort((a, b) => a.date.localeCompare(b.date)) }));
  // PL: Zachowaj wybrany wyjazd albo wybierz najnowszy dostępny. | ES-CO: Conserva el viaje elegido o selecciona el más reciente.
  currentTrip = trips.find((trip) => trip.id === currentTrip?.id) || trips[0] || null;
  // PL: Ustaw początkową datę wybranego wyjazdu. | ES-CO: Establece la fecha inicial del viaje seleccionado.
  selectedDate = initialSelectedDate();
  // PL: Odśwież selektor i nagłówek podróży. | ES-CO: Actualiza selector y encabezado del viaje.
  renderTripSelector();
  // PL: Pobierz wydatki wybranego wyjazdu albo pokaż podpowiedź do importu. | ES-CO: Carga gastos o invita a importar el primer viaje.
  if (currentTrip) await loadExpenses();
  // PL: Ustaw stan pusty przy koncie bez podróży. | ES-CO: Muestra el estado inicial sin viajes.
  else { expenses = []; document.querySelector('#syncStatus').textContent = 'Zaimportuj pierwszą podróż'; render(); }
}

// PL: Pobierz wydatki z Supabase dla bieżącego właściciela. | ES-CO: Consulta en Supabase los gastos del usuario actual.
async function loadExpenses() {
  // PL: Usuń poprzednie dane z pamięci przed zmianą użytkownika lub odświeżeniem. | ES-CO: Limpia datos previos antes de cambiar de usuario o recargar.
  expenses = [];
  // PL: Nie wysyłaj zapytania bez sesji. | ES-CO: No consultes la tabla sin sesión.
  if (!currentUser || !currentTrip) { render(); return; }
  // PL: Pokaż, że dziennik pobiera rekordy bieżącego użytkownika. | ES-CO: Indica que se están cargando los gastos del usuario.
  const syncStatus = document.querySelector('#syncStatus');
  // PL: Wyczyść znacznik sukcesu z poprzedniego odczytu. | ES-CO: Limpia el indicador de éxito anterior.
  syncStatus.classList.remove('synced');
  // PL: Ogłoś rozpoczęcie odczytu z bazy. | ES-CO: Anuncia que comenzó la consulta a la base.
  syncStatus.textContent = 'Pobieranie…';
  // PL: Zapamiętaj właściciela, który zainicjował to zapytanie. | ES-CO: Guarda el usuario que inició esta consulta.
  const ownerId = currentUser.id;
  // PL: Zachowaj identyfikator wyjazdu z chwili rozpoczęcia zapytania. | ES-CO: Conserva el viaje consultado para descartar resultados antiguos.
  const tripId = currentTrip.id;
  // PL: Poproś bazę o pola wymagane przez dziennik i sortuj rosnąco po dacie. | ES-CO: Solicita los campos del diario y ordénalos por fecha.
  const { data, error } = await supabase.from(TABLE_NAME).select('id,user_id,trip_id,expense_date,category,description,amount_local,currency_code,pln_per_unit,amount_pln,payment_method,rate_date,expense_status,source_ref,created_at').eq('user_id', ownerId).eq('trip_id', tripId).order('expense_date', { ascending: true }).order('created_at', { ascending: true });
  // PL: Odrzuć spóźnioną odpowiedź po wylogowaniu lub zmianie konta. | ES-CO: Descarta una respuesta tardía tras cerrar sesión o cambiar de cuenta.
  if (!currentUser || currentUser.id !== ownerId || !currentTrip || currentTrip.id !== tripId) return;
  // PL: Pokaż stan błędu i pozwól ponowić zapytanie, gdy baza odrzuci odczyt. | ES-CO: Muestra el error y permite reintentar si falla la consulta.
  if (error) {
    // PL: Oznacz ostatnią próbę jako nieudaną bez wyświetlania danych technicznych. | ES-CO: Indica que falló sin mostrar detalles técnicos.
    syncStatus.textContent = 'Błąd synchronizacji';
    // PL: Narysuj aktualne podsumowanie bez udawania, że odczyt się powiódł. | ES-CO: Renderiza el resumen sin aparentar que la consulta funcionó.
    render();
    // PL: Zastąp pusty stan instrukcją błędu i przyciskiem ponowienia. | ES-CO: Reemplaza el estado vacío por un error y botón de reintento.
    expenseList.innerHTML = '<li class="empty-state"><strong>Nie udało się pobrać wydatków</strong><p>Sprawdź połączenie i konfigurację bazy, a następnie spróbuj ponownie.</p><button class="quiet-button" id="retryLoad" type="button">Spróbuj ponownie</button></li>';
    // PL: Podłącz ponowienie do tej samej bezpiecznej funkcji odczytu. | ES-CO: Conecta el reintento con la misma función segura de consulta.
    document.querySelector('#retryLoad').addEventListener('click', loadExpenses);
    // PL: Nie przetwarzaj pustej odpowiedzi jako prawidłowej listy. | ES-CO: No trata la respuesta fallida como una lista vacía válida.
    return;
  }
  // PL: Przekształć nazwy kolumn SQL na nazwy używane przez widok. | ES-CO: Convierte columnas SQL a los nombres usados por la interfaz.
  expenses = (data || []).map((row) => ({ id: row.id, userId: row.user_id, tripId: row.trip_id, date: row.expense_date, category: row.category, description: row.description, amount: Number(row.amount_local), currency: row.currency_code, rate: Number(row.pln_per_unit), plnAmount: Number(row.amount_pln), payment: row.payment_method || '', rateDate: row.rate_date, status: row.expense_status || 'W Podróży', sourceRef: row.source_ref || null, createdAt: new Date(row.created_at).getTime() }));
  // PL: Pokaż faktyczną liczbę wydatków zwróconych przez RLS. | ES-CO: Muestra cuántos gastos devolvió realmente RLS.
  syncStatus.textContent = `Wczytano ${expenses.length} wydatków`;
  // PL: Oznacz odczyt jako zakończony. | ES-CO: Marca la consulta como sincronizada.
  syncStatus.classList.add('synced');
  // PL: Uaktualnij podsumowania i obie listy po pobraniu danych. | ES-CO: Actualiza el resumen y las dos listas tras consultar los datos.
  render();
}

// PL: Rysuj podsumowanie, dni i wydatki z aktualnego stanu Supabase. | ES-CO: Renderiza resumen, días y gastos desde el estado de Supabase.
function render() {
  // PL: Odśwież nazwę, daty i trasę aktywnej podróży. | ES-CO: Actualiza nombre, fechas y ruta del viaje activo.
  renderTripContext();
  // PL: Odśwież listę wyboru podróży. | ES-CO: Actualiza el selector de viajes.
  renderTripSelector();
  // PL: Odśwież liczby zbiorcze u góry strony. | ES-CO: Actualiza los totales de la parte superior.
  renderSummary();
  // PL: Odśwież wiersze wszystkich dni podróży. | ES-CO: Actualiza las filas de todos los días del viaje.
  renderDays();
  // PL: Odśwież wydatki wybranego dnia. | ES-CO: Actualiza los gastos del día seleccionado.
  renderExpenses();
  // PL: Odśwież wykresy na podstawie tych samych rekordów co podsumowanie. | ES-CO: Actualiza gráficas con los mismos registros del resumen.
  renderCharts();
}

// PL: Umieść prywatne ustawienia wybranego wyjazdu w nagłówkach i formularzu. | ES-CO: Muestra la configuración privada del viaje activo.
function renderTripContext() {
  // PL: Pobierz tekst dla nazwy podróży i podsumowania. | ES-CO: Obtén los textos del nombre y resumen del viaje.
  const tripName = currentTrip?.name || 'Dziennik wydatków';
  document.title = currentTrip ? `Dziennik wydatków · ${tripName}` : 'Dziennik wydatków';
  // PL: Połącz unikalne miejsca bez powtarzania ich w trasie. | ES-CO: Une destinos únicos sin repetirlos en la ruta.
  const destinations = [...new Set((currentTrip?.days || []).map((day) => day.destination).filter(Boolean))];
  // PL: Ustaw tytuł, trasę i zakres dat bez stałych wartości w HTML. | ES-CO: Define título, ruta y fechas dinámicamente.
  document.querySelector('#pageTitle').textContent = currentTrip ? 'Wydatki, dzień po dniu.' : 'Wybierz podróż.';
  document.querySelector('#tripEyebrow').textContent = currentTrip ? `${tripName} · ${new Date(`${currentTrip.startDate}T12:00:00`).getFullYear()}` : 'Prywatny dziennik podróży';
  document.querySelector('#tripRoute').textContent = currentTrip ? destinations.join(' · ') : 'Zaimportuj arkusz podróży, aby rozpocząć.';
  document.querySelector('#tripSidebarName').textContent = tripName;
  document.querySelector('#tripSidebarDates').textContent = currentTrip ? `${dateLabel(currentTrip.startDate, { day: 'numeric', month: 'short' })} — ${dateLabel(currentTrip.endDate, { day: 'numeric', month: 'short' })}` : 'Zaimportuj podróż';
  document.querySelector('#daysCount').textContent = `${datesInTrip().length} dni`;
  document.querySelector('#dailyBudgetValue').textContent = money(currentTrip?.dailyBudget || 0);
  // PL: Ustaw zakres dat formularza dla aktywnego wyjazdu. | ES-CO: Limita las fechas del formulario al viaje activo.
  dateInput.min = currentTrip?.startDate || '';
  dateInput.max = currentTrip?.endDate || '';
}

// PL: Aktualizuj sumę wydatków, saldo i licznik dni do podróży. | ES-CO: Actualiza gastos totales, saldo y cuenta regresiva.
function renderSummary() {
  // PL: Zsumuj wartości zapisane w PLN. | ES-CO: Suma los importes guardados en PLN.
  const spent = expenses.reduce((sum, item) => sum + Number(item.plnAmount), 0);
  // PL: Zsumuj wydatki oznaczone jako poniesione w podróży. | ES-CO: Suma los gastos marcados como realizados durante el viaje.
  const actualSpent = expenses.filter((item) => item.status === 'W Podróży').reduce((sum, item) => sum + Number(item.plnAmount), 0);
  // PL: Zsumuj pozycje, które nie zostały opłacone lub będą płatne w hotelu. | ES-CO: Suma valores pendientes o pagaderos en el hotel.
  const pending = expenses.filter((item) => item.status === 'Nieopłacone' || item.status === 'Płatne w Hotelu').reduce((sum, item) => sum + Number(item.plnAmount), 0);
  // PL: Pokaż łączną kwotę wydaną. | ES-CO: Muestra el total gastado.
  document.querySelector('#spentTotal').textContent = money(spent);
  // PL: Pokaż kwotę wydaną ze statusem podróży. | ES-CO: Muestra cuánto se ha gastado durante el viaje.
  document.querySelector('#actualSpentTotal').textContent = money(actualSpent);
  // PL: Pokaż jeszcze nieopłacone koszty. | ES-CO: Muestra los gastos todavía pendientes de pago.
  document.querySelector('#pendingTotal').textContent = money(pending);
  // PL: Odejmij faktyczne wydatki w podróży od salda po planowaniu. | ES-CO: Resta el gasto real del saldo ya calculado tras la planeación.
  document.querySelector('#remainingTotal').textContent = money((currentTrip?.availableBeforeTrip || 0) - actualSpent);
  // PL: Pokaż liczbę zapisanych pozycji z poprawną odmianą polską. | ES-CO: Muestra el número de movimientos con el texto correspondiente.
  document.querySelector('#expenseCount').textContent = `${expenses.length} ${expenses.length === 1 ? 'wydatek' : 'wydatków'}`;
  // PL: Oblicz wydatki dla każdego dnia z planu. | ES-CO: Calcula el gasto de cada día del itinerario.
  const dailyTotals = datesInTrip().map((date) => ({ date, total: dayTotal(date) }));
  // PL: Wybierz dni z co najmniej jednym wydatkiem. | ES-CO: Selecciona los días que tienen gastos.
  const activeDays = dailyTotals.filter((day) => day.total > 0);
  // PL: Oblicz średnią tylko dla dni z wydatkami, aby wynik był miarodajny. | ES-CO: Calcula el promedio solo en días con gastos.
  document.querySelector('#averagePerDay').textContent = money(activeDays.length ? spent / activeDays.length : 0);
  // PL: Pokaż liczbę dni z poprawną polską odmianą. | ES-CO: Muestra los días activos con el texto correcto.
  document.querySelector('#activeDaysTotal').textContent = `${activeDays.length} ${activeDays.length === 1 ? 'dzień' : 'dni'}`;
  // PL: Podaj liczbę wszystkich dni, które obejmuje plan podróży. | ES-CO: Indica la cantidad total de días del itinerario.
  document.querySelector('#activeDayCount').textContent = `z ${datesInTrip().length} dni podróży`;
  // PL: Znajdź dzień z największą sumą PLN. | ES-CO: Encuentra el día con mayor total en PLN.
  const highestDay = activeDays.reduce((highest, day) => day.total > highest.total ? day : highest, { total: 0 });
  // PL: Pokaż kwotę albo kreskę, gdy podróż nie ma jeszcze wydatków. | ES-CO: Muestra el valor o una raya si aún no hay gastos.
  document.querySelector('#highestDayTotal').textContent = highestDay.total ? money(highestDay.total) : '—';
  // PL: Podaj datę i miejsce najdroższego dnia. | ES-CO: Indica fecha y destino del día más costoso.
  document.querySelector('#highestDayLabel').textContent = highestDay.total ? `${dateLabel(highestDay.date, { day: 'numeric', month: 'short' })} · ${destinationForDate(highestDay.date)}` : 'Brak wydatków';
  // PL: Oblicz liczbę dni do początku wybranego wyjazdu. | ES-CO: Calcula los días hasta el inicio del viaje activo.
  const start = currentTrip ? new Date(`${currentTrip.startDate}T12:00:00`) : null;
  // PL: Ustaw bieżącą datę na południe, aby uniknąć błędu granicy dnia. | ES-CO: Fija la fecha actual al mediodía para evitar errores de límite.
  const today = new Date();
  // PL: Ujednolić godzinę bieżącego dnia z godziną daty podróży. | ES-CO: Iguala la hora de hoy con la hora de la fecha del viaje.
  today.setHours(12, 0, 0, 0);
  // PL: Zaokrąglij różnicę w górę do liczby pełnych dni kalendarzowych. | ES-CO: Redondea hacia arriba la diferencia a días calendario.
  const difference = start ? Math.ceil((start - today) / 86400000) : null;
  // PL: Nie wyświetlaj ujemnego odliczania po rozpoczęciu wyjazdu. | ES-CO: Evita mostrar una cuenta regresiva negativa.
  document.querySelector('#countdownNumber').textContent = difference === null ? '—' : Math.max(0, difference);
  // PL: Zmień podpis licznika przed podróżą i w jej trakcie. | ES-CO: Cambia el texto del contador antes y durante el viaje.
  document.querySelector('#countdownLabel').innerHTML = difference === null ? 'wybierz<br>podróż' : difference > 0 ? 'dni do<br>rozpoczęcia podróży' : 'dni<br>podróży';
}

// PL: Aktualizuj wykresy dzienne i kategorii wyłącznie danymi bieżącego użytkownika. | ES-CO: Actualiza gráficas solo con datos del usuario activo.
function renderCharts() {
  // PL: Pobierz wszystkie daty podróży i podsumuj każdą kategorię. | ES-CO: Obtén las fechas del viaje y suma cada categoría.
  const dates = datesInTrip();
  // PL: Oblicz sumy kategorii na podstawie kwot utrwalonych w PLN. | ES-CO: Calcula totales por categoría usando valores PLN guardados.
  const categoryTotals = expenseCategories.map((category) => expenses.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.plnAmount), 0));
  // PL: Przelicz sumę wydatków dziennie dla nagłówka wykresu. | ES-CO: Calcula el total diario para el encabezado.
  const dailyTotal = expenses.reduce((sum, item) => sum + Number(item.plnAmount), 0);
  // PL: Pokaż liczbę rekordów widocznych w bieżącym dzienniku. | ES-CO: Muestra los registros visibles en el diario actual.
  document.querySelector('#analyticsCount').textContent = `${expenses.length} wydatków`;
  // PL: Pokaż całkowitą kwotę wydatków na wykresie dziennym. | ES-CO: Muestra el total del gráfico diario.
  document.querySelector('#dailyChartTotal').textContent = money(dailyTotal);
  // PL: Pokaż tę samą sumę nad wykresem kategorii. | ES-CO: Muestra el total sobre el gráfico de categorías.
  document.querySelector('#categoryChartTotal').textContent = money(dailyTotal);
  // PL: Przełącz komunikaty pustego stanu według obecności wydatków. | ES-CO: Alterna mensajes vacíos según haya gastos.
  // PL: Ukryj canvas dzienny, dopóki użytkownik nie ma rekordów. | ES-CO: Oculta el lienzo diario mientras no haya gastos.
  document.querySelector('#dailyChart').hidden = expenses.length === 0;
  // PL: Ukryj canvas kategorii, dopóki nie ma danych do podziału. | ES-CO: Oculta el lienzo por categoría si no hay datos.
  document.querySelector('#categoryChart').hidden = expenses.length === 0;
  // PL: Pokaż lub schowaj instrukcję dla dziennego wykresu. | ES-CO: Muestra u oculta la guía del gráfico diario.
  document.querySelector('#dailyChartEmpty').hidden = expenses.length > 0;
  // PL: Ukryj komunikat koła, jeśli istnieją dane do podziału. | ES-CO: Oculta el mensaje circular cuando hay categorías.
  document.querySelector('#categoryChartEmpty').hidden = expenses.length > 0;
  // PL: Nie twórz wykresów dla ukrytego panelu niezalogowanego użytkownika. | ES-CO: No crea gráficas para el panel oculto sin sesión.
  // PL: Zniszcz ukryte instancje, aby poprawnie odtworzyć wykres po dodaniu pierwszego rekordu.
  // ES-CO: Destruye gráficos ocultos para recrearlos bien al agregar el primer gasto.
  if (!currentUser || !currentTrip || expenses.length === 0) {
    // PL: Zwolnij wykres dzienny, jeśli nie ma co rysować. | ES-CO: Libera el gráfico diario si no hay datos.
    if (dailyChart) { dailyChart.destroy(); dailyChart = null; }
    // PL: Zwolnij wykres kategorii, jeśli konto jest puste. | ES-CO: Libera el gráfico por categoría si está vacío.
    if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
    // PL: Zakończ bez tworzenia fałszywej skali dla samych zer. | ES-CO: Evita dibujar una escala engañosa de ceros.
    return;
  }
  // PL: Przygotuj po jednej serii dziennej dla każdej kategorii. | ES-CO: Prepara una serie diaria por cada categoría.
  const dailyDatasets = expenseCategories.map((category, categoryIndex) => ({
    // PL: Nazwij serię zgodnie z etykietą używaną w formularzu. | ES-CO: Nombra la serie con la etiqueta del formulario.
    label: category,
    // PL: Zsumuj kwoty PLN tej kategorii dla każdej daty podróży. | ES-CO: Suma el PLN de esta categoría para cada fecha.
    data: dates.map((date) => expenses.filter((item) => item.date === date && item.category === category).reduce((sum, item) => sum + Number(item.plnAmount), 0)),
    // PL: Użyj stałego koloru kategorii z palety aplikacji. | ES-CO: Usa un color estable de la paleta por categoría.
    backgroundColor: chartColors[categoryIndex],
    // PL: Zaokrąglij górę słupków, zachowując czytelne stosy. | ES-CO: Redondea las barras sin perder el apilado.
    borderRadius: 3,
    // PL: Nie pomijaj obramowania segmentów słupka. | ES-CO: Conserva los bordes de cada segmento.
    borderSkipped: false
  }));
  // PL: Skróć daty do etykiet dnia i miesiąca. | ES-CO: Resume las fechas en día y mes.
  const labels = dates.map((date) => dateLabel(date, { day: 'numeric', month: 'short' }));
  // PL: Utwórz wykres stosowy albo zaktualizuj istniejący. | ES-CO: Crea el gráfico apilado o actualiza el existente.
  const dailyConfig = {
    // PL: Wybierz wykres słupkowy dla porównania dni. | ES-CO: Usa barras para comparar los días.
    type: 'bar',
    // PL: Przekaż daty i wartości kategorii. | ES-CO: Pasa fechas y valores por categoría.
    data: { labels, datasets: dailyDatasets },
    // PL: Dopasuj wykres do kontenera i dodaj opisy kwot. | ES-CO: Adapta el gráfico y agrega etiquetas de importes.
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, padding: 14, font: { family: 'Quicksand', size: 9 } } }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${money(context.parsed.y)}` } } }, scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 9, font: { family: 'Quicksand', size: 9 } } }, y: { stacked: true, beginAtZero: true, ticks: { callback: (value) => `${formatter.format(value)} PLN`, font: { family: 'Quicksand', size: 9 } }, grid: { color: '#e5ecef' } } } }
  };
  // PL: Zaktualizuj istniejącą instancję, aby uniknąć nakładania canvasów. | ES-CO: Actualiza la instancia existente para no duplicar el canvas.
  if (dailyChart) { dailyChart.data = dailyConfig.data; dailyChart.update(); }
  // PL: Utwórz pierwszą instancję wykresu dziennego. | ES-CO: Crea la primera instancia del gráfico diario.
  else dailyChart = new Chart(document.querySelector('#dailyChart'), dailyConfig);
  // PL: Przygotuj serię sum według kategorii. | ES-CO: Prepara los totales agrupados por categoría.
  const categoryData = { labels: expenseCategories, datasets: [{ data: categoryTotals, backgroundColor: chartColors, borderColor: '#ffffff', borderWidth: 3, hoverOffset: 5 }] };
  // PL: Ustaw czytelny wykres pierścieniowy z legendą i wartościami PLN. | ES-CO: Configura una dona con leyenda y valores PLN.
  const categoryConfig = { type: 'doughnut', data: categoryData, options: { responsive: true, maintainAspectRatio: false, cutout: '66%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 7, padding: 12, font: { family: 'Quicksand', size: 9 } } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${money(context.parsed)}` } } } } };
  // PL: Aktualizuj koło kategorii po każdym odświeżeniu danych. | ES-CO: Actualiza la dona después de cada carga.
  if (categoryChart) { categoryChart.data = categoryData; categoryChart.update(); }
  // PL: Utwórz pierwszą instancję wykresu kategorii. | ES-CO: Crea la primera instancia del gráfico por categoría.
  else categoryChart = new Chart(document.querySelector('#categoryChart'), categoryConfig);
}

// PL: Zbuduj listę dni z sumą PLN i wykorzystaniem budżetu dziennego. | ES-CO: Construye la lista de días con totales y uso del presupuesto.
function renderDays() {
  // PL: Pokaż pierwszy import, gdy konto nie ma jeszcze wyjazdu. | ES-CO: Invita a importar el primer viaje cuando aún no existe.
  if (!currentTrip) {
    dayList.innerHTML = '<div class="empty-state"><strong>Dodaj pierwszą podróż</strong><p>Zaimportuj arkusz, aby wczytać plan dni i wydatki.</p><button class="primary-button" id="emptyImport" type="button">Importuj Excel</button></div>';
    document.querySelector('#emptyImport').addEventListener('click', () => importExcelButton.click());
    return;
  }
  // PL: Wygeneruj każdy dzień z daty, destynacji, liczby wydatków i paska budżetu. | ES-CO: Genera cada día con fecha, destino, cantidad de gastos y barra de presupuesto.
  dayList.innerHTML = datesInTrip().map((date, index) => {
    // PL: Oblicz sumę wydatków dnia. | ES-CO: Calcula el total gastado ese día.
    const total = dayTotal(date);
    // PL: Policz wydatki przypisane do dnia. | ES-CO: Cuenta los gastos asignados al día.
    const count = dayExpenses(date).length;
    // PL: Utwórz lokalny obiekt daty dla formatowania. | ES-CO: Crea la fecha local para formatearla.
    const day = new Date(`${date}T12:00:00`);
    // PL: Pobierz skróconą polską nazwę dnia tygodnia. | ES-CO: Obtén la abreviatura polaca del día de la semana.
    const weekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(day).replace('.', '');
    // PL: Pobierz skróconą polską nazwę miesiąca. | ES-CO: Obtén la abreviatura polaca del mes.
    const month = new Intl.DateTimeFormat('pl-PL', { month: 'short' }).format(day).replace('.', '');
    // PL: Ogranicz pasek do stu procent nawet po przekroczeniu budżetu. | ES-CO: Limita la barra a cien por ciento incluso si se excede el presupuesto.
    const dailyBudget = dailyBudgetForDate(date);
    const percentage = dailyBudget > 0 ? Math.min(100, Math.max(0, total / dailyBudget * 100)) : 0;
    // PL: Zwróć dostępny przycisk dnia z bezpiecznymi wartościami tekstowymi. | ES-CO: Devuelve un botón por día con valores de texto controlados.
    return `<button class="day-row${date === selectedDate ? ' selected' : ''}" type="button" data-date="${date}" aria-pressed="${date === selectedDate}"><span class="day-date"><b>${day.getDate()}</b><small>${month}</small></span><span><span class="day-place">${escapeHTML(destinationForDate(date))}</span><span class="day-week">${weekday} · ${count} ${count === 1 ? 'wydatek' : 'wydatków'}</span></span><span class="day-total"><b>${money(total)}</b><small>z ${formatter.format(dailyBudget)} PLN</small><span class="budget-track"><span style="width:${percentage}%"></span></span></span></button>`;
  }).join('');
  // PL: Obsłuż wybór dnia i odśwież jego podsumowanie bez przeładowania. | ES-CO: Maneja la selección del día y actualiza el detalle sin recargar.
  dayList.querySelectorAll('[data-date]').forEach((button) => button.addEventListener('click', () => {
    // PL: Zapamiętaj datę klikniętego przycisku. | ES-CO: Guarda la fecha del botón seleccionado.
    selectedDate = button.dataset.date;
    // PL: Odśwież zaznaczenie w liście dni. | ES-CO: Actualiza el resaltado en la lista de días.
    renderDays();
    // PL: Pokaż wydatki nowego dnia. | ES-CO: Muestra los gastos del nuevo día.
    renderExpenses();
  }));
}

// PL: Przypisz klasę koloru do rodzaju wydatku. | ES-CO: Asigna un color visual según la categoría del gasto.
function markClass(category) {
  // PL: Wyróżnij atrakcje i zakupy ciepłym kolorem. | ES-CO: Resalta atracciones y compras con un color cálido.
  if (category === 'Atrakcje' || category === 'Zakupy') return 'orange';
  // PL: Wyróżnij transport i loty kolorem niebieskim. | ES-CO: Resalta transporte y vuelos con azul.
  if (category === 'Transport' || category === 'Loty') return 'blue';
  // PL: Pozostaw pozostałe kategorie w zielonym kolorze podstawowym. | ES-CO: Mantiene las demás categorías en el color verde principal.
  return '';
}

// PL: Pokaż wydatki, budżet i pozostałe saldo wybranego dnia. | ES-CO: Muestra gastos, presupuesto y saldo restante del día.
function renderExpenses() {
  // PL: Posortuj wydatki dnia od najnowszego. | ES-CO: Ordena los gastos del día del más reciente al más antiguo.
  const current = dayExpenses(selectedDate).sort((a, b) => b.createdAt - a.createdAt);
  // PL: Zaktualizuj polski tytuł daty i destynacji. | ES-CO: Actualiza el título polaco de fecha y destino.
  if (!currentTrip || !selectedDate) {
    document.querySelector('#selectedDayTitle').textContent = 'Wybierz podróż';
    document.querySelector('#dayBudgetLabel').textContent = '0,00 PLN';
    document.querySelector('#dailyRemaining').textContent = '0,00 PLN';
    expenseList.innerHTML = '<li class="empty-state"><strong>Brak wybranej podróży</strong><p>Zaimportuj arkusz lub wybierz wyjazd z listy.</p></li>';
    return;
  }
  const dailyBudget = dailyBudgetForDate(selectedDate);
  document.querySelector('#selectedDayTitle').textContent = `${dateLabel(selectedDate)} · ${destinationForDate(selectedDate)}`;
  // PL: Pokaż zużyty budżet w relacji do limitu dnia. | ES-CO: Muestra el presupuesto usado frente al límite diario.
  document.querySelector('#dayBudgetLabel').textContent = `${formatter.format(dayTotal(selectedDate))} / ${formatter.format(dailyBudget)} PLN`;
  // PL: Wyświetl kwotę pozostałą na bieżący dzień. | ES-CO: Muestra cuánto presupuesto queda para hoy.
  document.querySelector('#dailyRemaining').textContent = money(dailyBudget - dayTotal(selectedDate));
  // PL: Pokaż podpowiedź i przycisk dodawania, jeśli dzień jest pusty. | ES-CO: Muestra una invitación a añadir un gasto si el día está vacío.
  if (!current.length) {
    // PL: Narysuj stan pusty po polsku i podłącz przycisk. | ES-CO: Renderiza el estado vacío en polaco y conecta el botón.
    expenseList.innerHTML = '<li class="empty-state"><strong>Dzień czeka na pierwszy wydatek</strong><p>Dodaj jedzenie, transport, bilety lub dowolny koszt z tego dnia.</p><button class="primary-button" id="emptyAdd" type="button">＋ Dodaj wydatek</button></li>';
    // PL: Otwórz formularz po wybraniu pustego stanu. | ES-CO: Abre el formulario al pulsar el botón del estado vacío.
    document.querySelector('#emptyAdd').addEventListener('click', openExpenseDialog);
    // PL: Zakończ, aby nie nadpisywać stanu pustego listą. | ES-CO: Termina aquí para no reemplazar el estado vacío.
    return;
  }
  // PL: Zbuduj kartę każdego wydatku z oryginalną kwotą i utrwalonym PLN. | ES-CO: Construye cada gasto con valor local y equivalente PLN guardado.
  expenseList.innerHTML = current.map((item) => {
    // PL: Pobierz pierwszą literę kategorii jako symbol wizualny. | ES-CO: Usa la inicial de la categoría como distintivo.
    const mark = (item.category || 'Inne').slice(0, 1).toUpperCase();
    // PL: Pokaż zapisaną wartość kursu na jedną jednostkę waluty. | ES-CO: Muestra la tasa guardada por unidad de moneda.
    // PL: Pokaż sześć miejsc kursu, aby małe jednostki JPY i KRW pozostały czytelne. | ES-CO: Muestra hasta seis decimales para conservar precisión en JPY y KRW.
    const rateFormatter = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    // PL: Sformatuj kurs jednostkowy w kolejności waluta lokalna do PLN. | ES-CO: Formatea la tasa unitaria de moneda local a PLN.
    const rateText = `1 ${item.currency} = ${rateFormatter.format(Number(item.rate))} PLN`;
    // PL: Zwróć escapowaną kartę z dostępnością i przyciskiem usuwania. | ES-CO: Devuelve una fila escapada con botón para eliminar.
    return `<li class="expense-item"><span class="category-mark ${markClass(item.category)}" aria-hidden="true">${escapeHTML(mark)}</span><span class="expense-copy"><span class="expense-title">${escapeHTML(item.description)}</span><span class="expense-meta">${escapeHTML(item.category)} · ${escapeHTML(item.status || 'W Podróży')} · ${escapeHTML(item.payment || 'Nie podano')}</span><span class="expense-rate">${escapeHTML(rateText)}</span></span><span class="expense-amount"><b>${money(item.plnAmount)}</b><small>${localMoney(item.amount, item.currency)}</small></span><button class="delete-button" type="button" data-delete="${escapeHTML(item.id)}" aria-label="Usuń: ${escapeHTML(item.description)}">Usuń</button></li>`;
  }).join('');
  // PL: Połącz każdy przycisk usuwania z bezpiecznym żądaniem do Supabase. | ES-CO: Conecta cada botón de eliminación con Supabase.
  expenseList.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteExpense(button.dataset.delete)));
}

// PL: Pokaż formularz i pobierz kurs dla wybranej waluty oraz daty. | ES-CO: Abre el formulario y consulta la tasa para la moneda y fecha elegidas.
function openExpenseDialog() {
  // PL: Wyczyść pola, pozostawiając domyślne wartości formularza. | ES-CO: Limpia los campos y restablece los valores predeterminados.
  expenseForm.reset();
  // PL: Ustaw status podróży jako domyślny dla nowego wydatku. | ES-CO: Usa el estado de viaje como predeterminado.
  statusInput.value = 'W Podróży';
  // PL: Ustaw datę wybranego dnia podróży. | ES-CO: Establece la fecha del día seleccionado.
  dateInput.value = selectedDate;
  // PL: Wybierz jen jako domyślną walutę japońskiego odcinka. | ES-CO: Selecciona yen como moneda inicial del viaje.
  currencyInput.value = 'JPY';
  // PL: Ukryj pole własnej waluty, jeśli pozostało widoczne po poprzednim wpisie. | ES-CO: Oculta la moneda personalizada si quedó visible.
  customCurrencyInput.hidden = true;
  // PL: Pokaż okno formularza. | ES-CO: Abre el diálogo del formulario.
  expenseDialog.showModal();
  // PL: Pobierz referencyjny kurs PLN dla jena. | ES-CO: Consulta la tasa de referencia a PLN para el yen.
  fetchRate();
  // PL: Przenieś fokus do opisu dla wygodnej obsługi klawiaturą. | ES-CO: Enfoca la descripción para facilitar el uso con teclado.
  setTimeout(() => document.querySelector('#expenseDescription').focus(), 0);
}

// PL: Ustal trzyznakowy kod waluty z listy albo pola niestandardowego. | ES-CO: Obtiene el código de tres letras de la lista o campo personalizado.
function selectedCurrencyCode() {
  // PL: Odczytaj wybraną opcję formularza. | ES-CO: Lee la opción elegida en el formulario.
  const selected = currencyInput.value;
  // PL: Użyj własnego kodu po walidacji, gdy wybrano inną walutę. | ES-CO: Usa el código personalizado cuando se eligió otra moneda.
  if (selected === 'OTHER') return customCurrencyInput.value.trim().toUpperCase();
  // PL: W przeciwnym razie zwróć kod waluty z listy. | ES-CO: Si no, devuelve el código seleccionado de la lista.
  return selected;
}

// PL: Pobierz kurs referencyjny lub pozostaw możliwość wpisania go ręcznie. | ES-CO: Consulta una tasa de referencia o permite ingresarla manualmente.
async function fetchRate() {
  // PL: Odróżnij odpowiedź bieżącego żądania od odpowiedzi starszej. | ES-CO: Identifica la solicitud actual para descartar respuestas viejas.
  const request = ++rateRequest;
  // PL: Odczytaj bieżący kod waluty. | ES-CO: Lee el código de moneda actual.
  const currency = selectedCurrencyCode();
  // PL: Ustaw kurs równy jeden dla PLN. | ES-CO: Establece la tasa en uno para PLN.
  if (currency === 'PLN') {
    // PL: Ustaw matematyczny przelicznik jeden do jednego. | ES-CO: Aplica conversión uno a uno.
    rateInput.value = '1';
    // PL: Przypisz kursowi PLN datę wybranego wydatku. | ES-CO: Asigna al cambio 1:1 la fecha del gasto.
    currentRateDate = dateInput.value;
    // PL: Wyjaśnij użytkownikowi zastosowany kurs. | ES-CO: Informa la tasa aplicada.
    document.querySelector('#rateStatus').textContent = 'Dla PLN kurs wynosi 1:1.';
    // PL: Odśwież podgląd kwoty przeliczonej. | ES-CO: Actualiza el equivalente calculado.
    updatePreview();
    // PL: Nie wywołuj API dla waluty bazowej. | ES-CO: No consulta la API para la moneda base.
    return;
  }
  // PL: Wyczyść poprzedni kurs, aby nie zapisać go dla innej waluty. | ES-CO: Borra la tasa anterior para no reutilizarla con otra moneda.
  rateInput.value = '';
  // PL: Wyczyść datę, zanim nadejdzie odpowiedź dla nowej waluty. | ES-CO: Limpia la fecha mientras llega la tasa de la nueva moneda.
  currentRateDate = null;
  // PL: Pokaż stan oczekiwania na odpowiedź. | ES-CO: Muestra que la consulta está en curso.
  document.querySelector('#rateStatus').textContent = 'Pobieranie kursu referencyjnego…';
  // PL: Pobierz datę wybranego wydatku. | ES-CO: Lee la fecha seleccionada para el gasto.
  const chosenDate = dateInput.value;
  // PL: Odczytaj dzisiejszy dzień w formacie ISO. | ES-CO: Lee la fecha actual en formato ISO.
  const today = new Date().toISOString().slice(0, 10);
  // PL: Użyj kursu historycznego dla minionego dnia albo najnowszego dla przyszłego. | ES-CO: Usa tasa histórica para fechas pasadas y la última para fechas futuras.
  const endpointDate = chosenDate && chosenDate <= today ? chosenDate : 'latest';
  // PL: Zbuduj adres Frankfurter z parametrami źródła i PLN. | ES-CO: Construye la URL de Frankfurter con moneda origen y PLN.
  const url = `https://api.frankfurter.dev/v1/${endpointDate}?base=${encodeURIComponent(currency)}&symbols=PLN`;
  // PL: Wyślij żądanie z limitem czasu, aby formularz nie czekał bez końca. | ES-CO: Envía la consulta con tiempo límite para no bloquear el formulario.
  try {
    // PL: Odczytaj odpowiedź kursową. | ES-CO: Obtén la respuesta del tipo de cambio.
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    // PL: Przerwij, jeśli serwis nie ma kursu lub zwrócił błąd. | ES-CO: Detén el proceso si el servicio no tiene tasa o falla.
    if (!response.ok) throw new Error('Nie znaleziono kursu dla tej waluty.');
    // PL: Odczytaj JSON z wartością i datą referencyjną. | ES-CO: Lee el JSON con el valor y la fecha de referencia.
    const data = await response.json();
    // PL: Ignoruj wynik, jeśli użytkownik w międzyczasie zmienił walutę. | ES-CO: Ignora el resultado si la moneda cambió durante la consulta.
    if (request !== rateRequest) return;
    // PL: Pobierz kurs PLN zwrócony dla wybranego kodu. | ES-CO: Obtén la tasa PLN devuelta para la moneda elegida.
    const rate = data.rates && data.rates.PLN;
    // PL: Wymagaj dodatniej liczby przed pokazaniem przeliczenia. | ES-CO: Exige un valor positivo antes de mostrar la conversión.
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('Nieprawidłowy kurs waluty.');
    // PL: Wpisz kurs do pola, ale pozwól na ręczną korektę. | ES-CO: Llena el campo y permite ajustar la tasa manualmente.
    rateInput.value = String(rate);
    // PL: Zachowaj rzeczywistą datę notowania zwróconą przez Frankfurter. | ES-CO: Guarda la fecha real de la tasa devuelta por Frankfurter.
    currentRateDate = data.date;
    // PL: Zapisz informację o źródle i dacie widoczną przy formularzu. | ES-CO: Informa la fuente y fecha de la tasa.
    document.querySelector('#rateStatus').textContent = `Kurs referencyjny · ${data.date}. Możesz go zmienić ręcznie.`;
  // PL: Zostaw puste pole kursu i poproś o wartość ręczną po awarii. | ES-CO: Deja la tasa vacía y solicita un valor manual si falla.
  } catch (error) {
    // PL: Nie nadpisuj formularza błędem z poprzedniego żądania. | ES-CO: No muestres errores de una consulta anterior.
    if (request !== rateRequest) return;
    // PL: Dla kursu wpisanego ręcznie przypisz dzień wybranego wydatku. | ES-CO: Para una tasa manual, usa la fecha del gasto.
    currentRateDate = chosenDate;
    // PL: Pokaż jasną instrukcję ręcznego uzupełnienia kursu. | ES-CO: Indica claramente que la tasa debe ingresarse manualmente.
    document.querySelector('#rateStatus').textContent = 'Brak kursu automatycznego. Wpisz kurs ręcznie.';
  }
  // PL: Przelicz podgląd po udanej odpowiedzi albo błędzie. | ES-CO: Recalcula la vista previa tras respuesta o error.
  updatePreview();
}

// PL: Oblicz bieżący odpowiednik PLN, nie zapisując jeszcze wydatku. | ES-CO: Calcula el equivalente PLN sin guardar todavía el gasto.
function updatePreview() {
  // PL: Odczytaj liczbę jednostek waluty źródłowej. | ES-CO: Lee el importe en la moneda original.
  const amount = Number(amountInput.value) || 0;
  // PL: Odczytaj kurs PLN za jedną jednostkę. | ES-CO: Lee la tasa PLN por unidad.
  const rate = Number(rateInput.value) || 0;
  // PL: Wyświetl wynik mnożenia obu wartości. | ES-CO: Muestra el resultado de multiplicar ambos valores.
  document.querySelector('#plnPreview').textContent = money(amount * rate);
}

// PL: Zapisz wydatek do Supabase i odśwież widok po potwierdzeniu bazy. | ES-CO: Guarda el gasto en Supabase y actualiza la vista al confirmarlo.
async function saveExpense(event) {
  // PL: Zablokuj domyślne wysłanie formularza i przeładowanie strony. | ES-CO: Evita el envío normal del formulario y la recarga.
  event.preventDefault();
  // PL: Nie pozwól zapisywać, gdy sesja wygasła albo użytkownik się wylogował. | ES-CO: Impide guardar si la sesión venció o se cerró.
  if (!currentUser || !currentTrip) { showToast('Zaloguj się i wybierz podróż, aby zapisać wydatek.'); return; }
  // PL: Odczytaj wszystkie wartości formularza. | ES-CO: Lee los valores completos del formulario.
  const data = new FormData(expenseForm);
  // PL: Zaokrąglij kwotę do dwóch miejsc zgodnie z typem NUMERIC w bazie. | ES-CO: Redondea el importe a dos decimales como en la base.
  const amount = Number(Number(data.get('amount')).toFixed(2));
  // PL: Zaokrąglij kurs do ośmiu miejsc zgodnie ze schematem. | ES-CO: Redondea la tasa a ocho decimales según el esquema.
  const rate = Number(Number(data.get('rate')).toFixed(8));
  // PL: Zachowaj właściciela rozpoczętego zapisu, aby nie pomylić sesji. | ES-CO: Guarda el usuario que inició el registro para no mezclar sesiones.
  const ownerId = currentUser.id;
  // PL: Zachowaj wyjazd formularza, aby spóźniony zapis nie trafił do innego wyjazdu. | ES-CO: Conserva el viaje del formulario para evitar asociar una respuesta tardía a otro.
  const tripId = currentTrip.id;
  // PL: Pobierz kod waluty z listy albo pola własnego. | ES-CO: Obtiene la moneda de la lista o del campo personalizado.
  const currency = selectedCurrencyCode();
  // PL: Oczyść opis przed zapisem. | ES-CO: Limpia la descripción antes de guardarla.
  const description = String(data.get('description')).trim();
  // PL: Przelicz PLN już na wartościach zaokrąglonych do formatu bazy. | ES-CO: Calcula PLN con los valores ya redondeados para la base.
  const amountPln = Number((amount * rate).toFixed(2));
  // PL: Ogranicz kwoty do zakresu kolumn NUMERIC(14,2) i NUMERIC(18,8). | ES-CO: Limita importes al rango permitido por las columnas NUMERIC.
  const fitsDatabase = amount <= 999999999999.99 && rate <= 9999999999.99999999 && amountPln <= 999999999999.99;
  // PL: Wymagaj opisu, skończonych dodatnich kwot i kodu ISO z trzech liter. | ES-CO: Exige descripción, importes válidos y código ISO de tres letras.
  if (!description || !Number.isFinite(amount) || !Number.isFinite(rate) || !Number.isFinite(amountPln) || !(amount > 0) || !(rate > 0) || !fitsDatabase || !/^[A-Z]{3}$/.test(currency)) { showToast('Sprawdź opis, kwotę, kurs i trzyznakowy kod waluty.'); return; }
  // PL: Nie pozwól wysłać drugiego zapisu podczas oczekiwania na pierwszy. | ES-CO: Impide enviar otro gasto mientras el primero sigue pendiente.
  if (savingExpense) return;
  // PL: Zablokuj formularz na czas zapisu w Supabase. | ES-CO: Bloquea el formulario mientras Supabase guarda el gasto.
  savingExpense = true;
  // PL: Wyłącz przycisk wysłania, aby nie tworzyć duplikatów. | ES-CO: Desactiva el botón para evitar duplicados.
  const submitButton = expenseForm.querySelector('button[type="submit"]');
  // PL: Pokaż stan oczekiwania bez zmiany zawartości formularza. | ES-CO: Muestra espera sin alterar el formulario.
  submitButton.disabled = true;
  // PL: Przygotuj kolumny zgodne ze schematem SQL i przypisz właściciela. | ES-CO: Prepara las columnas SQL y asigna el dueño autenticado.
  const row = { user_id: ownerId, trip_id: tripId, expense_date: String(data.get('date')), category: String(data.get('category')), description, amount_local: amount, currency_code: currency, pln_per_unit: rate, amount_pln: amountPln, payment_method: String(data.get('payment') || '') || null, rate_date: currentRateDate || String(data.get('date')), expense_status: String(data.get('status') || 'W Podróży'), source_ref: null };
  // PL: Obsłuż odpowiedź zapisu oraz wyjątki sieciowe jednym blokiem. | ES-CO: Maneja respuesta y errores de red en un solo bloque.
  try {
    // PL: Wstaw rekord i odczytaj wartości zaakceptowane przez bazę. | ES-CO: Inserta el gasto y lee los valores aceptados por la base.
    const { data: saved, error } = await supabase.from(TABLE_NAME).insert(row).select('id,user_id,trip_id,expense_date,category,description,amount_local,currency_code,pln_per_unit,amount_pln,payment_method,rate_date,expense_status,source_ref,created_at').single();
    // PL: Nie pokazuj odpowiedzi w innej sesji niż ta, która ją rozpoczęła. | ES-CO: No muestres resultados en una sesión distinta a la inicial.
    if (!currentUser || currentUser.id !== ownerId) return;
    // PL: Pozostaw formularz otwarty i pokaż błąd zwrócony przez bazę. | ES-CO: Mantén el formulario abierto y muestra el error de la base.
    if (error) { showToast('Nie udało się zapisać wydatku. Sprawdź konfigurację bazy i spróbuj ponownie.'); return; }
    // PL: Przekształć zapisany wiersz SQL do formatu używanego przez widok. | ES-CO: Convierte la fila SQL al formato de la interfaz.
    expenses.push({ id: saved.id, userId: saved.user_id, tripId: saved.trip_id, date: saved.expense_date, category: saved.category, description: saved.description, amount: Number(saved.amount_local), currency: saved.currency_code, rate: Number(saved.pln_per_unit), plnAmount: Number(saved.amount_pln), payment: saved.payment_method || '', rateDate: saved.rate_date, status: saved.expense_status || 'W Podróży', sourceRef: saved.source_ref || null, createdAt: new Date(saved.created_at).getTime() });
    // PL: Zaznacz dzień zapisanego wydatku. | ES-CO: Selecciona el día del gasto guardado.
    selectedDate = row.expense_date;
    // PL: Odśwież podsumowania, dziennik i szczegóły. | ES-CO: Actualiza resumen, diario y detalle.
    render();
    // PL: Zamknij formularz i potwierdź zapis. | ES-CO: Cierra el formulario y confirma el guardado.
    expenseDialog.close();
    // PL: Pokaż potwierdzenie po polsku. | ES-CO: Muestra la confirmación en polaco.
    showToast('Wydatek zapisany w Supabase.');
  // PL: Zgłoś błąd transportowy, który nie dotarł jako odpowiedź Supabase. | ES-CO: Informa fallas de red que no llegaron como respuesta Supabase.
  } catch (error) {
    // PL: Zachowaj formularz otwarty, aby można było ponowić próbę. | ES-CO: Mantén el formulario abierto para poder reintentar.
    showToast('Nie udało się połączyć z Supabase. Sprawdź połączenie i spróbuj ponownie.');
  // PL: Odblokuj formularz także po błędzie lub zmianie sesji. | ES-CO: Desbloquea el formulario tras error o cambio de sesión.
  } finally {
    // PL: Przywróć możliwość zapisu następnego wydatku. | ES-CO: Permite guardar el siguiente gasto.
    savingExpense = false;
    // PL: Ponownie włącz przycisk formularza. | ES-CO: Reactiva el botón del formulario.
    submitButton.disabled = false;
  }
}

// PL: Importuj wycenione pozycje z wybranego skoroszytu do konta użytkownika. | ES-CO: Importa gastos con precio del Excel a la cuenta activa.
async function importWorkbook(file) {
  // PL: Wymagaj zalogowania, ponieważ baza przypisuje każdy import do konta. | ES-CO: Exige sesión porque la base asigna cada fila a una cuenta.
  if (!currentUser) { showToast('Zaloguj się, aby zaimportować wydatki.'); return; }
  // PL: Zachowaj ID właściciela przez całą operację importu. | ES-CO: Conserva el ID del usuario durante toda la importación.
  const ownerId = currentUser.id;
  // PL: Zablokuj przycisk, aby nie rozpocząć dwóch importów naraz. | ES-CO: Desactiva el botón para evitar dos importaciones simultáneas.
  importExcelButton.disabled = true;
  // PL: Pokaż stan przetwarzania wybranego pliku. | ES-CO: Muestra el estado de procesamiento del archivo.
  document.querySelector('#syncStatus').textContent = 'Czytanie Excela…';
  // PL: Oznacz odczyt lokalny jako trwający. | ES-CO: Marca la lectura local como pendiente.
  document.querySelector('#syncStatus').classList.remove('synced');
  // PL: Obsłuż błędny plik, anulowanie i zapis w jednym bezpiecznym bloku. | ES-CO: Maneja archivo inválido, cancelación y guardado.
  try {
    // PL: Odczytaj 21 wycenionych pozycji i pomiń puste miejsca. | ES-CO: Lee gastos con importe e ignora espacios vacíos.
    // PL: Załaduj parser dopiero po wybraniu importu, nie zwiększając startowego pakietu aplikacji. | ES-CO: Carga el parser solo al importar para reducir el paquete inicial.
    const { parseExpenseWorkbook } = await import('./excel-import.js');
    // PL: Odczytaj skoroszyt lokalnie i pomiń puste pola. | ES-CO: Lee el Excel localmente e ignora celdas vacías.
    const { trip, tripDays, expenses: rows } = await parseExpenseWorkbook(file);
    // PL: Przerwij, jeśli użytkownik zdążył się wylogować lub zmienić konto. | ES-CO: Detén la operación si cambió o cerró sesión.
    if (!currentUser || currentUser.id !== ownerId) return;
    // PL: Zatrzymaj import z jasną informacją, jeśli nie ma żadnych kwot. | ES-CO: Informa si no hay valores para importar.
    if (!rows.length) { showToast('Nie znaleziono wydatków z kwotą do importu.'); return; }
    // PL: Oblicz sumę kontrolną wyświetlaną w podglądzie importu. | ES-CO: Calcula el total de control para confirmar la importación.
    const importTotal = rows.reduce((sum, item) => sum + item.amountPln, 0);
    // PL: Policz rekordy według oryginalnego statusu. | ES-CO: Cuenta registros por su estado original.
    const paidCount = rows.filter((item) => item.status === 'Opłacone').length;
    // PL: Policz rezerwacje płatne dopiero w hotelu. | ES-CO: Cuenta reservas que se pagan en el hotel.
    const hotelCount = rows.filter((item) => item.status === 'Płatne w Hotelu').length;
    // PL: Pokaż liczbę, sumę i rozkład statusów przed zapisem. | ES-CO: Confirma cantidad, total y estados antes de guardar.
    const confirmed = window.confirm(`Importować podróż „${trip.name}” z ${tripDays.length} dniami i ${rows.length} wydatkami o łącznej wartości ${money(importTotal)}?\n\n${paidCount} opłaconych · ${hotelCount} płatnych w hotelu.\nPuste miejsca i pozycje bez kwoty zostaną pominięte.`);
    // PL: Nie zapisuj niczego, jeśli użytkownik anuluje podgląd. | ES-CO: No guarda filas si se cancela la confirmación.
    if (!confirmed) { document.querySelector('#syncStatus').textContent = `Wczytano ${expenses.length} wydatków`; document.querySelector('#syncStatus').classList.add('synced'); return; }
    // PL: Pokaż oczekiwanie na zapis w bazie. | ES-CO: Muestra que los registros se están enviando a la base.
    document.querySelector('#syncStatus').textContent = 'Importowanie…';
    // PL: Utwórz albo zaktualizuj podróż z prywatnymi ustawieniami arkusza. | ES-CO: Crea o actualiza el viaje con la configuración privada del Excel.
    const { data: savedTrip, error: tripError } = await supabase.from('trips').upsert({ user_id: ownerId, name: trip.name, start_date: trip.startDate, end_date: trip.endDate, daily_budget_pln: trip.dailyBudgetPln, available_before_trip_pln: trip.availableBeforeTripPln, source_ref: trip.sourceRef }, { onConflict: 'user_id,source_ref' }).select('id').single();
    if (!currentUser || currentUser.id !== ownerId) return;
    if (tripError) { showToast('Nie udało się zapisać podróży. Sprawdź migrację multi-trip w Supabase.'); document.querySelector('#syncStatus').textContent = 'Import nieudany'; return; }
    const tripId = savedTrip.id;
    // PL: Zapisz plan dni przed wydatkami, aby każdy rekord wskazywał istniejącą podróż. | ES-CO: Guarda días antes de los gastos para que cada fila apunte a un viaje existente.
    const dayPayload = tripDays.map((day) => ({ user_id: ownerId, trip_id: tripId, trip_date: day.tripDate, destination: day.destination, country: day.country, daily_budget_pln: day.dailyBudgetPln }));
    const { error: daysError } = await supabase.from('trip_days').upsert(dayPayload, { onConflict: 'trip_id,trip_date' });
    if (!currentUser || currentUser.id !== ownerId) return;
    if (daysError) { showToast('Nie udało się zapisać planu dni. Sprawdź migrację multi-trip w Supabase.'); document.querySelector('#syncStatus').textContent = 'Import nieudany'; return; }
    // PL: Przypisz wcześniej zaimportowane rekordy bez duplikowania ich ani zmiany kwot. | ES-CO: Asocia gastos existentes sin duplicarlos ni cambiar importes.
    const sourceRefs = rows.map((item) => item.sourceRef);
    const { error: attachError } = await supabase.from(TABLE_NAME).update({ trip_id: tripId }).eq('user_id', ownerId).is('trip_id', null).in('source_ref', sourceRefs);
    if (!currentUser || currentUser.id !== ownerId) return;
    if (attachError) { showToast('Nie udało się przypisać istniejących wydatków do podróży.'); document.querySelector('#syncStatus').textContent = 'Import nieudany'; return; }
    // PL: Przypisz nowe wiersze do wyjazdu i zachowaj ich źródło oraz status. | ES-CO: Asigna filas nuevas al viaje conservando origen y estado.
    const payload = rows.map((item) => ({ user_id: ownerId, trip_id: tripId, expense_date: item.expenseDate, category: item.category, description: item.description, amount_local: item.amountLocal, currency_code: item.currencyCode, pln_per_unit: item.plnPerUnit, amount_pln: item.amountPln, payment_method: item.payment, rate_date: item.expenseDate, expense_status: item.status, source_ref: item.sourceRef }));
    // PL: Wstawiaj wyłącznie nowe źródła; istniejące wiersze z Excela pozostaw bez zmian. | ES-CO: Inserta solo filas nuevas y conserva las ya importadas.
    const { data, error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: 'user_id,source_ref', ignoreDuplicates: true }).select('id');
    // PL: Odrzuć odpowiedź, jeśli w trakcie zapisu zmieniło się konto. | ES-CO: Descarta la respuesta si cambió la cuenta durante el guardado.
    if (!currentUser || currentUser.id !== ownerId) return;
    // PL: Pokaż błąd konfiguracji kolumn lub indeksu bez utraty oryginalnych danych. | ES-CO: Muestra el error de columnas o índice sin alterar datos previos.
    if (error) { showToast('Nie udało się zaimportować. Uruchom migrację Excel w Supabase i spróbuj ponownie.'); document.querySelector('#syncStatus').textContent = 'Import nieudany'; return; }
    // PL: Pobierz ponownie rekordy, aby odświeżyć statystyki i wykresy. | ES-CO: Vuelve a cargar los registros para actualizar gráficos y totales.
    currentTrip = { id: tripId };
    await loadTrips();
    // PL: Poinformuj, ile wierszy dodano, a ile pominięto jako duplikaty. | ES-CO: Informa cuántas filas se agregaron y cuántas eran duplicadas.
    showToast(`Zaimportowano ${data?.length || 0} nowych wydatków; ${rows.length - (data?.length || 0)} już istniało.`);
  // PL: Pokaż błąd pliku lub połączenia bez technicznego stack trace. | ES-CO: Muestra error de archivo o conexión sin detalles internos.
  } catch (error) {
    // PL: Przywróć komunikat synchronizacji po nieudanej próbie. | ES-CO: Restaura el estado de sincronización si falla.
    document.querySelector('#syncStatus').textContent = 'Import nieudany';
    // PL: Podaj prostą wskazówkę wyboru prawidłowego skoroszytu. | ES-CO: Indica cómo escoger un Excel válido.
    showToast(error instanceof Error ? `Nie udało się odczytać Excela: ${error.message}` : 'Nie udało się odczytać pliku Excel.');
  // PL: Odblokuj import i wyczyść nazwę pliku po każdym wyniku. | ES-CO: Reactiva el botón y limpia el selector al terminar.
  } finally {
    // PL: Pozwól uruchomić import ponownie. | ES-CO: Permite volver a importar.
    importExcelButton.disabled = false;
    // PL: Umożliw ponowne wybranie tego samego pliku. | ES-CO: Permite escoger otra vez el mismo archivo.
    excelFileInput.value = '';
  }
}

// PL: Usuń wskazany rekord w bazie dopiero po potwierdzeniu żądania. | ES-CO: Elimina el registro de la base al confirmar la solicitud.
async function deleteExpense(id) {
  // PL: Wymagaj aktywnej sesji przed próbą usunięcia. | ES-CO: Exige sesión activa antes de eliminar.
  if (!currentUser) return;
  // PL: Zachowaj właściciela, aby nie zastosować spóźnionej odpowiedzi do innej sesji. | ES-CO: Guarda el dueño para no aplicar respuestas tardías a otra sesión.
  const ownerId = currentUser.id;
  // PL: Usuń tylko własny wiersz i poproś o potwierdzenie usuniętego ID. | ES-CO: Borra solo el gasto propio y solicita confirmar el ID eliminado.
  const { data: deleted, error } = await supabase.from(TABLE_NAME).delete().eq('id', id).eq('user_id', ownerId).select('id').maybeSingle();
  // PL: Zignoruj wynik po wylogowaniu lub zmianie użytkownika. | ES-CO: Ignora el resultado si se cerró sesión o cambió el usuario.
  if (!currentUser || currentUser.id !== ownerId) return;
  // PL: Zachowaj rekord na ekranie, jeśli Supabase odrzuci usunięcie. | ES-CO: Conserva el gasto visible si Supabase rechaza la eliminación.
  if (error) { showToast('Nie udało się usunąć wydatku. Spróbuj ponownie.'); return; }
  // PL: Odśwież listę, jeśli wiersz usunęła równolegle inna karta. | ES-CO: Actualiza la lista si otra pestaña borró el gasto antes.
  if (!deleted) { await loadExpenses(); showToast('Wydatek został już usunięty.'); return; }
  // PL: Usuń rekord z lokalnego stanu po odpowiedzi sukcesu. | ES-CO: Quita el gasto del estado local tras confirmar el éxito.
  expenses = expenses.filter((item) => item.id !== id);
  // PL: Przelicz podsumowanie i listy po usunięciu. | ES-CO: Recalcula el resumen y las listas después de eliminar.
  render();
  // PL: Poinformuj o zakończeniu operacji. | ES-CO: Confirma que terminó la operación.
  showToast('Wydatek usunięty.');
}

// PL: Eksportuj widoczne dane właściciela do pliku CSV z separatorem zgodnym z arkuszem. | ES-CO: Exporta los gastos del usuario a CSV compatible con hojas de cálculo.
function exportCSV() {
  // PL: Zdefiniuj polskie nagłówki zachowujące obie waluty i kurs. | ES-CO: Define encabezados polacos que conservan valor local y tasa.
  const headers = ['data', 'kategoria', 'opis', 'kwota_lokalna', 'waluta', 'kurs_pln', 'kwota_pln', 'status', 'platnosc', 'data_kursu'];
  // PL: Zbuduj wiersze na podstawie wydatków pobranych z Supabase. | ES-CO: Construye filas con los gastos consultados en Supabase.
  const rows = expenses.map((item) => [item.date, item.category, item.description, item.amount, item.currency, item.rate, item.plnAmount, item.status || 'W Podróży', item.payment || '', item.rateDate || '']);
  // PL: Cytuj pola i użyj średnika, aby polski Excel poprawnie odczytał kolumny. | ES-CO: Cita campos y usa punto y coma para abrir bien en Excel polaco.
  const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
  // PL: Dodaj BOM UTF-8 dla poprawnych polskich znaków w Excelu. | ES-CO: Agrega BOM UTF-8 para conservar caracteres polacos en Excel.
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  // PL: Utwórz tymczasowy adres pobierania pliku. | ES-CO: Crea una URL temporal para descargar el archivo.
  const url = URL.createObjectURL(blob);
  // PL: Przygotuj niewidoczny link do rozpoczęcia pobierania. | ES-CO: Prepara un enlace invisible para iniciar la descarga.
  const link = document.createElement('a');
  // PL: Przypisz plik i nazwę eksportu. | ES-CO: Asigna el archivo y el nombre de exportación.
  link.href = url;
  // PL: Ustaw polską nazwę pobieranego pliku. | ES-CO: Define el nombre polaco del archivo descargado.
  link.download = 'wydatki-podrozne.csv';
  // PL: Uruchom pobieranie przez kliknięcie linku. | ES-CO: Inicia la descarga haciendo clic en el enlace.
  link.click();
  // PL: Zwolnij tymczasowy adres po rozpoczęciu pobierania. | ES-CO: Libera la URL temporal después de iniciar la descarga.
  URL.revokeObjectURL(url);
}

// PL: Pokaż krótkie powiadomienie i automatycznie je schowaj. | ES-CO: Muestra un aviso breve y lo oculta automáticamente.
function showToast(message) {
  // PL: Pobierz wspólny element statusu aplikacji. | ES-CO: Obtén el elemento de estado compartido.
  const toast = document.querySelector('#toast');
  // PL: Ustaw tekst bez interpretowania go jako HTML. | ES-CO: Asigna el texto sin interpretarlo como HTML.
  toast.textContent = message;
  // PL: Pokaż powiadomienie. | ES-CO: Muestra el aviso.
  toast.classList.add('visible');
  // PL: Anuluj poprzednie ukrycie, jeśli pojawił się nowy komunikat. | ES-CO: Cancela el temporizador anterior si llegó otro mensaje.
  clearTimeout(toastTimer);
  // PL: Schowaj powiadomienie po trzech sekundach. | ES-CO: Oculta el aviso después de tres segundos.
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// PL: Uwierzytelnij konto Supabase za pomocą emaila i hasła. | ES-CO: Autentica la cuenta de Supabase con correo y contraseña.
loginForm.addEventListener('submit', async (event) => {
  // PL: Zablokuj standardowe wysłanie formularza i przeładowanie strony. | ES-CO: Evita el envío tradicional y la recarga.
  event.preventDefault();
  // PL: Odczytaj email i hasło bez modyfikowania samego hasła. | ES-CO: Lee el correo y la contraseña sin alterar esta última.
  const credentials = new FormData(loginForm);
  // PL: Usuń przypadkowe spacje z początku i końca emaila. | ES-CO: Quita espacios sobrantes al inicio y final del correo.
  const email = String(credentials.get('email')).trim();
  // PL: Zachowaj wszystkie znaki hasła, w tym spacje. | ES-CO: Conserva todos los caracteres de la contraseña.
  const password = String(credentials.get('password'));
  // PL: Pobierz przycisk, aby zablokować ponowne wysłanie formularza. | ES-CO: Obtén el botón para evitar envíos duplicados.
  const loginButton = loginForm.querySelector('button[type="submit"]');
  // PL: Wyłącz przycisk na czas sprawdzania poświadczeń. | ES-CO: Desactiva el botón mientras se validan las credenciales.
  loginButton.disabled = true;
  // PL: Poinformuj o rozpoczęciu uwierzytelniania. | ES-CO: Informa que comenzó la autenticación.
  document.querySelector('#loginStatus').textContent = 'Logowanie…';
  // PL: Obsłuż odpowiedź Supabase i błędy transportowe. | ES-CO: Maneja la respuesta de Supabase y errores de conexión.
  try {
    // PL: Wymień email i hasło na sesję Supabase Auth. | ES-CO: Intercambia correo y contraseña por una sesión de Supabase Auth.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    // PL: Pokaż ogólny błąd poświadczeń lub prośbę o potwierdzenie emaila. | ES-CO: Muestra credenciales inválidas o correo sin confirmar.
    if (error) {
      // PL: Nie ujawniaj, czy konto o podanym emailu istnieje. | ES-CO: No reveles si existe una cuenta con ese correo.
      const message = error.code === 'email_not_confirmed' ? 'Potwierdź adres email w Supabase.' : error.code === 'invalid_credentials' ? 'Nieprawidłowy email lub hasło.' : 'Nie udało się zalogować. Sprawdź połączenie i spróbuj ponownie.';
      // PL: Pokaż komunikat i zakończ obsługę błędnego logowania. | ES-CO: Muestra el mensaje y termina el intento fallido.
      document.querySelector('#loginStatus').textContent = message;
      // PL: Nie wykonuj komunikatu sukcesu po błędzie. | ES-CO: No muestres éxito después de un error.
      return;
    }
    // PL: Potwierdź sukces; nasłuch Auth przełączy widok po utworzeniu sesji. | ES-CO: Confirma el acceso; el listener cambiará la vista.
    document.querySelector('#loginStatus').textContent = 'Zalogowano. Wczytywanie wydatków…';
  // PL: Pokaż prosty komunikat przy nieoczekiwanym błędzie sieci. | ES-CO: Muestra un mensaje sencillo ante fallas inesperadas.
  } catch (error) {
    // PL: Ogranicz szczegóły błędu do czytelnego komunikatu użytkownika. | ES-CO: Reduce los detalles técnicos a un mensaje legible.
    document.querySelector('#loginStatus').textContent = 'Nie udało się połączyć z Supabase. Sprawdź połączenie i spróbuj ponownie.';
  // PL: Ponownie włącz przycisk zarówno po sukcesie, jak i błędzie. | ES-CO: Reactiva el botón tanto al tener éxito como al fallar.
  } finally {
    // PL: Przywróć możliwość ponownego logowania. | ES-CO: Permite volver a intentar el acceso.
    loginButton.disabled = false;
  }
});

// PL: Zmień widoczność pola własnej waluty po zmianie wyboru. | ES-CO: Muestra o esconde el campo de moneda personalizada.
currencyInput.addEventListener('change', () => {
  // PL: Pokaż pole kodu waluty tylko dla opcji „inna”. | ES-CO: Muestra el campo del código solo para la opción “otra”.
  customCurrencyInput.hidden = currencyInput.value !== 'OTHER';
  // PL: Pobierz kurs dla aktualnie wybranego kodu. | ES-CO: Consulta la tasa para el código elegido.
  fetchRate();
});
// PL: Pobierz kurs po zatwierdzeniu trzyznakowego kodu własnej waluty. | ES-CO: Consulta la tasa al confirmar el código personalizado de tres letras.
customCurrencyInput.addEventListener('change', fetchRate);
// PL: Odśwież kurs historyczny po zmianie dnia. | ES-CO: Actualiza la tasa histórica al cambiar la fecha.
dateInput.addEventListener('change', fetchRate);
// PL: Aktualizuj podgląd po wpisaniu kwoty. | ES-CO: Actualiza la vista previa al ingresar el importe.
amountInput.addEventListener('input', updatePreview);
// PL: Zapisz datę wydatku jako datę kursu ręcznie zmienionego przez użytkownika. | ES-CO: Al editar la tasa a mano, guarda la fecha del gasto como fecha de cambio.
rateInput.addEventListener('input', () => {
  // PL: Przypisz ręcznie poprawionemu kursowi dzień bieżącego wydatku. | ES-CO: Asigna al cambio ajustado a mano la fecha del gasto.
  currentRateDate = dateInput.value;
  // PL: Przelicz podgląd po każdej zmianie wartości kursu. | ES-CO: Recalcula la vista previa después de cambiar la tasa.
  updatePreview();
});
// PL: Przekaż wysłanie formularza wydatku do funkcji asynchronicznego zapisu. | ES-CO: Dirige el envío del gasto a la función de guardado.
expenseForm.addEventListener('submit', saveExpense);
// PL: Przełącz aktywny wyjazd i pobierz wyłącznie jego dziennik. | ES-CO: Cambia el viaje activo y consulta solo sus gastos.
tripSelector.addEventListener('change', async () => {
  // PL: Wybierz rekord podróży znany bieżącej sesji. | ES-CO: Selecciona un viaje visible para esta sesión.
  currentTrip = trips.find((trip) => trip.id === tripSelector.value) || null;
  // PL: Ustaw pierwszą lub dzisiejszą datę w nowym wyjeździe. | ES-CO: Selecciona la fecha inicial o de hoy del nuevo viaje.
  selectedDate = initialSelectedDate();
  // PL: Wyczyść wydatki poprzedniego wyjazdu przed ponownym odczytem. | ES-CO: Limpia gastos del viaje anterior antes de consultar.
  expenses = [];
  // PL: Zaktualizuj nagłówek i pokaż stan ładowania. | ES-CO: Actualiza el encabezado y muestra carga.
  render();
  // PL: Pobierz wiersze przypisane do nowego trip_id. | ES-CO: Consulta filas asociadas al nuevo trip_id.
  await loadExpenses();
});
// PL: Otwórz formularz z górnego przycisku. | ES-CO: Abre el formulario desde el botón superior.
document.querySelector('#openExpense').addEventListener('click', openExpenseDialog);
// PL: Otwórz formularz także ze stanu pustego. | ES-CO: Abre el formulario también desde el estado vacío.
document.querySelector('#closeDialog').addEventListener('click', () => expenseDialog.close());
// PL: Zamknij formularz po kliknięciu anulowania. | ES-CO: Cierra el formulario al pulsar cancelar.
document.querySelector('#cancelDialog').addEventListener('click', () => expenseDialog.close());
// PL: Pobierz raport CSV z danymi załadowanymi dla użytkownika. | ES-CO: Descarga el CSV con los gastos cargados del usuario.
document.querySelector('#exportButton').addEventListener('click', exportCSV);
// PL: Otwórz lokalny wybór pliku po naciśnięciu przycisku importu. | ES-CO: Abre el selector local al pulsar importar.
importExcelButton.addEventListener('click', () => {
  // PL: Wymagaj sesji przed importem danych do konta. | ES-CO: Exige sesión para importar a una cuenta.
  if (!currentUser) { showToast('Zaloguj się, aby zaimportować wydatki.'); return; }
  // PL: Otwórz natywny selektor plików urządzenia. | ES-CO: Abre el selector de archivos del dispositivo.
  excelFileInput.click();
});
// PL: Przekaż wybrany skoroszyt do importera po lokalnym odczycie. | ES-CO: Envía el Excel seleccionado al importador local.
excelFileInput.addEventListener('change', () => {
  // PL: Odczytaj pierwszy wybrany plik. | ES-CO: Lee el primer archivo seleccionado.
  const file = excelFileInput.files?.[0];
  // PL: Uruchom import tylko wtedy, gdy użytkownik wybrał plik. | ES-CO: Inicia la importación solo si se seleccionó un archivo.
  if (file) importWorkbook(file);
});
// PL: Zakończ sesję po kliknięciu przycisku wylogowania. | ES-CO: Cierra la sesión al pulsar el botón correspondiente.
document.querySelector('#signOutButton').addEventListener('click', async () => {
  // PL: Poproś Supabase o wylogowanie i pokaż ewentualny błąd. | ES-CO: Solicita cerrar sesión y muestra cualquier error.
  const { error } = await supabase.auth.signOut();
  // PL: Zachowaj ekran, jeśli wylogowanie nie powiodło się. | ES-CO: Mantiene la pantalla si el cierre de sesión falla.
  if (error) showToast('Nie udało się wylogować. Spróbuj ponownie.');
});
// PL: Zareaguj na kliknięcie tła okna dialogowego. | ES-CO: Maneja el clic sobre el fondo del diálogo.
expenseDialog.addEventListener('click', (event) => { if (event.target === expenseDialog) expenseDialog.close(); });

// PL: Nasłuchuj zmian logowania, wygaśnięcia tokenu i wylogowania. | ES-CO: Escucha cambios de acceso, vencimiento del token y cierre de sesión.
supabase.auth.onAuthStateChange((_event, session) => {
  // PL: Zapamiętaj zdarzenie, jeśli odczyt początkowej sesji nadal trwa. | ES-CO: Guarda el evento si la lectura de sesión inicial sigue pendiente.
  if (!authInitialized) { pendingAuthSession = session; hasPendingAuthEvent = true; return; }
  // PL: Odłóż operacje asynchroniczne, aby nie blokować wewnętrznego klienta Auth. | ES-CO: Aplaza la tarea asíncrona para no bloquear el cliente Auth.
  queueMicrotask(async () => {
    // PL: Podmień aktualnego właściciela na użytkownika z nowej sesji. | ES-CO: Reemplaza el usuario activo por el de la nueva sesión.
    currentUser = session?.user || null;
    // PL: Wyczyść prywatne wydatki od razu po wylogowaniu. | ES-CO: Borra gastos privados inmediatamente al cerrar sesión.
    if (!currentUser) { trips = []; currentTrip = null; expenses = []; }
    // PL: Zmień widoczność aplikacji zgodnie z nową sesją. | ES-CO: Cambia la vista según la sesión nueva.
    renderAuthState();
    // PL: Pobierz dane użytkownika po zalogowaniu albo wyczyść widok. | ES-CO: Carga los datos al entrar o limpia la pantalla al salir.
    if (currentUser) await loadTrips(); else { renderTripSelector(); render(); }
  });
});

// PL: Odczytaj zapisaną sesję asynchronicznie po załadowaniu modułu. | ES-CO: Lee la sesión guardada de forma asíncrona al cargar el módulo.
async function initializeAuth() {
  // PL: Pobierz bieżącą sesję z bezpiecznego magazynu Supabase Auth. | ES-CO: Recupera la sesión actual del almacenamiento seguro de Supabase Auth.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  // PL: Pokaż błąd sesji bez ujawniania prywatnych danych. | ES-CO: Informa un error de sesión sin exponer datos privados.
  if (sessionError) showToast('Nie udało się odczytać sesji. Zaloguj się ponownie.');
  // PL: Zachowaj użytkownika, jeśli token sesji jest nadal ważny. | ES-CO: Conserva el usuario si el token de sesión sigue vigente.
  // PL: Preferuj nowsze zdarzenie z innej karty, jeśli przyszło podczas odczytu. | ES-CO: Prefiere el evento más reciente de otra pestaña si llegó durante la lectura.
  currentUser = hasPendingAuthEvent ? pendingAuthSession?.user || null : sessionData.session?.user || null;
  // PL: Od tego miejsca obsługuj nowe zdarzenia Auth. | ES-CO: Desde aquí procesa nuevos eventos de autenticación.
  authInitialized = true;
  // PL: Pokaż wyłącznie widok pasujący do stanu logowania. | ES-CO: Muestra solo la vista correspondiente al acceso.
  renderAuthState();
  // PL: Pobierz wiersze wyłącznie dla uwierzytelnionego użytkownika. | ES-CO: Consulta filas solo para el usuario autenticado.
  if (currentUser) await loadTrips();
  // PL: Narysuj stan pusty po zalogowaniu lub wyświetl ekran dostępu. | ES-CO: Renderiza el diario vacío o deja visible el acceso.
  else render();
}

// PL: Uruchom odczyt sesji bez top-level await, aby wspierać szersze przeglądarki. | ES-CO: Inicia la sesión sin await de nivel superior para ampliar compatibilidad.
initializeAuth();
