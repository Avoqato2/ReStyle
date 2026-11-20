import { type GarmentInsert } from '../../supabase/services/garment.service';
import { type OutfitItem } from '../../supabase/services/outfit.service';

// 1. Typen exportieren
export type GarmentLayer = NonNullable<OutfitItem['layer']>;
export type GarmentCategory = GarmentInsert['category'];
export type GarmentMaterial = NonNullable<GarmentInsert['material']>;
export type GarmentColor = NonNullable<GarmentInsert['colors']>[number];
export type GarmentSeason = NonNullable<GarmentInsert['seasons']>[number];

// Hilfsfunktion, um aus einem Record direkt ein Array für @for zu bauen
function mapToOptions<T extends string>(labels: Partial<Record<T, string>>): { value: T; label: string }[] {
  return (Object.entries(labels) as [T, string | undefined][])
    .filter((entry): entry is [T, string] => Boolean(entry[1]?.trim()))
    .map(([value, label]) => ({ value, label }));
}

export const LAYER_LABELS: Record<GarmentLayer, string> = {
  top: 'Oberteile',
  bottom: 'Unterteile',
  full_body: 'Einteiler',
  shoes: 'Schuhe',
  outer: 'Jacken/Mäntel',
};
// 2. Label-Mappings (für Einzelanzeigen wie Detail-Pages)
export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
  jacket: 'Jacke',
  blazer: 'Blazer',
  coat: 'Mantel',
  t_shirt: 'T-Shirt',
  shirt: 'Hemd',
  blouse: 'Bluse',
  polo: 'Poloshirt',
  tank_top: 'Tanktop',
  sweater: 'Pullover',
  hoodie: 'Hoodie',
  cardigan: 'Strickjacke',
  jeans: 'Jeans',
  trousers: 'Hose',
  shorts: 'Shorts',
  skirt: 'Rock',
  leggings: 'Leggings',
  sweatpants: 'Jogginghose',
  dress: 'Kleid',
  jumpsuit: 'Jumpsuit',
  sneakers: 'Sneaker',
  boots: 'Stiefel',
  sandals: 'Sandalen',
  heels: 'Absatzschuhe',
  dress_shoes: 'Elegante Schuhe',
  other: 'Sonstiges',
};

export const SEASON_LABELS: Partial<Record<GarmentSeason, string>> = {
  spring: 'Frühling',
  summer: 'Sommer',
  autumn: 'Herbst', // falls dein Enum 'fall' nutzt, entsprechend anpassen
  winter: 'Winter',
  transitional_season: '',
};

export const MATERIAL_LABELS: Partial<Record<GarmentMaterial, string>> = {
  // Werte passend zu deinem Supabase-Enum eintragen, z. B.:
  cotton: 'Baumwolle',
  wool: 'Wolle',
  leather: 'Leder',
  denim: 'Denim',
  polyester: 'Polyester',
  linen: 'Leinen',
  silk: 'Seide',
  other: 'Sonstiges',
  cashmere: '',
  faux_leather: '',
  suede: '',
  viscose: '',
  nylon: '',
};

export const COLOR_LABELS: Record<GarmentColor, string> = {
  black: 'Schwarz',
  white: 'Weiß',
  grey: 'Grau',
  beige: 'Beige',
  brown: 'Braun',
  red: 'Rot',
  pink: 'Rosa',
  orange: 'Orange',
  yellow: 'Gelb',
  green: 'Grün',
  blue: 'Blau',
  purple: 'Lila',
  gold: 'Gold',
  silver: 'Silber',
  petrol: 'Petrol',
  turquoise: 'Türkis',
  olive: 'Oliv',
  multicolor: 'Mehrfarbig',
};

export const GARMENT_CATEGORIES = mapToOptions(CATEGORY_LABELS);
export const GARMENT_SEASONS = mapToOptions(SEASON_LABELS);
export const GARMENT_MATERIALS = mapToOptions(MATERIAL_LABELS);
export const GARMENT_COLORS = mapToOptions(COLOR_LABELS);
export const GARMENT_LAYERS = mapToOptions(LAYER_LABELS);
