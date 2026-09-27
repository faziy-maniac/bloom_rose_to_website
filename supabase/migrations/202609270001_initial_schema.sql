begin;

create table public.categories (
  id text primary key,
  name text not null,
  sort_order integer not null default 0
);

create table public.products (
  id text primary key,
  category_id text not null references public.categories(id),
  brand text not null default 'Rosaliaaa',
  name text not null,
  description text not null,
  price numeric(10, 2) not null check (price >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  image text not null,
  image_alt text not null default '',
  shade jsonb,
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'placed' check (status in ('placed', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);

create table public.visitor_journal (
  user_id uuid primary key references auth.users(id) on delete cascade,
  latest_match jsonb,
  match_answers jsonb,
  matched_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.categories (id, name, sort_order) values
  ('lips', 'Lips', 1),
  ('face', 'Face', 2),
  ('eyes', 'Eyes', 3),
  ('skincare', 'Skincare', 4),
  ('fragrance', 'Fragrance', 5)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.products (id, category_id, brand, name, description, price, currency, image, image_alt, shade, tags) values
  ('lip-colour-rosewood', 'lips', 'Rosaliaaa', 'Botanical Lip Colour / Rosewood', 'A soft, lived-in red with the warmth of a late summer rose.', 38, 'USD', '/images/lip-colour-rosewood.webp', 'Botanical Lip Colour Rosewood frosted liquid lip colour tube with golden lettering and rose gold cap', '{"name":"Rosewood","color":"#873d47"}', array['soft','everyday','definition']),
  ('lip-colour-petal', 'lips', 'Rosaliaaa', 'Botanical Lip Colour / Petal', 'A sheer blush pink, like the first colour of morning.', 38, 'USD', '/images/lip-colour-petal.webp', 'Botanical Lip Colour Petal lipstick tube in engraved rose gold beside fresh rosebuds and a soft pink swatch', '{"name":"Petal","color":"#b66f72"}', array['soft','fresh','everyday']),
  ('lip-colour-wild-rose', 'lips', 'Rosaliaaa', 'Botanical Lip Colour / Wild Rose', 'A deeper berry-red that leaves a little room for mystery.', 38, 'USD', '/images/lip-colour-wild-rose.webp', 'Slender frosted Botanical Lip Colour Wild Rose lip vials in a natural wooden stand with fresh rosehips', '{"name":"Wild Rose","color":"#642832"}', array['bold','definition']),
  ('lip-colour-poppy', 'lips', 'Rosaliaaa', 'Botanical Lip Colour / Poppy', 'A sun-warmed terracotta that never tries too hard.', 38, 'USD', '/images/lip-colour-poppy.webp', 'Botanical Lip Colour Poppy lipstick in bamboo and gold casing next to packaging and shade application', '{"name":"Poppy","color":"#a65a38"}', array['fresh','bold','everyday']),
  ('lip-colour-ritual', 'lips', 'Rosaliaaa', 'Botanical Lip Colour / Ritual', 'A confident, just-bitten red for every day that matters.', 38, 'USD', '/images/lip-colour-ritual.webp', 'Botanical Lip Colour Ritual nourishing lip tint in a glass jar with wooden lid beside brass spatula, dried herbs, and candle', '{"name":"Ritual","color":"#a94c50"}', array['bold','definition','everyday']),
  ('petal-sheer-balm', 'lips', 'Rosaliaaa', 'Petal Sheer Lip Balm', 'A sheer blush tint with a comfortable, balmy finish.', 24, 'USD', '/images/petal-sheer-balm.webp', 'Petal Sheer Lip Balm stick in botanical-illustrated rose gold tube on rustic wood with rose petals', '{"name":"Petal","color":"#c47b80"}', array['soft','fresh','hydration','everyday']),
  ('wild-rose-lip-tint', 'lips', 'Rosaliaaa', 'Wild Rose Lip Tint', 'A deeper berry tint with a softly stained finish.', 29, 'USD', '/images/wild-rose-lip-tint.webp', 'Wild Rose Lip Tint in a glass bottle with applicator wand, hand swatch, and blooming wild roses', '{"name":"Wild Rose","color":"#72313d"}', array['bold','definition']),
  ('rosewater-lip-gloss', 'lips', 'Rosaliaaa', 'Rosewater Lip Gloss', 'A clear, cushiony gloss that catches the light without stickiness.', 26, 'USD', '/images/rosewater-lip-gloss.webp', 'Rosewater Lip Gloss in a clear tube with rose gold cap showing shimmering rose gloss and doe-foot applicator', '{"name":"Clear Rose","color":"#d99598"}', array['fresh','soft']),
  ('dew-veil-tint', 'face', 'Rosaliaaa', 'Dew Veil Skin Tint', 'A light, breathable wash of even-looking coverage.', 42, 'USD', '/images/dew-veil-tint.webp', 'Dew Veil Skin Tint glass dropper bottle on a travertine stone pedestal beside a soft makeup brush', null, array['soft','fresh','everyday']),
  ('soft-focus-powder', 'face', 'Rosaliaaa', 'Soft Focus Setting Powder', 'A finely milled finish that keeps the look natural.', 34, 'USD', '/images/soft-focus-powder.webp', 'Soft Focus Setting Powder in a sifter jar with velvet puff and soft powder brush dusting translucent powder', null, array['soft','everyday']),
  ('petal-cream-blush', 'face', 'Rosaliaaa', 'Petal Cream Blush', 'A blendable rose flush with a fresh, dewy finish.', 31, 'USD', '/images/petal-cream-blush.webp', 'Petal Cream Blush in an open rose gold compact featuring a sculpted rose flower relief and swatch', '{"name":"Petal","color":"#b66f72"}', array['fresh','bold','definition']),
  ('quiet-definition-mascara', 'eyes', 'Rosaliaaa', 'Quiet Definition Mascara', 'A softly defined lash look for everyday ease.', 32, 'USD', '/images/quiet-definition-mascara.webp', 'Quiet Definition Mascara in sleek matte black with gold lettering and open molded applicator wand on stone', null, array['soft','everyday','definition']),
  ('fern-line-pencil', 'eyes', 'Rosaliaaa', 'Fern Line Eye Pencil', 'A smooth, buildable line with a little room for drama.', 22, 'USD', '/images/fern-line-pencil.webp', 'Fern Line Eye Pencil in forest green with gold accents on fresh green fern fronds and swatch line', '{"name":"Deep Fern","color":"#35473c"}', array['bold','definition']),
  ('rosewater-eye-colour', 'eyes', 'Rosaliaaa', 'Rosewater Eye Colour', 'A soft rose wash that blends from barely-there to vivid.', 28, 'USD', '/images/rosewater-eye-colour.webp', 'Rosewater Eye Colour in a frosted glass pot with shimmering rose cream eyeshadow, brush, and miniature rosewater vial', '{"name":"Rosewash","color":"#a86a70"}', array['soft','fresh','bold']),
  ('cloudberry-comfort-cream', 'skincare', 'Rosaliaaa', 'Cloudberry Comfort Cream', 'A cushiony daily moisturiser for a slower evening ritual.', 46, 'USD', '/images/cloudberry-comfort-cream.webp', 'Cloudberry Comfort Cream in a glass jar with gold screw cap beside a bowl of fresh arctic cloudberries', null, array['comfort','hydration','ritual']),
  ('rosehip-daily-serum', 'skincare', 'Rosaliaaa', 'Rosehip Daily Serum', 'A light layer of hydration for a fresh-feeling start.', 48, 'USD', '/images/rosehip-daily-serum.webp', 'Rosehip Daily Serum in an amber glass dropper bottle with fresh rosehip sprigs and golden serum drops', null, array['fresh','hydration','everyday']),
  ('quiet-clean-balm', 'skincare', 'Rosaliaaa', 'Quiet Clean Cleansing Balm', 'A comforting balm cleanser to close out the day.', 36, 'USD', '/images/quiet-clean-balm.webp', 'Quiet Clean Cleansing Balm in an amber glass jar with gold lid beside a wooden scoop and waffle linen', null, array['comfort','ritual','hydration']),
  ('after-rain-fragrance', 'fragrance', 'Rosaliaaa', 'After Rain Eau de Parfum', 'A fresh green impression inspired by a garden after rain.', 78, 'USD', '/images/after-rain-fragrance.webp', 'After Rain Eau de Parfum in a glass flacon with knurled silver cap on rain-wet stone among garden leaves', null, array['fresh','everyday']),
  ('wild-garden-fragrance', 'fragrance', 'Rosaliaaa', 'Wild Garden Eau de Parfum', 'A vivid floral blend with a little untamed character.', 82, 'USD', '/images/wild-garden-fragrance.webp', 'Wild Garden Eau de Parfum in a glass bottle with wooden sphere cap set among blooming garden flowers and herbs', null, array['bold','definition']),
  ('soft-petal-skin-scent', 'fragrance', 'Rosaliaaa', 'Soft Petal Skin Scent', 'A close, gentle floral made for unhurried rituals.', 68, 'USD', '/images/soft-petal-skin-scent.webp', 'Soft Petal Skin Scent eau de parfum in a round glass flacon with gold spray nozzle amid blooming pink roses and peonies', null, array['soft','comfort','ritual'])
on conflict (id) do update set
  category_id = excluded.category_id,
  brand = excluded.brand,
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  currency = excluded.currency,
  image = excluded.image,
  image_alt = excluded.image_alt,
  shade = excluded.shade,
  tags = excluded.tags,
  active = true,
  updated_at = now();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.orders enable row level security;
alter table public.visitor_journal enable row level security;

drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable" on public.categories
  for select to anon, authenticated using (true);

drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable" on public.products
  for select to anon, authenticated using (active);

drop policy if exists "Visitors read their cart" on public.carts;
create policy "Visitors read their cart" on public.carts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Visitors add to their cart" on public.carts;
create policy "Visitors add to their cart" on public.carts
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Visitors update their cart" on public.carts;
create policy "Visitors update their cart" on public.carts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Visitors remove from their cart" on public.carts;
create policy "Visitors remove from their cart" on public.carts
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Visitors read their orders" on public.orders;
create policy "Visitors read their orders" on public.orders
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Visitors create their orders" on public.orders;
create policy "Visitors create their orders" on public.orders
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Visitors read their journal" on public.visitor_journal;
create policy "Visitors read their journal" on public.visitor_journal
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Visitors create their journal" on public.visitor_journal;
create policy "Visitors create their journal" on public.visitor_journal
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Visitors update their journal" on public.visitor_journal;
create policy "Visitors update their journal" on public.visitor_journal
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Visitors delete their journal" on public.visitor_journal;
create policy "Visitors delete their journal" on public.visitor_journal
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select on public.categories, public.products to anon, authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert, update, delete on public.visitor_journal to authenticated;

create or replace function public.add_cart_item(p_product_id text)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to update a cart' using errcode = '28000';
  end if;

  insert into public.carts (user_id, product_id, quantity, updated_at)
  select current_user_id, product.id, 1, now()
  from public.products as product
  where product.id = p_product_id and product.active
  on conflict (user_id, product_id) do update
    set quantity = public.carts.quantity + 1, updated_at = now();

  if not found then
    raise exception 'Product is unavailable';
  end if;
end;
$$;

revoke all on function public.add_cart_item(text) from public;
grant execute on function public.add_cart_item(text) to authenticated, anon;

create or replace function public.place_order()
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  order_items jsonb;
  order_subtotal numeric(10, 2);
  created_order public.orders%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to place an order' using errcode = '28000';
  end if;

  perform 1 from public.carts where user_id = current_user_id for update;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'productId', product.id,
      'name', product.name,
      'price', product.price,
      'quantity', cart.quantity,
      'image', product.image
    ) order by product.name), '[]'::jsonb),
    coalesce(sum(product.price * cart.quantity), 0)
  into order_items, order_subtotal
  from public.carts as cart
  join public.products as product on product.id = cart.product_id and product.active
  where cart.user_id = current_user_id;

  if jsonb_array_length(order_items) = 0 then
    raise exception 'Your bag is empty';
  end if;

  insert into public.orders (user_id, items, subtotal, currency)
  values (current_user_id, order_items, order_subtotal, 'USD')
  returning * into created_order;

  delete from public.carts where user_id = current_user_id;
  return to_jsonb(created_order);
end;
$$;

revoke all on function public.place_order() from public;
grant execute on function public.place_order() to authenticated, anon;

commit;