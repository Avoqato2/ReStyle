import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarmentCardComponent } from './garment-card.component';
import { describe, beforeEach, it, expect } from 'vitest';
import { GarmentService } from '../../supabase/services/garment.service';

describe('GarmentCardComponent', () => {
  let component: GarmentCardComponent;
  let fixture: ComponentFixture<GarmentCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: GarmentService, useValue: { getImageUrl: async () => '' } }],
    });
    fixture = TestBed.createComponent(GarmentCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('garment', {
      id: '1',
      user_id: 'u1',
      image_path: 'u1/1.webp',
      layer: 'top',
      category: 't_shirt',
      name: 'Test-Shirt',
      brand: null,
      colors: [],
      seasons: [],
      material: null,
      size_label: null,
      notes: null,
      created_at: '2026-01-01T00:00:00Z',
      imageUrl: 'https://example.test/1.webp',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
