begin;
select plan(7);

-- Two users. auth.users only needs an ID; the email is for readability.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'other@test.local');

-- Act as the owner: signed in, with the owner's user ID, which auth.uid() reads.
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';

select lives_ok(
  $$ insert into public.bodyweights (id, weight_kg) values ('01900000-0000-7000-8000-000000000001', 80.5) $$,
  'the owner adds a weigh-in'
);
select is(
  (select count(*) from public.bodyweights)::int, 1,
  'the owner sees it'
);
select throws_ok(
  $$ insert into public.bodyweights (id, user_id, weight_kg)
     values ('01900000-0000-7000-8000-000000000002', '22222222-2222-2222-2222-222222222222', 70) $$,
  '42501',
  'new row violates row-level security policy for table "bodyweights"',
  'the owner cannot add a weigh-in for someone else'
);

-- Act as the second user.
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';

select is(
  (select count(*) from public.bodyweights)::int, 0,
  'a second user sees none of them'
);
select is_empty(
  $$ update public.bodyweights set weight_kg = 90 returning id $$,
  'a second user cannot change them'
);
select is_empty(
  $$ delete from public.bodyweights returning id $$,
  'a second user cannot delete them'
);

-- Act as a signed-out visitor.
set local role anon;

select throws_ok(
  $$ select * from public.bodyweights $$,
  '42501',
  'permission denied for table bodyweights',
  'a signed-out request is refused'
);

select * from finish();
rollback;
