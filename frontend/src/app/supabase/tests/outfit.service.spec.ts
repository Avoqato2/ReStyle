import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../supabase.client';
import { OutfitService } from '../services/outfit.service';
import type { Tables } from '../supabase.types';

type Outfit = Tables<'outfits'>;
type Result = { data: unknown; error: unknown };

function outfit(changes: Partial<Outfit> = {}): Outfit {
  return {
    id: 'o-1',
    user_id: 'user-1',
    name: null,
    favorite: false,
    notes: null,
    created_at: '2026-11-27T00:00:00Z',
    ...changes,
  };
}

// Query-Builder-Mock: jede Kette ist awaitbar und liefert das nächste Ergebnis aus der Queue.
function createQuery(results: Result[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const next = () => Promise.resolve(results.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'update', 'eq', 'order']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder['single'] = (...args: unknown[]) => {
    calls.push({ method: 'single', args });
    return next();
  };
  builder['then'] = (resolve: (value: Result) => unknown, reject: (reason: unknown) => unknown) =>
    next().then(resolve, reject);
  return { builder, calls };
}

function setup(results: Result[] = []) {
  const query = createQuery(results);
  const client = { from: vi.fn(() => query.builder) };

  TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: client }] });
  return { service: TestBed.inject(OutfitService), client, calls: query.calls };
}

describe('OutfitService', () => {
  describe('getAll', () => {
    it('sortiert Favoriten zuerst, danach neueste zuerst', async () => {
      const outfits = [outfit({ id: 'o-2', favorite: true }), outfit()];
      const { service, client, calls } = setup([{ data: outfits, error: null }]);

      await expect(service.getAll()).resolves.toEqual(outfits);

      expect(client.from).toHaveBeenCalledWith('outfits');
      expect(calls.filter((c) => c.method === 'order').map((c) => c.args)).toEqual([
        ['favorite', { ascending: false }],
        ['created_at', { ascending: false }],
      ]);
    });
  });

  describe('setFavorite', () => {
    it('setzt favorite für das Outfit und gibt den Datensatz zurück', async () => {
      const updated = outfit({ favorite: true });
      const { service, calls } = setup([{ data: updated, error: null }]);

      await expect(service.setFavorite('o-1', true)).resolves.toEqual(updated);

      expect(calls).toContainEqual({ method: 'update', args: [{ favorite: true }] });
      expect(calls).toContainEqual({ method: 'eq', args: ['id', 'o-1'] });
    });

    it('wirft den Supabase-Fehler', async () => {
      const error = { message: 'boom' };
      const { service } = setup([{ data: null, error }]);

      await expect(service.setFavorite('o-1', false)).rejects.toBe(error);
    });
  });
});
