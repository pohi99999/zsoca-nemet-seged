-- Explicit Data API grants for every public table (Zsoca), Supabase change of 2026-10-30.
--
-- From 2026-10-30 Supabase stops granting the API roles (anon, authenticated, service_role) on new
-- tables in "public" automatically. Existing tables keep their grants, but a schema rebuilt from the
-- migrations (supabase db reset, a preview branch, a new project) would get tables without them.
--
-- This migration grants exactly what each table carries on the live project today (relacl, read
-- 2026-10-21), so a rebuilt schema matches production. It is not a blanket grant: a table that is
-- stricter on purpose stays stricter. On the live project every statement is a no-op.
-- A table that does not exist yet (created outside the migrations) is skipped.

do $$
begin
  if to_regclass('public.assessment_results') is not null then
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.assessment_results to anon;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.assessment_results to authenticated;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.assessment_results to service_role;
  end if;
  if to_regclass('public.learning_plans') is not null then
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.learning_plans to anon;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.learning_plans to authenticated;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.learning_plans to service_role;
  end if;
  if to_regclass('public.modules') is not null then
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.modules to anon;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.modules to authenticated;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.modules to service_role;
  end if;
  if to_regclass('public.profiles') is not null then
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.profiles to anon;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.profiles to authenticated;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.profiles to service_role;
  end if;
  if to_regclass('public.user_vocabulary_memory') is not null then
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.user_vocabulary_memory to anon;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.user_vocabulary_memory to authenticated;
    grant select, insert, update, delete, truncate, references, trigger, maintain on public.user_vocabulary_memory to service_role;
  end if;
end
$$;
