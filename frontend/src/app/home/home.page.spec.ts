import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePage } from './home.page';
import { describe, beforeEach, it, expect } from 'vitest';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
