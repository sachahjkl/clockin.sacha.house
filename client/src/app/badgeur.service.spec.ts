import { BadgeurService } from './core/badgeur.service';
import { TestBed } from '@angular/core/testing';

describe('BadgeurService', () => {
  let service: BadgeurService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BadgeurService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
