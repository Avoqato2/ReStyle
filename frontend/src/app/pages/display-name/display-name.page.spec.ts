import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisplayNamePage } from './display-name.page';

describe('DisplayNamePage', () => {
  let component: DisplayNamePage;
  let fixture: ComponentFixture<DisplayNamePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayNamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
