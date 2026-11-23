import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GarmentCardComponent } from './garment-card.component';
import { describe, beforeEach, it, expect } from 'vitest';

describe('GarmentCardComponent', () => {
  let component: GarmentCardComponent;
  let fixture: ComponentFixture<GarmentCardComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GarmentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
