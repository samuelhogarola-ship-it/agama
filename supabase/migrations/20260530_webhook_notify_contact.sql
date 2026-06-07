-- Habilita pg_net (viene preinstalado en Supabase, solo hay que activarlo)
create extension if not exists pg_net;

-- Función del trigger
create or replace function public.trigger_notify_contact()
returns trigger language plpgsql security definer as $func$
begin
  perform net.http_post(
    url     := 'https://ozexoekvshuhtkrleuze.supabase.co/functions/v1/notify-contact',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'type',   'INSERT',
      'table',  'landing_contacts',
      'record', row_to_json(new)
    )
  );
  return new;
end;
$func$;

-- Trigger
drop trigger if exists on_contact_insert on public.landing_contacts;
create trigger on_contact_insert
  after insert on public.landing_contacts
  for each row execute procedure public.trigger_notify_contact();
