import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddGarmentPage } from './add-garment.page';
import { describe, beforeEach, it, expect } from 'vitest';

describe('AddGarmentPage', () => {
  let component: AddGarmentPage;
  let fixture: ComponentFixture<AddGarmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AddGarmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
