import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LooksPage } from './looks.page';

describe('LooksPage', () => {
  let component: LooksPage;
  let fixture: ComponentFixture<LooksPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(LooksPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
