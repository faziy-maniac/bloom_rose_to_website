# Rosaliaaa

Rosaliaaa is a static HTML/CSS/JavaScript cosmetics storefront. The site uses `@supabase/supabase-js` for anonymous visitor sessions and Postgres-backed products, carts, orders, and journal matches. `store-catalog.js` provides the immediate local catalog fallback and is mirrored in the SQL migration. The visual hero sequence uses compressed WebP frames from `assets/hero-frames/`.

## Supabase setup

1. In Supabase Authentication settings, enable **Anonymous Sign-Ins**. This project currently reports anonymous sign-ins as disabled.
2. In the Supabase SQL Editor, run `supabase/migrations/202609270001_initial_schema.sql`. It creates and seeds the catalog, creates visitor tables and RLS policies, and installs atomic cart/checkout functions.
3. The project URL and publishable key are configured in `supabase-config.js`. Publishable keys are intended for browser use; never put a service-role key in this site.
4. After enabling anonymous auth and applying the migration, run the connection probe:

```sh
npm run test:supabase
```

The probe anonymously signs in, writes and reads a temporary `visitor_journal` row under that user, then deletes it. The publishable key cannot create tables or policies, so the migration must be applied first.

The migration creates these tables:

| Table | Columns |
| --- | --- |
| `categories` | `id`, `name`, `sort_order` |
| `products` | `id`, `category_id`, `brand`, `name`, `description`, `price`, `currency`, `image`, `image_alt`, `shade`, `tags`, `active`, `created_at`, `updated_at` |
| `carts` | `user_id`, `product_id`, `quantity`, `updated_at`; composite primary key on `user_id, product_id` |
| `orders` | `id`, `user_id`, `items`, `subtotal`, `currency`, `status`, `created_at` |
| `visitor_journal` | `user_id`, `latest_match`, `match_answers`, `matched_at`, `updated_at` |

RLS allows public reads of categories and active products. Carts and journal rows allow select/insert/update/delete only where `auth.uid() = user_id`. Orders allow owners to select and insert their own rows; their contents are snapshots and are not client-editable. `add_cart_item` increments quantities atomically, and `place_order` reads prices from `products`, creates an order, and clears that visitor's cart in one database transaction.

Anonymous sessions persist in the same browser profile through Supabase Auth storage. Anonymous IDs do not identify a visitor on a different browser/device unless account linking is added.

Checkout records an order using database product prices and clears the cart transactionally; it does not process payment. A payment provider is needed before accepting real payments.

## Run locally

```sh
npm install
npm run build
npm start
```

Open the URL printed by the server (default `http://127.0.0.1:4173`). Set `PORT` to use another port. `npm run extract:hero` regenerates the scroll frames from a local `hero.mp4` when needed.

The source JPEGs are retained in `images/`; the storefront and production build use 640, 1280, and 1800 pixel WebP variants selected with `srcset`. Run `npm run optimize:images` after replacing those source photos.