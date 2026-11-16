import { TestBed } from '@angular/core/testing';
import { PhotoService } from './photo.service';
import { describe, beforeEach, it, expect } from 'vitest';

describe('PhotoService', () => {
  let service: PhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
