import { TestBed } from '@angular/core/testing';

import { SUPABASE_CLIENT } from '../supabase.client';
import { ProfileService } from '../services/profile.service';
import type { Tables } from '../supabase.types';

type Profile = Tables<'profiles'>;
type Result = { data: unknown; error: unknown };

const USER_ID = 'user-1';

function profile(changes: Partial<Profile> = {}): Profile {
  return {
    id: USER_ID,
    display_name: 'Anna',
    preferences: {},
    created_at: '2026-11-14T00:00:00Z',
    avatar_path: null,
    clothing_preference: null,
    ...changes,
  };
}

// Query-Builder-Mock: jede Kette ist awaitbar und liefert das nächste Ergebnis aus der Queue.
function createQuery(results: Result[]) {
  const calls: { method: string; args: unknown[] }[] = [];
  const next = () => Promise.resolve(results.shift() ?? { data: null, error: null });
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'update', 'eq']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  for (const method of ['single', 'maybeSingle']) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return next();
    };
  }
  builder['then'] = (resolve: (r: Result) => unknown, reject: (e: unknown) => unknown) => next().then(resolve, reject);
  return { builder, calls };
}

function setup(options: { profileResults?: Result[]; session?: { user: { id: string } } | null } = {}) {
  const query = createQuery(options.profileResults ?? []);
  const bucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
    remove: vi.fn().mockResolvedValue({ data: [], error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.test/a' }, error: null }),
  };
  const session = options.session === undefined ? { user: { id: USER_ID } } : options.session;
  const client = {
    from: vi.fn(() => query.builder),
    storage: { from: vi.fn(() => bucket) },
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }) },
  };

  TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: client }] });
  return { service: TestBed.inject(ProfileService), client, bucket, calls: query.calls };
}

function file(type = 'image/jpeg'): Blob {
  return new Blob(['img'], { type });
}

