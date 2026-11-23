import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GarmentCardComponent } from './garment-card.component';
import { describe, beforeEach, it, expect } from 'vitest';

describe('GarmentCardComponent', () => {
  let component: GarmentCardComponent;
  let fixture: ComponentFixture<GarmentCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(GarmentCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
