begin;
select plan(13);

-- Two users. auth.users only needs an ID; the email is for readability.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'other@test.local');

-- Act as the owner: signed in, with the owner's user ID, which auth.uid() reads.
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ insert into public.bodyweight_entry_attempts (id, day, weight_kg, confirmed, timezone)
     values ('01900000-0000-7000-8000-000000000001', '2026-11-27', 80.5, true, 'Europe/Athens') $$,
  'the owner adds an attempt'
);
select lives_ok(
  $$ insert into public.bodyweight_entry_attempts (id, day, weight_kg, confirmed, timezone)
     values ('01900000-0000-7000-8000-000000000002', '2026-11-27', null, false, 'Europe/Athens') $$,
  'the owner adds an attempt that clears the day'
);
select is(
  (select count(*) from public.bodyweight_entry_attempts)::int, 2,
  'the owner sees them'
);
select throws_ok(
  $$ insert into public.bodyweight_entry_attempts (id, user_id, day, weight_kg, confirmed, timezone)
     values ('01900000-0000-7000-8000-000000000003', '22222222-2222-2222-2222-222222222222',
             '2026-11-27', 70, true, 'Europe/Athens') $$,
  '42501',
  'new row violates row-level security policy for table "bodyweight_entry_attempts"',
  'the owner cannot add an attempt for someone else'
);
select throws_ok(
  $$ insert into public.bodyweight_entry_attempts (id, day, weight_kg, confirmed, timezone)
     values ('01900000-0000-7000-8000-000000000004', '2026-11-27', 19.9, true, 'Europe/Athens') $$,
  '23514', null,
  'a weight under 20 kg is refused'
);
select throws_ok(
  $$ insert into public.bodyweight_entry_attempts (id, day, weight_kg, confirmed, timezone)
     values ('01900000-0000-7000-8000-000000000005', '2026-11-27', 400.1, true, 'Europe/Athens') $$,
  '23514', null,
  'a weight over 400 kg is refused'
);
select throws_ok(
  $$ insert into public.bodyweight_entry_attempts (id, day, weight_kg, confirmed, timezone, saved_at)
     values ('01900000-0000-7000-8000-000000000006', '2026-11-27', 80, true, 'Europe/Athens', '2020-01-01') $$,
  '42501', null,
  'the save time is set by the server only'
);
select throws_ok(
  $$ update public.bodyweight_entry_attempts set weight_kg = 81 $$,
  '42501', null,
  'the owner cannot update an attempt'
);
select throws_ok(
  $$ delete from public.bodyweight_entry_attempts $$,
  '42501', null,
  'the owner cannot delete an attempt'
);

-- Act as the second user.
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*) from public.bodyweight_entry_attempts)::int, 0,
  'a second user sees none of them'
);
select throws_ok(
  $$ update public.bodyweight_entry_attempts set weight_kg = 90 $$,
  '42501', null,
  'a second user cannot change them'
);
select throws_ok(
  $$ delete from public.bodyweight_entry_attempts $$,
  '42501', null,
  'a second user cannot delete them'
);

-- Act as a signed-out visitor.
set local role anon;

select throws_ok(
  $$ select * from public.bodyweight_entry_attempts $$,
  '42501',
  'permission denied for table bodyweight_entry_attempts',
  'a signed-out request is refused'
);

select * from finish();
rollback;
