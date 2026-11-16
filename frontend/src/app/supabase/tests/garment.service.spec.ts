import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../supabase.client';
import { GarmentService } from '../services/garment.service';
import type { Tables } from '../supabase.types';

type Garment = Tables<'garments'>;
type Result = { data: unknown; error: unknown };

const USER_ID = 'user-1';

function garment(changes: Partial<Garment> = {}): Garment {
  return {
    id: 'g-1',
    user_id: USER_ID,
    image_path: `${USER_ID}/g-1.webp`,
    layer: 'top',
    category: 't_shirt',
    name: null,
    colors: [],
    seasons: [],
    brand: null,
    material: null,
    size_label: null,
    notes: null,
    created_at: '2026-11-15T00:00:00Z',
    ...changes,
  };
}

// Query-Builder-Mock: jede Kette ist awaitbar und liefert das nächste Ergebnis aus der Queue.
function createQuery(results: Result[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const next = () => Promise.resolve(results.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'insert', 'eq']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder['single'] = (...args: unknown[]) => {
    calls.push({ method: 'single', args });
    return next();
  };
  return { builder, calls };
}

function setup(options: { garmentResults?: Result[]; session?: { user: { id: string } } | null } = {}) {
  const query = createQuery(options.garmentResults ?? []);
  const bucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  const session = options.session === undefined ? { user: { id: USER_ID } } : options.session;
  const client = {
    from: vi.fn(() => query.builder),
    storage: { from: vi.fn(() => bucket) },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) },
  };

  TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: client }] });
  return { service: TestBed.inject(GarmentService), client, bucket, calls: query.calls };
}

function file(type = 'image/webp'): Blob {
  return new Blob(['img'], { type });
}

const INPUT = { layer: 'top', category: 't_shirt', colors: ['blue'] } as const;

describe('GarmentService', () => {
  describe('createWithImage', () => {
    it('lädt das Bild hoch und legt den Datensatz mit gleicher ID und Pfad an', async () => {
      const created = garment();
      const { service, client, bucket, calls } = setup({ garmentResults: [{ data: created, error: null }] });

      const result = await service.createWithImage(file(), { ...INPUT, colors: [...INPUT.colors] });

      expect(client.storage.from).toHaveBeenCalledWith('garments');
      const [path, body, opts] = bucket.upload.mock.calls[0];
      const match = (path as string).match(new RegExp(`^${USER_ID}/([^/]+)\\.webp$`));
      expect(match).not.toBeNull();
      expect(Array.from(new Uint8Array(body as ArrayBuffer))).toEqual(Array.from(new TextEncoder().encode('img')));
      expect(opts).toEqual({ contentType: 'image/webp' });
      expect(client.from).toHaveBeenCalledWith('garments');
      expect(calls).toContainEqual({
        method: 'insert',
        args: [{ ...INPUT, colors: ['blue'], id: match![1], image_path: path }],
      });
      expect(result).toEqual(created);
    });

    it('wirft bei Upload-Fehler und legt keinen Datensatz an', async () => {
      const error = new Error('upload');
      const { service, bucket, calls } = setup();
      bucket.upload.mockResolvedValue({ data: null, error });

      await expect(service.createWithImage(file(), { ...INPUT, colors: [] })).rejects.toBe(error);
      expect(calls.some((c) => c.method === 'insert')).toBe(false);
    });

    it('löscht die Datei, wenn der Insert fehlschlägt', async () => {
      const error = new Error('db');
      const { service, bucket } = setup({ garmentResults: [{ data: null, error }] });

      await expect(service.createWithImage(file(), { ...INPUT, colors: [] })).rejects.toBe(error);
      const uploadedPath = bucket.upload.mock.calls[0][0];
      expect(bucket.remove).toHaveBeenCalledWith([uploadedPath]);
    });

    it('lehnt nicht erlaubte Dateitypen ab', async () => {
      const { service, bucket } = setup();

      await expect(service.createWithImage(file('image/gif'), { ...INPUT, colors: [] })).rejects.toThrow();
      expect(bucket.upload).not.toHaveBeenCalled();
    });

    it('wirft ohne Login', async () => {
      const { service, bucket } = setup({ session: null });

      await expect(service.createWithImage(file(), { ...INPUT, colors: [] })).rejects.toThrow();
      expect(bucket.upload).not.toHaveBeenCalled();
    });
  });
});
