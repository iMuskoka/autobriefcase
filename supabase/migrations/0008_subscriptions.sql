-- 0008_subscriptions.sql
-- Stripe integration foundation: subscriptions, webhook idempotency log,
-- subscription status history, and stripe_customer_id mapping on user_profiles.

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger helper
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- user_profiles: add Stripe customer mapping
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.user_profiles
  add column stripe_customer_id text unique;

-- ─────────────────────────────────────────────────────────────────────────────
-- subscriptions
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id       text not null,
  stripe_subscription_id   text not null unique,
  status                   text not null check (status in (
    'trialing','active','past_due','canceled','incomplete','incomplete_expired','unpaid','paused'
  )),
  tier                     text not null check (tier in ('consumer','fleet')),
  billing_interval         text not null check (billing_interval in ('month','year')),
  current_period_end       timestamptz not null,
  cancel_at_period_end     boolean not null default false,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- One active sub per user (allows multiple historical canceled rows).
create unique index subscriptions_one_active_per_user
  on public.subscriptions (user_id)
  where status in ('active','trialing','past_due');

-- Webhook handler maps customer → user via this index.
create index subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

-- For future renewal/expiry cron jobs.
create index subscriptions_current_period_end_idx
  on public.subscriptions (current_period_end);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies — only the service-role client (webhook
-- handler and success-page reconciliation) writes to this table.

-- ─────────────────────────────────────────────────────────────────────────────
-- stripe_events: webhook idempotency log
-- ─────────────────────────────────────────────────────────────────────────────

create table public.stripe_events (
  event_id      text primary key,
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);

alter table public.stripe_events enable row level security;
-- No policies — service-role only.

-- ─────────────────────────────────────────────────────────────────────────────
-- subscription_history: append-only audit log of status transitions
-- ─────────────────────────────────────────────────────────────────────────────

create table public.subscription_history (
  id                uuid primary key default gen_random_uuid(),
  subscription_id   uuid not null references public.subscriptions(id) on delete cascade,
  from_status       text,
  to_status         text not null,
  changed_at        timestamptz not null default now(),
  stripe_event_id   text references public.stripe_events(event_id)
);

create index subscription_history_subscription_id_idx
  on public.subscription_history (subscription_id);

create index subscription_history_changed_at_idx
  on public.subscription_history (changed_at);

alter table public.subscription_history enable row level security;

create policy "subscription_history: select own"
  on public.subscription_history
  for select
  using (
    exists (
      select 1 from public.subscriptions s
      where s.id = subscription_history.subscription_id
        and s.user_id = auth.uid()
    )
  );

-- No insert/update/delete policies — service-role only.
