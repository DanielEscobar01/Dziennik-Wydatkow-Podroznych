# Dziennik wydatków podróżnych

PL: Aplikacja do prywatnego planowania wielu podróży i śledzenia wydatków. Interfejs jest po polsku.
ES-CO: Aplicación para planear varios viajes y hacer seguimiento privado de gastos. La interfaz está en polaco.

## Konfiguracja projektu / Configuración del proyecto

PL: Każde pole w `package.json` opisano poniżej, ponieważ poprawny plik JSON nie może zawierać komentarzy. `package-lock.json` generuje npm i nie należy edytować go ręcznie.
ES-CO: Cada campo de `package.json` se explica abajo, porque JSON no admite comentarios. npm genera `package-lock.json`; no lo edites a mano.

- `name`: PL — nazwa pakietu npm; ES-CO — nombre del paquete npm.
- `private`: PL — blokuje przypadkową publikację pakietu; ES-CO — evita publicar el paquete por accidente.
- `version`: PL — wersja aplikacji; ES-CO — versión de la aplicación.
- `type`: PL — włącza moduły JavaScript ES; ES-CO — activa los módulos ES de JavaScript.
- `scripts.dev`: PL — uruchamia serwer deweloperski Vite na localhost; ES-CO — inicia el servidor local de Vite.
- `scripts.build`: PL — tworzy produkcyjny katalog `dist`; ES-CO — genera la carpeta de producción `dist`.
- `scripts.preview`: PL — podgląda lokalnie kompilację produkcyjną; ES-CO — previsualiza localmente la compilación.
- `dependencies.@supabase/supabase-js`: PL — klient przeglądarkowy Supabase Auth i bazy; ES-CO — cliente de navegador para Auth y la base de Supabase.
- `dependencies.chart.js`: PL — rysuje wykresy dziennych wydatków i kategorii; ES-CO — dibuja gráficos diarios y por categoría.
- `dependencies.read-excel-file`: PL — odczytuje skoroszyt lokalnie na potrzeby importu; ES-CO — lee el Excel localmente para importarlo.
- `devDependencies.vite`: PL — narzędzie do serwera i kompilacji; ES-CO — herramienta de servidor y compilación.

PL: `.env.local` zawiera URL projektu i klucz publishable. Git ignoruje ten plik; nigdy nie wpisuj tutaj klucza `secret` ani `service_role`.
ES-CO: `.env.local` contiene la URL y la clave publishable. Git ignora este archivo; nunca pongas aquí una clave `secret` ni `service_role`.

PL: `.env.example` pokazuje wymagane nazwy zmiennych, ale nie zawiera prawdziwych wartości.
ES-CO: `.env.example` muestra los nombres de variables requeridos, sin valores reales.

## Supabase / Baza danych

PL: W Supabase otwórz **SQL Editor**, wklej zawartość `supabase/schema.sql` i uruchom ją raz. Skrypt tworzy tabelę, jawne uprawnienia dla `authenticated` i polityki RLS właściciela.
ES-CO: En Supabase abre **SQL Editor**, pega el contenido de `supabase/schema.sql` y ejecútalo una vez. El script crea la tabla, permisos explícitos para `authenticated` y políticas RLS por propietario.

PL: Przy istniejącej bazie uruchom migracje w kolejności: `20261109_excel_import.sql`, `20261109_multi_trip_model.sql`, a następnie `20261109_trip_reservations.sql`. Ostatnia tworzy prywatne rezerwacje hoteli i lotów powiązane z podróżą.
ES-CO: En una base existente, ejecuta las migraciones en orden: `20261109_excel_import.sql`, `20261109_multi_trip_model.sql` y luego `20261109_trip_reservations.sql`. La última crea reservas privadas de hoteles y vuelos vinculadas al viaje.

PL: W **Authentication → Providers → Email** upewnij się, że logowanie email/hasło jest włączone. Każde konto musi mieć ustawione hasło i potwierdzony adres email.
ES-CO: En **Authentication → Providers → Email**, confirma que esté activo el acceso con correo y contraseña. Cada cuenta debe tener contraseña y correo confirmado.

PL: Logowanie hasłem nie używa adresu **Redirect URL**. Po zalogowaniu Supabase Auth przełącza aplikację na konto i pobiera jego prywatne wydatki.
ES-CO: El acceso con contraseña no usa una **Redirect URL**. Al autenticar, Supabase Auth abre la sesión y la app consulta los gastos privados de esa cuenta.

