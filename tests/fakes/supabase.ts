import type { Row } from '@/lib/entries';

type Action = 'select' | 'insert' | 'upsert' | 'update' | 'delete';
type Op = { action: Action; payload?: unknown; id?: unknown; range?: [number, number] };

// Just enough of the supabase-js query builder for hooks/use-daily-log.ts: chainable, awaitable,
// backed by an in-memory table. fail(action) makes that action return an error, like a dropped
// connection or an RLS rejection would.
export function createFakeSupabase(initial: Row[] = []) {
  const db = { rows: [...initial] };
  const failing = new Set<Action>();
  let pageCap = Infinity; // the API's max-rows limit

  const run = (op: Op) => {
    if (failing.has(op.action)) return { data: null, count: null, error: { message: `${op.action} failed` } };
    switch (op.action) {
      case 'select': {
        const sorted = [...db.rows].sort((a, b) => b.timestamp - a.timestamp || a.id.localeCompare(b.id));
        const [from, to] = op.range ?? [0, sorted.length - 1];
        return { data: sorted.slice(from, Math.min(to + 1, from + pageCap)), count: sorted.length, error: null };
      }
      case 'insert':
        db.rows.push(op.payload as Row);
        break;
      case 'upsert':
        for (const r of op.payload as Row[]) db.rows = [...db.rows.filter(x => x.id !== r.id), r];
        break;
      case 'update':
        db.rows = db.rows.map(r => (r.id === op.id ? { ...r, ...(op.payload as Partial<Row>) } : r));
        break;
      case 'delete':
        db.rows = db.rows.filter(r => r.id !== op.id);
        break;
    }
    return { data: null, count: null, error: null };
  };

  const from = () => {
    const op: Op = { action: 'select' };
    const query = {
      select: () => query,
      insert: (payload: unknown) => Object.assign(op, { action: 'insert', payload }) && query,
      upsert: (payload: unknown) => Object.assign(op, { action: 'upsert', payload }) && query,
      update: (payload: unknown) => Object.assign(op, { action: 'update', payload }) && query,
      delete: () => Object.assign(op, { action: 'delete' }) && query,
      eq: (_column: string, value: unknown) => Object.assign(op, { id: value }) && query,
      order: () => query,
      range: (a: number, b: number) => Object.assign(op, { range: [a, b] }) && query,
      then: (resolve: (v: ReturnType<typeof run>) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(run(op)).then(resolve, reject),
    };
    return query;
  };

  return {
    client: { from },
    db,
    fail: (action: Action) => failing.add(action),
    recover: (action: Action) => failing.delete(action),
    capPages: (n: number) => { pageCap = n; },
  };
}
