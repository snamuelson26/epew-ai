create unique index if not exists
  supporter_transactions_stripe_checkout_session_unique_idx
on public.supporter_transactions (stripe_checkout_session_id)
where stripe_checkout_session_id is not null
  and btrim(stripe_checkout_session_id) <> '';
