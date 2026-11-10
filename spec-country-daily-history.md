---
title: 'Historia diaria de países'
type: 'feature'
created: '2026-11-10'
baseline_commit: '8f0789bb3e43e4c259649810b05b675f11fcea8e'
status: 'done'
context: ['src/main.js', 'index.html']
---

<!-- markdownlint-disable MD033 -->
<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La pestaña `Kraje od urodzenia` enumera cada día por separado y no conserva los países superpuestos en una misma fecha.

**Approach:** Persistir el bloque de eventos por país de `Baza pobytów` en una tabla privada; agrupar días consecutivos del mismo país en rangos y conservar una entrada por país en fechas superpuestas.

## Boundaries & Constraints

**Always:** Mantener los cinco tabs y el resumen actual por país; RLS limita todos los registros al usuario autenticado; UI en polaco; conservar cambios existentes; no hacer push ni publicar; usar las 10.336 entradas del bloque país-fecha-contexto, desde 1999-01-09 hasta 2026-12-27; agrupar por país sin fusionar países distintos en una fecha.

**Ask First:** Ampliar el detalle a fechas anteriores a 2012, que no están en el bloque diario disponible; compartir esta historia personal con otra cuenta.

**Never:** Exponer el detalle a `anon`, reemplazar el resumen por país o incluir el Excel y credenciales en el repositorio.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Historial disponible | Usuario autenticado; 10.336 entradas país-fecha | Mostrar rangos consecutivos por país; permitir navegar por año/páginas | Mensaje polaco si falla la lectura |
| Sin filas para el filtro | Año sin registros | Mostrar estado vacío sin borrar los totales por país | Permitir cambiar el filtro |
| Varios países el mismo día | Dos o tres países para una fecha | Mostrar una entrada independiente por cada país | No fusionar países por fecha |
| Usuario sin sesión | Sin usuario autenticado | No consultar ni mostrar datos personales | Mantener el acceso protegido |

</frozen-after-approval>
<!-- markdownlint-enable MD033 -->

## Code Map

- `src/main.js` -- consultas personales y renderizado de países.
- `index.html` -- estructura de la pestaña `Kraje od urodzenia`.
- `supabase/migrations/20261111_personal_daily_locations.sql` -- tabla diaria con RLS.
- `supabase/migrations/20261111_personal_daily_locations_multi_country.sql` -- permite países distintos en la misma fecha.

## Tasks & Acceptance

**Execution:**

- [x] `supabase/migrations/20261111_personal_daily_locations_multi_country.sql` -- quitar unicidad por fecha manteniendo RLS.
- [x] `src/main.js` -- cargar eventos país-fecha, agrupar rangos y conservar solapamientos.
- [x] `index.html` -- agregar controles y lista diaria sin retirar el resumen existente.
- [x] Importar 10.336 entradas del bloque país-fecha y verificar recuento.

**Acceptance Criteria:**

- Given varios días consecutivos en el mismo país, when abre `Kraje od urodzenia`, then ve un rango de fechas en vez de una fila por día.
- Given varios países en una fecha, when consulta ese período, then ve una entrada independiente por cada país.
- Given varios años de historial, when cambia de año o pagina, then la lista muestra rangos correspondientes sin renderizar miles de filas a la vez.
- Given otra cuenta, when consulta la tabla, then RLS no revela estos días.
- Given el historial disponible, when se consulta el primer y último día, then aparecen 1999-01-09 y 2026-12-27.

## Verification

**Commands:**

- `npm run build` -- expected: build sin errores.

**Manual checks:**

- Verificar rangos consecutivos, tres países el 2019-12-26, filtros, paginación y totales por país.
- Confirmar recuento 10.336 bajo el usuario propietario y cero filas visibles para otro usuario.

## Suggested Review Order

### Privacidad y carga

- El cargador filtra por propietario y continúa aunque el API reduzca el tamaño de página. [`main.js:350`](src/main.js#L350)

- RLS protege la tabla diaria y limita las operaciones al usuario autenticado. [`personal_daily_locations.sql:16`](supabase/migrations/20261111_personal_daily_locations.sql#L16)

- La migración permite conservar varios países en una misma fecha y actualizar solo filas propias. [`personal_daily_locations_multi_country.sql:1`](supabase/migrations/20261111_personal_daily_locations_multi_country.sql#L1)

### Vista diaria

- El render conserva los totales por país y limita la lista a 50 rangos por página. [`main.js:656`](src/main.js#L656)

- Los controles diarios se ubican debajo del resumen y se adaptan a móvil. [`index.html:678`](index.html#L678)

### Operación local

- El README documenta la nueva migración privada. [`README.md:31`](README.md#L31)
