// What the inspect drawer says about each backend. Keep this honest: it's what a
// technical lead reads when they tap a kitchen. Code blocks are simplified sketches.

export type Spec = {
  uri: string
  title: string
  role: string
  problem: string
  fix: string[]
  /** the tables and indexes this backend leans on, simplified */
  schema: string
  code: { lang: string; text: string }
}

export const SPECS: Spec[] = [
  {
    uri: 'svc://customer.internal',
    title: 'customer backend',
    role: 'Menus, carts, checkout and payments for the customer app.',
    problem:
      'Money has to move exactly once. A retried checkout must never charge twice, and a captured payment must never end up without an order. Once, it did: the ₹582 bug.',
    fix: [
      'Wallet, promo and payment changes run as single SQL statements under row locks.',
      "Idempotency keys on every money write, so a retry can't charge twice.",
      'A Razorpay webhook reconciles any checkout the app never confirmed.',
      'On boot, the server checks the database accepts every value the code can emit.',
    ],
    schema: `CREATE TABLE payments (
  id              uuid PRIMARY KEY,
  order_id        uuid REFERENCES orders,
  razorpay_id     text UNIQUE,  -- webhook lookup
  idempotency_key text UNIQUE NOT NULL,
  status          payment_status NOT NULL
);
-- the reconcile queue:
CREATE INDEX ON payments (status)
  WHERE status = 'captured_no_order';`,
    code: {
      lang: 'sql',
      text: `-- one statement, one row lock: no read-then-write race
UPDATE wallets
   SET balance = balance - $1
 WHERE user_id = $2
   AND balance >= $1
RETURNING balance;`,
    },
  },
  {
    uri: 'svc://restaurant.internal',
    title: 'restaurant backend',
    role: 'The restaurant dashboard: incoming orders, menu and stock.',
    problem: 'Preventing race conditions on the final food portion during peak rushes.',
    fix: [
      'Postgres row-level locks (SELECT … FOR UPDATE) on the item being ordered, so a second buyer waits instead of overselling.',
      'Every stock change is written to a transactional ledger in the same transaction.',
    ],
    schema: `CREATE TABLE menu_items (
  id            uuid PRIMARY KEY,
  restaurant_id uuid NOT NULL,
  portions_left int  NOT NULL
    CHECK (portions_left >= 0)
);
CREATE TABLE stock_ledger (
  item_id  uuid REFERENCES menu_items,
  delta    int  NOT NULL,
  order_id uuid,
  at       timestamptz DEFAULT now()
);
CREATE INDEX ON menu_items (restaurant_id);`,
    code: {
      lang: 'sql',
      text: `BEGIN;
SELECT portions_left FROM menu_items
 WHERE id = $1
   FOR UPDATE;          -- the second buyer waits here
UPDATE menu_items
   SET portions_left = portions_left - 1
 WHERE id = $1;
INSERT INTO stock_ledger (item_id, delta, order_id)
VALUES ($1, -1, $2);
COMMIT;`,
    },
  },
  {
    uri: 'svc://driver-admin.internal',
    title: 'driver · admin backend',
    role: 'Order pooling, dispatch to riders, and the admin console.',
    problem:
      "Campus orders should share one rider, so a whole hostel gets one delivery. But nobody should wait forever for a pool to fill.",
    fix: [
      'A background scheduler closes or extends every order pool on a 60 s tick and notifies admins.',
      "Instant dispatch for orders that can't wait for a pool.",
      'Delivery areas are H3 hexagon cells, so "same area" is a cell lookup.',
    ],
    schema: `CREATE TABLE order_pools (
  id        uuid PRIMARY KEY,
  h3_cell   text NOT NULL,     -- its hexagon
  closes_at timestamptz NOT NULL,
  status    pool_status NOT NULL
);
-- what the 60 s tick scans:
CREATE INDEX ON order_pools (status, closes_at);
CREATE INDEX ON order_pools (h3_cell);`,
    code: {
      lang: 'python',
      text: `async def pool_tick():            # every 60 s
    for pool in await open_pools():
        if pool.full or pool.expired:
            await close_and_dispatch(pool)
        else:
            await extend(pool, seconds=60)
            await notify_admins(pool)`,
    },
  },
]
