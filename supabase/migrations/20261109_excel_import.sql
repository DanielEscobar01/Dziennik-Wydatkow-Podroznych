-- PL: Dodaj status do istniejącej tabeli bez zmiany zapisanych wydatków. | ES-CO: Agrega el estado a la tabla existente sin alterar gastos guardados.
alter table public.expenses
  add column if not exists expense_status text not null default 'W Podróży';

-- PL: Dodaj opcjonalne źródło, aby rozpoznać wiersze z arkusza. | ES-CO: Agrega un origen opcional para identificar filas del Excel.
alter table public.expenses
  add column if not exists source_ref text;

-- PL: Zezwól na wiele wydatków bez źródła, ale unikaj powtórzeń importu na konto. | ES-CO: Permite gastos sin origen y evita repetir importaciones por cuenta.
create unique index if not exists expenses_user_source_ref_idx
  on public.expenses (user_id, source_ref);
