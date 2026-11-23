import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonTextarea,
  IonLabel,
  NavController,
  IonAccordion,
  IonItem,
  IonAccordionGroup,
} from '@ionic/angular';

import { PhotoService } from '../../services/photo.service';
import { GarmentInput, GarmentService } from '../../supabase/services/garment.service';
import { AppButtonComponent } from '../../components/app-button/app-button.component';
import { AppInputComponent } from '../../components/app-input/app-input.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';

import {
  GARMENT_CATEGORIES,
  GARMENT_MATERIALS,
  GARMENT_COLORS,
  GarmentCategory,
  GarmentColor,
  GarmentMaterial,
  GarmentSeason,
  GARMENT_SEASONS,
  GARMENT_LAYERS,
  GarmentLayer,
  COLOR_LABELS,
  CATEGORY_LABELS,
  CATEGORIES_BY_LAYER,
} from './garment.constants';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-garment',
  templateUrl: './add-garment.page.html',
  styleUrls: ['./add-garment.page.scss'],
  standalone: true,
  imports: [
    IonItem,
    IonLabel,
    IonContent,
    IonTextarea,
    CommonModule,
    FormsModule,
    AppButtonComponent,
    AppInputComponent,
    IonAccordion,
    IonAccordionGroup,
    AppHeaderComponent,
  ],
})
export class AddGarmentPage {
  // edit garment
  private route = inject(ActivatedRoute);
  garmentId = signal<string | null>(null);
  isEditMode = computed(() => Boolean(this.garmentId()));

  openAccordions = ['garmentName', 'Layer', 'Kategorie', 'Saison', 'Marke', 'Farbpalette', 'Material', 'Notizen'];
  private photoService = inject(PhotoService);
  private garmentService = inject(GarmentService);
  private navCtrl = inject(NavController);

  // Text-Felder
  name = signal<string>('');
  isNameManuallyEdited = signal<boolean>(false);
  garmentNumber = signal<number>(1);

  generatedName = computed(() => {
    const parts: string[] = [];

    const brand = this.brand().trim();
    if (brand) {
      parts.push(brand);
    }

    const firstColor = this.colorsArray()[0];
    if (firstColor) {
      parts.push(COLOR_LABELS[firstColor] ?? firstColor);
    }

    const category = this.selectedCategory();
    if (category) {
      parts.push(CATEGORY_LABELS[category] ?? category);
    }

    // Nummer nur anhängen, wenn schon mindestens ein Teil zum Namen beiträgt
    if (parts.length > 0) {
      parts.push(`#${this.garmentNumber()}`);
    }

    return parts.join(' ');
  });

  // Angezeigter & gespeicherter Name: manuelle Eingabe hat Vorrang vor Auto-Name
  effectiveName = computed(() => (this.isNameManuallyEdited() ? this.name() : this.generatedName()));

  brand = signal<string>('');
  notes = signal<string>('');

  // Bild-State
  imageBlob = signal<Blob | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  isProcessingImage = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  readonly categories = GARMENT_CATEGORIES;
  readonly colors = GARMENT_COLORS;
  readonly materials = GARMENT_MATERIALS;
  readonly seasons = GARMENT_SEASONS;
  readonly layers = GARMENT_LAYERS;

  // Auswahl-States als Signals
  selectedCategory = signal<GarmentCategory | null>(null);
  selectedMaterial = signal<GarmentMaterial | null>(null);
  selectedSeasons = signal<Set<GarmentSeason>>(new Set());
  selectedColors = signal<Set<GarmentColor>>(new Set());
  selectedLayer = signal<GarmentLayer | null>(null);

  // Arrays für den späteren Supabase-Insert
  seasonsArray = computed(() => [...this.selectedSeasons()]);
  colorsArray = computed(() => [...this.selectedColors()]);

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    this.garmentId.set(id);

    if (id) {
      await this.loadGarmentForEdit(id);
      return;
    }
    try {
      const existing = await this.garmentService.getAll();
      this.garmentNumber.set(existing.length + 1);
    } catch {
      this.garmentNumber.set(1);
    }

