import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeurBtnComponent } from '../badgeur/badgeur.component';

describe('BadgeurBtnComponent', () => {
  let component: BadgeurBtnComponent;
  let fixture: ComponentFixture<BadgeurBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgeurBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeurBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
