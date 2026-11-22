import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GarderobePage } from './garderobe.page';
import { describe, beforeEach, it, expect } from 'vitest';

describe('GarderobePage', () => {
  let component: GarderobePage;
  let fixture: ComponentFixture<GarderobePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GarderobePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
