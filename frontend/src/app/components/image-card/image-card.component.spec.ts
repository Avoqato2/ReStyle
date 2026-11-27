import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageCardComponent } from './image-card.component';
import { describe, beforeEach, it, expect } from 'vitest';

describe('ImageCardComponent', () => {
  let component: ImageCardComponent;
  let fixture: ComponentFixture<ImageCardComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
