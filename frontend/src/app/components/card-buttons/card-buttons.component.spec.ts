import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardButtonsComponent } from './card-buttons.component';

describe('CardButtonsComponent', () => {
  let component: CardButtonsComponent;
  let fixture: ComponentFixture<CardButtonsComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CardButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