PL: Status synchronizacji pokazuje, ile wydatków zwróciła baza dla zalogowanego użytkownika. Wartość `0` oznacza pusty dziennik tego konta, a nie błąd pobierania. Wykresy korzystają z tych samych wierszy ograniczonych przez RLS.
ES-CO: El estado de sincronización indica cuántos gastos devolvió la base para la cuenta activa. `0` significa que esa cuenta aún no tiene gastos visibles, no que la consulta falló. Los gráficos usan las mismas filas filtradas por RLS.

## Uruchomienie lokalne / Ejecución local

PL: W nowej kopii projektu utwórz `.env.local` z szablonu. Otwórz plik i wpisz Project URL oraz klucz publishable ze swojego projektu Supabase; nie wpisuj klucza secret.
ES-CO: En una copia nueva crea `.env.local` desde la plantilla. Abre el archivo y pon la Project URL y la clave publishable de tu proyecto Supabase; no uses la clave secret.

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

PL: Otwórz `http://127.0.0.1:5173` i wpisz email oraz hasło konta Supabase. Dane są widoczne dopiero po zalogowaniu.
ES-CO: Abre `http://127.0.0.1:5173` e ingresa el correo y la contraseña de Supabase. Los gastos solo se muestran después de iniciar sesión.

PL: Po zalogowaniu wybierz **Importuj Excel** i wskaż skoroszyt. Import obejmuje tylko wiersze z dodatnią kwotą, zachowuje status i pomija źródła już zaimportowane dla tego konta.
ES-CO: Después de iniciar sesión, pulsa **Importuj Excel** y selecciona el libro. Solo se importan filas con importe positivo; conserva el estado y omite filas ya importadas en esa cuenta.

PL: Kurs walutowy jest zapisywany razem z wydatkiem. Tabela zachowuje kwotę lokalną, kod waluty, kurs i wynik w PLN.
ES-CO: La tasa queda fijada al guardar el gasto. La tabla conserva el importe local, la moneda, la tasa y el equivalente en PLN.

PL: Nie umieszczaj kluczy `secret` ani `service_role` w kodzie przeglądarki, repozytorium lub plikach udostępnianych innym osobom.
ES-CO: No pongas claves `secret` ni `service_role` en el código del navegador, el repositorio ni archivos compartidos.

## GitHub Pages / Publicación en GitHub Pages

PL: `vite.config.js` ustawia ścieżkę projektu `Dziennik-Wydatkow-Podroznych`; workflow `.github/workflows/deploy.yml` buduje katalog `dist` i publikuje go po pushu do `main`.
ES-CO: `vite.config.js` configura la ruta del proyecto `Dziennik-Wydatkow-Podroznych`; `.github/workflows/deploy.yml` compila `dist` y lo publica al recibir cambios en `main`.

PL: W **Settings → Secrets and variables → Actions → Variables** dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_PUBLISHABLE_KEY`. Są to ustawienia publiczne klienta; nie dodawaj klucza `secret` ani `service_role`.
ES-CO: En **Settings → Secrets and variables → Actions → Variables**, agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Son valores públicos del cliente; no agregues una clave `secret` ni `service_role`.

PL: W **Settings → Pages → Build and deployment** wybierz **GitHub Actions**. Po pushu do `main` sprawdź **Actions**; adres strony będzie `https://DanielEscobar01.github.io/Dziennik-Wydatkow-Podroznych/`.
ES-CO: En **Settings → Pages → Build and deployment**, elige **GitHub Actions**. Después del push a `main`, revisa **Actions**; la URL será `https://DanielEscobar01.github.io/Dziennik-Wydatkow-Podroznych/`.

PL: Kod źródłowy repozytorium jest publiczny. Nazwy podróży, plan dni i wydatki są przechowywane w Supabase; RLS ogranicza je do zalogowanego właściciela. Klucz publishable jest przeznaczony do aplikacji przeglądarkowej, a `.env.local`, skoroszyty i klucze `secret` pozostają poza repozytorium.
ES-CO: El código fuente del repositorio es público. Los nombres, itinerarios y gastos se guardan en Supabase; RLS los limita al propietario autenticado. La clave publishable es para el navegador; `.env.local`, los libros Excel y las claves `secret` no se publican.
