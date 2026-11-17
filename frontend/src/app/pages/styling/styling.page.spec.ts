import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StylingPage } from './styling.page';

describe('StylingPage', () => {
  let component: StylingPage;
  let fixture: ComponentFixture<StylingPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StylingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
