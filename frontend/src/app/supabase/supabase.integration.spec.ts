import { TestBed } from '@angular/core/testing';

import { AuthService } from './services/auth.service';
import { GarmentService } from './services/garment.service';
import { OutfitService } from './services/outfit.service';

describe.skipIf(process.env['CI'])('Supabase integration', () => {
  let authService: AuthService;
  let garmentService: GarmentService;
  let outfitService: OutfitService;

  // Für jeden Testlauf wird eine neue E-Mail-Adresse verwendet.
  const testUser = {
    email: `integration-${Date.now()}@test.local`,
    password: 'password123',
  };
  const passwordPlaceholder = '<password>';
  // Lokales Testpostfach der Supabase-CLI
  const MAILPIT_URL = 'http://127.0.0.1:54324';

  // Diese IDs werden während der Testvorbereitung erzeugt und danach verwendet.
  let testGarmentId: string;
  let testOutfitId: string;

  beforeAll(async () => {
    // TestBed erstellt die Services wie Angular sie auch in der App
    // per Dependency Injection erstellen würde.
    TestBed.configureTestingModule({});
    authService = TestBed.inject(AuthService);
    garmentService = TestBed.inject(GarmentService);
    outfitService = TestBed.inject(OutfitService);

    // Der Test startet mit einem echten neuen Benutzer statt mit einem
    // fest im seed.sql angelegten Benutzer.
    const registration = await authService.signUp(testUser.email, testUser.password);
    logCall('AuthService.signUp', { email: testUser.email, password: passwordPlaceholder }, registration);

    if (!registration.ok) {
      throw new Error(`Testbenutzer konnte nicht registriert werden: ${registration.error.message}`);
    }

    // Mit aktiver E-Mail-Bestätigung bestätigt loginAsTestUser() die Adresse
    // vorher über das lokale Testpostfach.
    await loginAsTestUser();

    // Für die Lese- und Update-Tests werden eigene Testdaten angelegt.
    const garment = await garmentService.create({
      image_path: 'integration-test/garment.png',
      layer: 'top',
      category: 't_shirt',
      name: 'Integration Test Garment',
    });
    testGarmentId = garment.id;
    logCall('GarmentService.create', { table: 'garments', data: garment }, garment);

    const outfit = await outfitService.create({
      name: 'Integration Test Outfit',
    });
    testOutfitId = outfit.id;
    logCall('OutfitService.create', { table: 'outfits', data: outfit }, outfit);

    await outfitService.saveItems(testOutfitId, [
      {
        layer: 'top',
        garment_id: testGarmentId,
      },
    ]);
    logCall(
      'OutfitService.saveItems / RPC save_outfit',
      {
        function: 'save_outfit',
        outfitId: testOutfitId,
        items: [{ layer: 'top', garment_id: testGarmentId }],
      },
      { success: true },
    );

    await logout();
  });

  afterAll(async () => {
    // Die Testdaten werden wieder entfernt, damit keine Garments oder Outfits
    // aus dem Testlauf in der lokalen Datenbank liegen bleiben.
    await loginAsTestUser();

    if (testOutfitId) {
      await outfitService.delete(testOutfitId);
      logCall('OutfitService.delete', { table: 'outfits', id: testOutfitId }, { success: true });
    }

    if (testGarmentId) {
      await garmentService.delete(testGarmentId);
      logCall('GarmentService.delete', { table: 'garments', id: testGarmentId }, { success: true });
    }

    await logout();
  });

  beforeEach(async () => {
    // Jeder Test meldet den Testbenutzer erneut an, damit Tests unabhängig
    // voneinander bleiben, auch wenn ein vorheriger Test logout aufruft.
    await loginAsTestUser();
  });

  afterEach(async () => {
    await logout();
  });

  async function loginAsTestUser(): Promise<void> {
    const request = {
      email: testUser.email,
      password: passwordPlaceholder,
    };
    let result = await authService.signIn(testUser.email, testUser.password);
    logCall('AuthService.signIn', request, result);

    if (!result.ok && result.error.code === 'email_not_confirmed') {
      await confirmEmailViaMailpit(testUser.email);
      result = await authService.signIn(testUser.email, testUser.password);
      logCall('AuthService.signIn', request, result);
    }

    if (!result.ok) {
      throw new Error(`Testbenutzer konnte nicht angemeldet werden: ${result.error.message}`);
    }
  }

  // Öffnet den Bestätigungslink aus dem lokalen Testpostfach (Mailpit, `[local_smtp]`
  // in config.toml). Der Verify-Endpoint bestätigt die Adresse schon beim Aufruf;
  // die Weiterleitung auf restyle://… wird nicht verfolgt.
  async function confirmEmailViaMailpit(email: string): Promise<void> {
    const search = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (!messages.length) {
      throw new Error(`Keine Bestätigungsmail für ${email} in Mailpit gefunden`);
    }

    const message = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`)).json()) as {
      HTML: string;
      Text: string;
    };
    const link = `${message.HTML} ${message.Text}`.match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]*/)?.[0];
    if (!link) {
      throw new Error('Kein Bestätigungslink in der Mail gefunden');
    }

    await fetch(link.replaceAll('&amp;', '&'), { redirect: 'manual' });
    logCall('Mailpit: Bestätigungslink öffnen', { email }, { confirmed: true });
  }

  async function logout(): Promise<void> {
    await authService.logout();
    logCall('AuthService.logout', undefined, { success: true });
  }

  function logCall(operation: string, request?: unknown, result?: unknown): void {
    // Die Überschrift erklärt die fachliche Aktion. Darunter stehen die
    // Anfrage und das Ergebnis gemeinsam, damit der Ablauf nachvollziehbar ist.
    const taskTitles: Record<string, string> = {
      'AuthService.signIn': 'Melde Testbenutzer an',
      'AuthService.logout': 'Melde Testbenutzer ab',
      'AuthService.getSession': 'Prüfe aktuelle Session',
      'AuthService.signUp': 'Registriere neuen Testbenutzer',
      'GarmentService.getAll': 'Lade alle Test-Garments',
      'GarmentService.getById': 'Lade ein Test-Garment',
      'GarmentService.getById (Löschkontrolle)': 'Prüfe gelöschtes Test-Garment',
      'GarmentService.create': 'Erstelle Test-Garment',
      'GarmentService.update': 'Update bestehendes Test-Garment',
      'GarmentService.delete': 'Lösche Test-Garment',
      'OutfitService.getAll': 'Lade alle Test-Outfits',
      'OutfitService.getItems': 'Lade Outfit-Zuordnungen',
      'OutfitService.getAll + OutfitService.getItems': 'Lade Test-Outfit und Zuordnungen',
      'OutfitService.getById': 'Lade ein Test-Outfit',
      'OutfitService.getById (Löschkontrolle)': 'Prüfe gelöschtes Test-Outfit',
      'OutfitService.create': 'Erstelle Test-Outfit',
      'OutfitService.update': 'Update bestehendes Test-Outfit',
      'OutfitService.saveItems / RPC save_outfit': 'Speichere Outfit-Zuordnungen',
      'OutfitService.delete': 'Lösche Test-Outfit',
    };

    console.log(`[SUPABASE] Task: ${taskTitles[operation] ?? 'Führe Supabase-Operation aus'}:`);
    console.log(operation, {
      request: request ?? {},
      result: result ?? {},
    });
  }

  describe('AuthService', () => {
    it('registers a new user and reads the session', async () => {
      // Der neue Benutzer wurde in beforeAll registriert. Hier wird geprüft,
      // ob Supabase die Session für diesen Benutzer bereitstellt.
      const session = await authService.getSession();
      logCall('AuthService.getSession', undefined, {
        userId: session?.user.id,
        email: session?.user.email,
        hasAccessToken: Boolean(session?.access_token),
      });

      expect(session?.user.email).toBe(testUser.email);
    });

    it('logs out and removes the local session', async () => {
      await authService.logout();
      const session = await authService.getSession();
      logCall('AuthService.logout + AuthService.getSession', undefined, session);

      expect(session).toBeNull();
    });

    it('rejects invalid login data', async () => {
      await authService.logout();
      const result = await authService.signIn(testUser.email, 'wrong-password');
      logCall(
        'AuthService.signIn',
        { email: testUser.email, password: passwordPlaceholder },
        result,
      );
      expect(result.ok).toBe(false);
    });

    it('does not reveal whether the email already exists', async () => {
      const result = await authService.signUp(testUser.email, testUser.password);
      logCall(
        'AuthService.signUp',
        { email: testUser.email, password: passwordPlaceholder },
        result,
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('GarmentService', () => {
    it('loads the new user garments', async () => {
      const garments = await garmentService.getAll();
      logCall('GarmentService.getAll', { table: 'garments', user: testUser.email }, {
        count: garments.length,
        garments,
      });

      expect(garments.some((garment) => garment.id === testGarmentId)).toBe(true);
    });

    it('loads one garment by id', async () => {
      const garment = await garmentService.getById(testGarmentId);
      logCall('GarmentService.getById', { table: 'garments', id: testGarmentId }, garment);

      expect(garment?.id).toBe(testGarmentId);
      expect(garment?.name).toBe('Integration Test Garment');
    });

    it('creates, updates and deletes a garment', async () => {
      let createdId: string | undefined;

      try {
        const created = await garmentService.create({
          image_path: 'integration-test/temporary-garment.png',
          layer: 'top',
          category: 't_shirt',
          name: 'Temporary Integration Garment',
        });
        createdId = created.id;
        logCall('GarmentService.create', { table: 'garments', data: created }, created);

        const updated = await garmentService.update(createdId, {
          name: 'Updated Integration Test Garment',
        });
        logCall(
          'GarmentService.update',
          { table: 'garments', id: createdId, changes: { name: 'Updated Integration Test Garment' } },
          updated,
        );

        expect(updated.name).toBe('Updated Integration Test Garment');
      } finally {
        if (createdId) {
          await garmentService.delete(createdId);
          logCall('GarmentService.delete', { table: 'garments', id: createdId }, { success: true });
        }
      }

      const deletedGarment = await garmentService.getById(createdId as string);
      logCall('GarmentService.getById (Löschkontrolle)', { table: 'garments', id: createdId }, deletedGarment);
      expect(deletedGarment).toBeNull();
    });
  });

  describe('OutfitService', () => {
    it('loads outfits and their outfit items', async () => {
      const outfits = await outfitService.getAll();
      const items = await outfitService.getItems(testOutfitId);
      logCall(
        'OutfitService.getAll + OutfitService.getItems',
        { tables: ['outfits', 'outfit_items'], outfitId: testOutfitId },
        { outfits, items },
      );

      expect(outfits.some((outfit) => outfit.id === testOutfitId)).toBe(true);
      expect(items).toHaveLength(1);
      expect(items[0].garment_id).toBe(testGarmentId);
    });

    it('loads one outfit by id', async () => {
      const outfit = await outfitService.getById(testOutfitId);
      logCall('OutfitService.getById', { table: 'outfits', id: testOutfitId }, outfit);

      expect(outfit?.id).toBe(testOutfitId);
      expect(outfit?.name).toBe('Integration Test Outfit');
    });

    it('creates, updates, saves items and deletes an outfit', async () => {
      let createdId: string | undefined;

      try {
        const created = await outfitService.create({
          name: 'Temporary Integration Outfit',
        });
        createdId = created.id;
        logCall('OutfitService.create', { table: 'outfits', data: created }, created);

        const updated = await outfitService.update(createdId, {
          name: 'Updated Integration Test Outfit',
        });
        logCall(
          'OutfitService.update',
          { table: 'outfits', id: createdId, changes: { name: 'Updated Integration Test Outfit' } },
          updated,
        );

        const itemsToSave = [{ layer: 'top' as const, garment_id: testGarmentId }];
        await outfitService.saveItems(createdId, itemsToSave);
        logCall(
          'OutfitService.saveItems / RPC save_outfit',
          { function: 'save_outfit', outfitId: createdId, items: itemsToSave },
          { success: true },
        );

        const items = await outfitService.getItems(createdId);
        logCall('OutfitService.getItems', { table: 'outfit_items', outfitId: createdId }, items);

        expect(updated.name).toBe('Updated Integration Test Outfit');
        expect(items).toHaveLength(1);
        expect(items[0].garment_id).toBe(testGarmentId);
      } finally {
        if (createdId) {
          await outfitService.delete(createdId);
          logCall('OutfitService.delete', { table: 'outfits', id: createdId }, { success: true });
        }
      }

      const deletedOutfit = await outfitService.getById(createdId as string);
      logCall('OutfitService.getById (Löschkontrolle)', { table: 'outfits', id: createdId }, deletedOutfit);
      expect(deletedOutfit).toBeNull();
    });
  });
});
