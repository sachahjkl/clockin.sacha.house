import { TestBed } from '@angular/core/testing';

import { BadgeurService } from './badgeur.service';

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
