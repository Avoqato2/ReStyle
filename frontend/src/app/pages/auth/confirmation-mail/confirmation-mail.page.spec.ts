import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationMailPage } from './confirmation-mail.page';

describe('ConfirmationMailPage', () => {
  let component: ConfirmationMailPage;
  let fixture: ComponentFixture<ConfirmationMailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationMailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
