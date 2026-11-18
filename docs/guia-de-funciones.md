# Guía de funciones y conexiones

Este documento describe las 75 funciones con nombre de `src/main.js` y los helpers de los módulos auxiliares, además de cómo colaboran. No enumera callbacks anónimos de listeners línea por línea; explica los eventos principales en su propia sección.

## Cómo leer los diagramas

Los diagramas muestran responsabilidades y llamadas principales, no cada instrucción interna:

- [Mapa maestro de todo el recorrido](./flujo-completo.svg): conecta publicación, autenticación, carga, pantallas, gastos, reservas, mapas e historia.
- [Vista general de arquitectura](./arquitectura.svg): navegador, publicación estática, Supabase y servicios externos.
- [Arranque y renderizado](./flujo-arranque.svg): autenticación, carga inicial y actualización de las vistas.
- [Gastos y archivos](./flujo-gastos.svg): creación y edición de gastos, conversión monetaria y exportación.
- [Historia y mapas](./flujo-historial.svg): datos personales de viaje, ubicaciones, vuelos y mapas.
- [Archivo Draw.io editable](./funcionamiento.drawio): contiene el mapa maestro y los tres flujos detallados en pestañas separadas.

Abre el archivo Draw.io en [diagrams.net](https://app.diagrams.net/) para cambiar de pestaña, ampliar el contenido y editar las formas.

## Componentes principales

| Componente | Responsabilidad |
|---|---|
| `index.html` | Estructura de la SPA y elementos donde JavaScript dibuja la interfaz. |
| `src/main.js` | Coordina estado en memoria, autenticación, lecturas/escrituras, eventos, pantallas y mapas. |
| `src/daily-location-ranges.js` | Agrupa registros diarios de ubicaciones en estancias por país. |
| `src/stay-expenses.js` | Calcula gastos de estancia y excluye categorías de transporte donde corresponde. |
| `src/excel-import.js` | Interpreta filas de hojas de cálculo para convertirlas en datos de gastos. |
| `src/country-flag-assets.js` | Relaciona códigos de países con los recursos de banderas locales. |
| Supabase | Proporciona autenticación, PostgreSQL y la API REST automática que usa el cliente. |
| Frankfurter | Proporciona tasas de referencia cuando se convierte una moneda a PLN. |
| Leaflet / OpenStreetMap / Turf | Dibujan mapas, mosaicos de mapa y rutas aproximadas entre coordenadas. |

No hay un servidor API propio en el repositorio. Las llamadas `supabase.from(... )` usan la API de datos que Supabase genera sobre PostgreSQL.

## Recorrido principal de la aplicación

1. `initializeAuth()` consulta la sesión guardada en Supabase Auth y `renderAuthState()` refleja el estado de acceso.
2. El listener de cambios de autenticación procesa inicio/cierre de sesión. Con una sesión válida, `loadTrips()` consulta viajes y días.
3. La carga inicial obtiene también las reservas y los datos de historia personal disponibles. Después elige el viaje y la fecha seleccionados.
4. `loadExpenses()` carga los gastos de ese contexto. Los datos se mantienen en el estado del navegador mientras se renderizan las vistas.
5. `render()` actualiza selectores, resumen, gráficos, días, gastos, reservas y las páginas que correspondan.
6. Las acciones de la persona —guardar, marcar pagado, eliminar, navegar o cambiar filtros— actualizan Supabase o el estado de interfaz y vuelven a renderizar la parte afectada.

## Catálogo de funciones de `src/main.js`

Los nombres se mantienen como aparecen en el código. Las descripciones resumen su papel y las conexiones más importantes.

### Inicio, autenticación y datos

| Función | Qué hace y con qué se conecta |
|---|---|
| `initializeAuth()` | Obtiene la sesión existente de Supabase Auth e inicia la presentación correspondiente. |
| `renderAuthState()` | Muestra la pantalla de acceso o la aplicación según la sesión. |
| `loadTrips()` | Consulta viajes y días; después prepara reservas, historia personal y contexto seleccionado. |
| `loadTripReservations()` | Lee reservas del viaje y prepara su vista previa en caché. |
| `loadPersonalDailyLocations()` | Consulta ubicaciones personales diarias usadas por la vista de países y mapas. |
| `loadPersonalTravelHistory()` | Carga los conjuntos de datos de historia personal disponibles. |
| `loadExpenses()` | Consulta gastos para el viaje y día seleccionados. |
| `render()` | Orquesta el redibujado de las vistas a partir del estado actual. |
| `renderTripSelector()` | Dibuja el selector de viaje y conserva la selección. |
| `renderTripContext()` | Muestra el destino y el contexto del viaje activo. |
| `reservationCacheKey()` | Construye la clave para identificar una vista previa de reservas en caché. |
| `cacheReservationPreview()` | Guarda localmente una vista previa de reservas. |
| `readReservationPreview()` | Recupera la vista previa local cuando está disponible. |
| `clearReservationPreview()` | Elimina la vista previa local de reservas. |
| `showToast()` | Presenta avisos temporales de resultado o error en la interfaz. |

### Gastos, moneda y gráficos

| Función | Qué hace y con qué se conecta |
|---|---|
| `renderSummary()` | Dibuja los totales y métricas del contexto activo. |
| `renderCharts()` | Genera los gráficos de gastos y sus controles. |
| `setCategoryChartCenter()` | Actualiza el contenido central del gráfico por categoría. |
| `renderDays()` | Dibuja los días del viaje y sus totales asociados. |
| `renderExpenses()` | Dibuja la lista de gastos del día seleccionado. |
| `markClass()` | Determina la clase visual asociada a un marcador o estado de gasto. |
| `openExpenseDialog()` | Abre el formulario para registrar un gasto nuevo. |
| `openEditExpenseDialog()` | Abre el formulario precargado para editar un gasto existente. |
| `selectedCurrencyCode()` | Obtiene el código monetario elegido en el formulario. |
| `fetchRate()` | Obtiene una tasa de conversión a PLN desde Frankfurter cuando hace falta. PLN usa tasa uno a uno. |
| `updatePreview()` | Actualiza la vista previa del importe convertido en el formulario. |
| `saveExpense()` | Valida y guarda un gasto en Supabase; después actualiza la vista. |
| `markExpensePaid()` | Cambia el estado de pago del gasto persistido. |
| `deleteExpense()` | Elimina el gasto seleccionado tras la confirmación correspondiente. |
| `importWorkbook()` | Procesa un libro de hojas de cálculo usando `parseExpenseWorkbook()`. No se encontró un control actual de interfaz que inicie esta importación. |
| `exportCSV()` | Convierte los gastos del contexto en un archivo CSV descargable. |

### Navegación, reservas y detalle diario

| Función | Qué hace y con qué se conecta |
|---|---|
| `renderReservations()` | Dibuja las reservas del viaje; puede montar sus mapas de ruta. |
| `normalizeReservationText()` | Normaliza texto de reservas para comparar o mostrar valores de forma consistente. |
| `showOverview()` | Navega a la vista general del viaje. |
| `showReservations()` | Abre la página de reservas y solicita su renderizado. |
| `showPersonalHistoryPage()` | Abre la página de historia personal. |
| `showPersonalHistory()` | Actualiza la presentación de historia personal. |
| `showPolandHistory()` | Muestra el resumen y análisis de tiempo en Polonia. |
| `showCountriesHistory()` | Muestra ubicaciones agrupadas por país y fecha. |
| `openDayPage()` | Abre el detalle de una fecha concreta. |
| `selectDay()` | Cambia el día activo y carga sus gastos. |
| `moveDay()` | Navega al día anterior o siguiente dentro del viaje. |
| `renderDayPage()` | Dibuja los datos del día, incluyendo el mapa aproximado si hay coordenadas. |

### Historia personal y mapas

| Función | Qué hace y con qué se conecta |
|---|---|
| `historyCountryFlag()` | Obtiene la bandera asociada a un país en la historia. |
| `historyFlightTime()` | Formatea la hora asociada a un vuelo histórico. |
| `historyFlightDate()` | Formatea la fecha de un vuelo histórico. |
| `historyFlightAirline()` | Resuelve el nombre o símbolo de la aerolínea. |
| `historyAirportName()` | Resuelve el nombre de aeropuerto desde los datos locales de aeropuertos. |
| `renderPersonalHistory()` | Ensambla los paneles de historia personal. |
| `renderDailyLocations()` | Dibuja ubicaciones por fecha, filtros y rangos de estancia. |
| `renderPolandTime()` | Dibuja métricas históricas y previsiones relacionadas con Polonia. |
| `renderPersonalFlights()` | Dibuja la lista de vuelos con filtros; puede activar los mapas de vuelos. |
| `closePersonalFlightMaps()` | Cierra o desmonta los mapas de vuelos personales. |
| `mountPersonalFlightMap()` | Crea un mapa Leaflet para un vuelo y sus coordenadas. |
| `renderPersonalFlightMaps()` | Prepara los mapas asociados a los vuelos visibles. |
| `clearFlightRouteMaps()` | Limpia mapas y recursos Leaflet de rutas de reservas. |
| `renderFlightRouteMaps()` | Dibuja rutas de vuelos de reservas usando coordenadas disponibles. |

### Formato, fechas, localización y cálculos auxiliares

| Función | Qué hace y con qué se conecta |
|---|---|
| `colorizedAirlineIcon()` | Genera el icono visual de una aerolínea. |
| `datesInTrip()` | Enumera las fechas incluidas en un viaje. |
| `initialSelectedDate()` | Determina qué fecha seleccionar al abrir un viaje. |
| `destinationForDate()` | Obtiene el destino de una fecha a partir de los datos del viaje. |
| `countryForDate()` | Obtiene el país correspondiente a una fecha. |
| `dailyBudgetForDate()` | Resuelve el presupuesto diario aplicable a una fecha. |
| `countriesFor()` | Obtiene la lista de países asociados al contexto del viaje. |
| `countryFlagMarkup()` | Construye el marcado de una bandera. |
| `tripFlagsMarkup()` | Construye las banderas del viaje. |
| `coordinatesForDate()` | Resuelve coordenadas disponibles para una fecha. |
| `flightRoutePoints()` | Prepara los puntos de origen y destino de una ruta aérea. |
| `mapDestinationForDate()` | Determina el destino que debe mostrar el mapa del día. |
| `money()` | Formatea cantidades monetarias para la interfaz. |
| `localMoney()` | Formatea cantidades según la configuración local usada por la aplicación. |
| `dateLabel()` | Formatea una fecha para mostrarla. |
| `dayExpenses()` | Filtra gastos correspondientes a un día. |
| `dayTotal()` | Calcula el total de gastos de un día. |
| `escapeHTML()` | Escapa texto antes de insertarlo como HTML para evitar interpretar caracteres como marcado. |

## Módulos auxiliares

### `src/daily-location-ranges.js`

- `buildDailyLocationRanges()` agrupa registros diarios en rangos de estancia por ubicación y fecha. Separa rangos cuando hay cambios de país o interrupciones de un día, según las reglas del módulo.
- `shiftDate()` es el auxiliar interno usado para calcular fechas consecutivas.

### `src/stay-expenses.js`

- `isTransportExpense()` identifica gastos de transporte.
- `summarizeStayExpenses()` calcula resúmenes de gasto por estancia, excluyendo transporte de esas métricas.

### `src/excel-import.js`

- `parseExpenseWorkbook()` convierte las hojas de un libro en registros aptos para importación.
- Sus auxiliares `roundAmount()`, `roundRate()`, `normalizeText()`, `dateToIso()`, `timeToText()`, `splitProviderReference()`, `numericPrice()` y `currencyForPrice()` limpian y normalizan los valores de la hoja.
- El módulo implementa la lectura, pero actualmente no se identificó un botón o evento de interfaz que lo invoque.

## Datos y servicios

### Datos guardados

Las tablas relevantes incluyen:

- `trips`, `trip_days`: viajes y fechas/días.
- `trip_reservations`: reservas asociadas a viajes.
- `expenses`: gastos.
- `account_links`: relaciones de cuenta usadas por el esquema.
- `personal_travel_flights`, `personal_country_stays`, `personal_poland_analysis`, `personal_daily_locations`: conjuntos de historia personal.

Supabase Auth identifica a la persona. Las políticas RLS de PostgreSQL aplican los permisos sobre filas; la clave pública del cliente no sustituye esas políticas. La API REST de datos la proporciona Supabase/PostgREST, no un servidor implementado en esta aplicación.

### Servicios externos y mapas

- **Frankfurter:** tasa de referencia a PLN si la moneda del gasto no es PLN; la tasa se puede corregir manualmente.
- **Leaflet:** biblioteca que crea mapas en el navegador.
- **OpenStreetMap:** mosaicos cartográficos mostrados por Leaflet.
- **Turf `greatCircle`:** calcula una curva visual entre puntos de una ruta aérea.
- **Datos locales de aeropuertos:** permiten resolver coordenadas y etiquetas de aeropuertos para las rutas.

El mapa del día es una aproximación basada en los datos disponibles, no seguimiento GPS. Los mapas pueden no mostrarse si faltan coordenadas.

## Eventos de interfaz que conectan las funciones

Los listeners de `src/main.js` conectan controles del HTML con esas funciones. Entre los flujos principales están:

- El formulario de acceso solicita autenticación a Supabase; el cambio de sesión dispara la carga inicial.
- Los selectores de viaje y día actualizan el contexto, llaman a las funciones de carga y vuelven a renderizar.
- El formulario de gasto abre el diálogo nuevo o de edición; guardar, marcar pagado y eliminar conectan con las operaciones de Supabase.
- Los botones de navegación abren resumen, reservas, historia personal o detalle diario.
- Los filtros de vuelos y ubicaciones actualizan las listas y mapas que están visibles.
- El control de exportación llama a `exportCSV()`.

La importación Excel está implementada como función auxiliar, pero no se presenta como acción disponible en la interfaz hasta que exista un control que la invoque.