    if (!this.imageBlob()) {
      await this.pickImage();
    }
  }

  private async loadGarmentForEdit(id: string) {
    try {
      this.isProcessingImage.set(true);
      const garment = await this.garmentService.getById(id);

      if (!garment) {
        this.navCtrl.back();
        return;
      }

      // Werte in signals laden
      this.name.set(garment.name ?? '');
      this.isNameManuallyEdited.set(Boolean(garment.name));
      this.brand.set(garment.brand ?? '');
      this.notes.set(garment.notes ?? '');
      this.selectedLayer.set(garment.layer);
      this.selectedCategory.set(garment.category);
      this.selectedMaterial.set(garment.material ?? null);
      this.selectedSeasons.set(new Set(garment.seasons ?? []));
      this.selectedColors.set(new Set(garment.colors ?? []));

      if (garment.image_path) {
        const urls = await this.garmentService.getImageUrls([garment.image_path]);
        this.imagePreviewUrl.set(urls[garment.image_path] ?? null);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Kleidungsstücks:', error);
      this.navCtrl.back();
    } finally {
      this.isProcessingImage.set(false);
    }
  }

  ionViewDidLeave() {
    const url = this.imagePreviewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.imagePreviewUrl.set(null);
    }
    this.imageBlob.set(null);
    this.resetForm();
  }

  onNameInput(value: string) {
    this.name.set(value);
    this.isNameManuallyEdited.set(value.trim().length > 0);
  }

  private resetForm() {
    this.name.set('');
    this.isNameManuallyEdited.set(false);
    this.brand.set('');
    this.notes.set('');
    this.selectedLayer.set(null);
    this.selectedCategory.set(null);
    this.selectedMaterial.set(null);
    this.selectedSeasons.set(new Set());
    this.selectedColors.set(new Set());
  }

  // Prüft Pflichtfelder
  canSave = computed(() => {
    const hasImage = this.isEditMode()
      ? Boolean(this.imageBlob() || this.imagePreviewUrl())
      : Boolean(this.imageBlob());

    return Boolean(
      hasImage &&
      this.selectedLayer() &&
      this.selectedSeasons().size > 0 &&
      this.selectedCategory() &&
      this.selectedColors().size > 0 &&
      !this.isSaving(),
    );
  });

  async submit(): Promise<void> {
    if (!this.canSave()) return;

    const garment: GarmentInput = {
      name: this.effectiveName().trim() || null,
      brand: this.brand().trim() || null,
      notes: this.notes().trim() || null,
      layer: this.selectedLayer()!,
      category: this.selectedCategory()!,
      material: this.selectedMaterial(),
      seasons: this.seasonsArray(),
      colors: this.colorsArray(),
    };

    try {
      this.isSaving.set(true);
      const editId = this.garmentId();

      if (editId) {
        await this.garmentService.update(editId, garment);
      } else {
        await this.garmentService.createWithImage(this.imageBlob()!, garment);
      }

      this.navCtrl.back();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  discard(): void {
    this.navCtrl.back();
  }

  async pickImage() {
    try {
      this.isProcessingImage.set(true);
      const blob = await this.photoService.captureGarmentImage();

      const oldUrl = this.imagePreviewUrl();
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }

      this.imageBlob.set(blob);
      this.imagePreviewUrl.set(URL.createObjectURL(blob));
    } catch (error) {
      if (!this.imageBlob()) {
        this.navCtrl.back();
      } else {
        console.log(error);
      }
    } finally {
      this.isProcessingImage.set(false);
    }
  }

  isSelected(category: GarmentCategory): boolean {
    return this.selectedCategory() === category;
  }

  private toggleInSet<T>(targetSignal: ReturnType<typeof signal<Set<T>>>, value: T) {
    targetSignal.update((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  filteredCategories = computed(() => {
    const layer = this.selectedLayer();
    if (!layer) return this.categories;

    const allowed = CATEGORIES_BY_LAYER[layer] ?? [];
    return this.categories.filter((c) => allowed.includes(c.value));
  });

  toggleLayer(val: GarmentLayer) {
    const nextLayer = this.selectedLayer() === val ? null : val;
    this.selectedLayer.set(nextLayer);

    const currentCat = this.selectedCategory();
    if (nextLayer && currentCat && !CATEGORIES_BY_LAYER[nextLayer]?.includes(currentCat)) {
      this.selectedCategory.set(null);
    }
  }
  toggleCategory(val: GarmentCategory) {
    this.selectedCategory.update((current) => (current === val ? null : val));
  }
  toggleSeason(val: GarmentSeason) {
    this.toggleInSet(this.selectedSeasons, val);
  }
  toggleColor(val: GarmentColor) {
    this.toggleInSet(this.selectedColors, val);
  }
  toggleMaterial(val: GarmentMaterial) {
    this.selectedMaterial.update((current) => (current === val ? null : val));
  }
}