describe('ProfileService', () => {
  describe('getOwn', () => {
    it('lädt das Profil des eingeloggten Users', async () => {
      const { service, client, calls } = setup({ profileResults: [{ data: profile(), error: null }] });

      await expect(service.getOwn()).resolves.toEqual(profile());
      expect(client.from).toHaveBeenCalledWith('profiles');
      expect(calls).toContainEqual({ method: 'eq', args: ['id', USER_ID] });
    });

    it('wirft bei DB-Fehler', async () => {
      const error = new Error('db');
      const { service } = setup({ profileResults: [{ data: null, error }] });

      await expect(service.getOwn()).rejects.toBe(error);
    });

    it('wirft ohne Login', async () => {
      const { service } = setup({ session: null });

      await expect(service.getOwn()).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('ändert das eigene Profil und gibt es zurück', async () => {
      const updated = profile({ clothing_preference: 'unisex' });
      const { service, calls } = setup({ profileResults: [{ data: updated, error: null }] });

      await expect(service.update({ clothing_preference: 'unisex' })).resolves.toEqual(updated);
      expect(calls).toContainEqual({ method: 'update', args: [{ clothing_preference: 'unisex' }] });
      expect(calls).toContainEqual({ method: 'eq', args: ['id', USER_ID] });
    });

    it('wirft bei DB-Fehler', async () => {
      const error = new Error('db');
      const { service } = setup({ profileResults: [{ data: null, error }] });

      await expect(service.update({ display_name: 'x' })).rejects.toBe(error);
    });
  });

  describe('uploadAvatar', () => {
    it('lädt das Bild in den eigenen Ordner und speichert den Pfad', async () => {
      const { service, client, bucket, calls } = setup({
        profileResults: [
          { data: profile(), error: null },
          { data: profile({ avatar_path: 'neu' }), error: null },
        ],
      });

      const result = await service.uploadAvatar(file('image/png'));

      expect(client.storage.from).toHaveBeenCalledWith('avatars');
      const [path, body, opts] = bucket.upload.mock.calls[0];
      expect(path).toMatch(new RegExp(`^${USER_ID}/[^/]+\\.png$`));
      // Rohe Bytes statt Blob/FormData, damit der Upload unabhängig von der FormData-Implementierung ist.
      expect(Array.from(new Uint8Array(body as ArrayBuffer))).toEqual(Array.from(new TextEncoder().encode('img')));
      expect(opts).toEqual({ contentType: 'image/png' });
      expect(calls).toContainEqual({ method: 'update', args: [{ avatar_path: path }] });
      expect(result.avatar_path).toBe('neu');
    });

    it('löscht das alte Bild nach erfolgreichem Upload', async () => {
      const { service, bucket } = setup({
        profileResults: [
          { data: profile({ avatar_path: `${USER_ID}/alt.jpg` }), error: null },
          { data: profile(), error: null },
        ],
      });

      await service.uploadAvatar(file());

      expect(bucket.remove).toHaveBeenCalledWith([`${USER_ID}/alt.jpg`]);
    });

    it('wirft bei Upload-Fehler und ändert das Profil nicht', async () => {
      const error = new Error('upload');
      const { service, bucket, calls } = setup({ profileResults: [{ data: profile(), error: null }] });
      bucket.upload.mockResolvedValue({ data: null, error });

      await expect(service.uploadAvatar(file())).rejects.toBe(error);
      expect(calls.some((c) => c.method === 'update')).toBe(false);
    });

    it('löscht die neue Datei, wenn das Speichern im Profil fehlschlägt', async () => {
      const error = new Error('db');
      const { service, bucket } = setup({
        profileResults: [
          { data: profile({ avatar_path: `${USER_ID}/alt.jpg` }), error: null },
          { data: null, error },
        ],
      });

      await expect(service.uploadAvatar(file())).rejects.toBe(error);
      const uploadedPath = bucket.upload.mock.calls[0][0];
      expect(bucket.remove).toHaveBeenCalledWith([uploadedPath]);
      expect(bucket.remove).not.toHaveBeenCalledWith([`${USER_ID}/alt.jpg`]);
    });

    it('lehnt nicht erlaubte Dateitypen ab', async () => {
      const { service, bucket } = setup({ profileResults: [{ data: profile(), error: null }] });

      await expect(service.uploadAvatar(file('image/gif'))).rejects.toThrow();
      expect(bucket.upload).not.toHaveBeenCalled();
    });
  });

  describe('removeAvatar', () => {
    it('setzt avatar_path auf null und löscht die Datei', async () => {
      const { service, bucket, calls } = setup({
        profileResults: [
          { data: profile({ avatar_path: `${USER_ID}/alt.jpg` }), error: null },
          { data: profile(), error: null },
        ],
      });

      await expect(service.removeAvatar()).resolves.toEqual(profile());
      expect(calls).toContainEqual({ method: 'update', args: [{ avatar_path: null }] });
      expect(bucket.remove).toHaveBeenCalledWith([`${USER_ID}/alt.jpg`]);
    });

    it('macht ohne Profilbild nichts im Storage', async () => {
      const { service, bucket } = setup({ profileResults: [{ data: profile(), error: null }] });

      await expect(service.removeAvatar()).resolves.toEqual(profile());
      expect(bucket.remove).not.toHaveBeenCalled();
    });

    it('löscht die Datei nicht, wenn das Profil-Update fehlschlägt', async () => {
      const error = new Error('db');
      const { service, bucket } = setup({
        profileResults: [
          { data: profile({ avatar_path: `${USER_ID}/alt.jpg` }), error: null },
          { data: null, error },
        ],
      });

      await expect(service.removeAvatar()).rejects.toBe(error);
      expect(bucket.remove).not.toHaveBeenCalled();
    });
  });

  describe('getAvatarUrl', () => {
    it('liefert eine Signed URL aus dem avatars-Bucket', async () => {
      const { service, client, bucket } = setup();

      await expect(service.getAvatarUrl(`${USER_ID}/a.jpg`)).resolves.toBe('https://signed.test/a');
      expect(client.storage.from).toHaveBeenCalledWith('avatars');
      expect(bucket.createSignedUrl).toHaveBeenCalledWith(`${USER_ID}/a.jpg`, 3600);
    });

    it('wirft bei Fehler', async () => {
      const error = new Error('sign');
      const { service, bucket } = setup();
      bucket.createSignedUrl.mockResolvedValue({ data: null, error });

      await expect(service.getAvatarUrl('p')).rejects.toBe(error);
    });
  });
});
