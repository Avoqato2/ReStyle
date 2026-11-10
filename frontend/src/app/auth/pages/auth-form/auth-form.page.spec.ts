import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthFormPage } from './auth-form.page';

describe('AuthFormPage', () => {
  let component: AuthFormPage;
  let fixture: ComponentFixture<AuthFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
