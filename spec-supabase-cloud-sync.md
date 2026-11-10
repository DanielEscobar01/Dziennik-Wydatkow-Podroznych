- 2026-11-09: El usuario pidió cambiar el inicio de sesión por enlace a email y contraseña tras crear las cuentas en Supabase. Se actualizó el requisito de acceso y se conservó Supabase Auth/RLS por propietario; evita que las cuentas creadas con contraseña queden inutilizables desde la app. Mantener la interfaz polaca, los comentarios bilingües y la separación de gastos entre usuarios.
title: 'Conectar el diario de gastos de viaje a Supabase'
type: 'feature'
created: '2026-11-09'
baseline_commit: 'NO_VCS'
status: 'done'
context: []

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La app actual guarda gastos solo en el navegador; no sincroniza entre dispositivos y su interfaz está en español, aunque el usuario quiere que esté en polaco.

**Approach:** Preparar la app para ejecutarse localmente con Vite, iniciar sesión con email y contraseña de Supabase Auth y guardar/leer gastos en PostgreSQL. Mantener el importe original, moneda, tasa aplicada y equivalente en PLN; proteger los registros por usuario mediante RLS.

## Boundaries & Constraints

**Always:** Renombrar la carpeta local del proyecto a `Dziennik-Wydatkow-Podroznych`. Usar solo la clave publishable en el cliente, en `.env.local` excluido de Git; no solicitar ni almacenar claves secretas. Conceder permisos de tabla explícitamente, habilitar RLS y limitar filas al usuario autenticado; cada cuenta conserva su propio diario. La tasa se conserva como referencia fijada al guardar; no reescribir gastos históricos. Toda la interfaz visible estará en polaco. El acceso usa email y contraseña existentes en Supabase Auth. Explicar línea por línea el código comentable en polaco y español colombiano, incluyendo su lógica. Mantener válidos los formatos que no admiten comentarios, como JSON; documentar sus campos línea por línea en el README bilingüe. La app seguirá arrancando en local sin publicar servicios.

**Ask First:** No cambiar el proveedor de autenticación, publicar/desplegar la app, hacer público el repositorio ni cargar datos del Excel a Supabase sin consentimiento.

**Never:** Incluir `service_role`, claves `secret` o contraseña de base de datos en el navegador o Git; exponer acceso anónimo a gastos; borrar automáticamente los datos locales existentes; insertar comentarios dentro de archivos JSON inválidos.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Login | Email y contraseña válidos, sesión ausente | Autenticar con Supabase Auth y mostrar el diario del usuario en polaco | Mostrar error legible si el email, la contraseña o la confirmación no coinciden |
| Load expenses | Sesión autenticada | Consultar solo filas del usuario y mostrar diario/resumen | No mostrar gastos ajenos; indicar error y permitir reintentar |
| Save foreign-currency expense | Fecha, descripción, categoría, importe, moneda y tasa | Guardar valor local, moneda, tasa y PLN con dueño autenticado | Bloquear importes/tasas no positivos; permitir tasa manual si API no responde |
| Expired session | Token inválido o sesión terminada | Volver a la pantalla de acceso sin datos antiguos visibles | Limpiar estado en memoria y pedir iniciar sesión |

</frozen-after-approval>

## Code Map

- `Dziennik-Wydatkow-Podroznych/index.html` -- app actual de una sola página; formulario, diario, conversión y resumen; se renombrará con la carpeta del proyecto.
- `package.json` -- comandos de desarrollo/build y dependencias Vite/Supabase.
- `.env.local` -- URL y publishable key locales; debe quedar ignorado por Git.
- `.gitignore` -- excluir configuración local y artefactos generados.
- `README.md` -- explicación bilingüe de los campos no comentables del manifiesto y del uso local.
- `supabase/schema.sql` -- tabla de gastos, permisos explícitos, RLS y políticas de propietario.

## Tasks & Acceptance

**Execution:**
- [x] `Japan Trip Ledger` -- renombrar la carpeta a `Dziennik-Wydatkow-Podroznych` y mantener accesible la app desde la nueva ruta.
- [x] `package.json`, `.gitignore`, `.env.example` -- preparar Vite y configuración segura reproducible sin incluir valores reales en el repositorio; documentar cada campo no comentable en README.
- [x] `README.md` -- documentar en polaco y español colombiano los campos de configuración que no admiten comentarios y cómo ejecutar la app localmente.
- [x] `.env.local` -- guardar la URL y publishable key proporcionadas solo en esta máquina.
- [x] `supabase/schema.sql` -- crear `expenses`, conceder privilegios a `authenticated` y aplicar políticas RLS por `user_id`.
- [x] `index.html`, `src/main.js` -- traducir la interfaz al polaco, autenticar con email y contraseña mediante Supabase Auth, consultar/guardar/eliminar gastos autenticados y conservar tasa/importe local/PLN; comentar cada línea de código en polaco y español colombiano, explicando su función y lógica.
- [ ] Ejecutar build y prueba manual local de acceso con contraseña, conversión y persistencia; comprobar que los usuarios tengan email confirmado y contraseña configurada.

**Acceptance Criteria:**
- Given la app ejecutada en localhost, when un usuario envía email y contraseña válidos, then Supabase crea su sesión y la app carga solo sus gastos.
- Given un usuario autenticado, when registra un gasto, then se guardan importe local, moneda, tasa y PLN, y el resumen se actualiza tras recargar.
- Given dos usuarios autenticados, when cada uno consulta o intenta modificar filas, then RLS impide leer o alterar las del otro.
- Given un visitante sin sesión, when abre la app, then no se muestran datos de gastos ni se puede consultar la tabla.
- Given la tasa automática no está disponible, when se introduce una tasa manual válida, then el gasto se puede guardar con esa tasa fijada.
- Given un archivo de código comentable, when se revisa, then cada línea de código tiene una explicación en polaco y español colombiano; los manifiestos JSON permanecen válidos y sus campos se explican en README.

## Verification

**Commands:**
- `npm run build` -- expected: Vite produces a production build without errors.

**Manual checks:**
- Iniciar sesión con email y contraseña válidos y no válidos; guardar un gasto JPY y otro KRW y verificar valores en la tabla; cerrar sesión y confirmar que no quedan datos visibles; revisar que `.env.local` no aparece en Git. Pendiente hasta ejecutar el SQL en Supabase y probar con las cuentas reales.

## Suggested Review Order

**Autenticación y límites de sesión**

- El cliente persiste la sesión de Supabase y mantiene las credenciales públicas fuera del código fuente.
	[main.js:25](src/main.js#L25)

- El formulario solo muestra el diario después de autenticar a la cuenta.
	[index.html:207](index.html#L207)

- El inicio de sesión usa las cuentas de correo y contraseña que ya creaste.
	[main.js:522](src/main.js#L522)

- La inicialización resuelve las sesiones almacenadas y evita respuestas antiguas.
	[main.js:603](src/main.js#L603)

**Persistencia y autorización**

- El guardado valida, redondea y asigna cada gasto al usuario autenticado.
	[main.js:379](src/main.js#L379)

- La tabla conserva importe local, moneda, tasa, PLN y propietario.
	[schema.sql:2](supabase/schema.sql#L2)

- RLS revoca acceso anónimo y limita cada operación al propietario.
	[schema.sql:30](supabase/schema.sql#L30)

**Configuración local**

- La plantilla identifica las dos variables públicas requeridas sin incluir valores reales.
	[.env.example:2](.env.example#L2)

- El README explica la configuración local, SQL y acceso por contraseña.
	[README.md:44](README.md#L44)
