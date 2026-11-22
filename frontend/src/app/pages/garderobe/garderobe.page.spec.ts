import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GarderobePage } from './garderobe.page';
import { GarmentService } from '../../supabase/services/garment.service';

describe('GarderobePage', () => {
  let component: GarderobePage;
  let fixture: ComponentFixture<GarderobePage>;

  beforeEach(async () => {
    const garmentServiceMock = {
      getAll: vi.fn().mockResolvedValue([]),
      getImageUrls: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [GarderobePage],
      providers: [provideRouter([]), { provide: GarmentService, useValue: garmentServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(GarderobePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
