import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AddGarmentPage } from './add-garment.page';
import { describe, beforeEach, it, expect } from 'vitest';

describe('AddGarmentPage', () => {
  let component: AddGarmentPage;
  let fixture: ComponentFixture<AddGarmentPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    fixture = TestBed.createComponent(AddGarmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
