import { BehaviorSubject, map, of, withLatestFrom } from 'rxjs';

import { Badgeages } from '../shared/types';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BadgeurService {
  private badgeagesSubject$ = new BehaviorSubject<Badgeages>([]);

  readonly badgeagesObservable$ = this.badgeagesSubject$.asObservable();
  static MAX_BADGEAGES_PER_DAY = 4;

  addBadgeage = (badgeage: Date) => {
    of(badgeage)
      .pipe(withLatestFrom(this.badgeagesObservable$, this.canBadge$))
      .subscribe({
        next: ([badgeage, badgeages, canBadge]) => {
          if (!canBadge) throw Error('tout les badgeages sont faits');
          badgeages.push(badgeage);
          this.badgeagesSubject$.next(badgeages);
        },
      });
  };

  editBadgeage = (position: number, badgeage: Date) =>
    of([position, badgeage] as const).pipe(
      withLatestFrom(this.badgeagesObservable$),
      map(([[position, badgeage], badgeages]) => {
        const newBadgeages = [...badgeages];
        newBadgeages[position] = badgeage;
        this.badgeagesSubject$.next(newBadgeages);
      })
    );

  get canBadge$() {
    return this.badgeagesSubject$.pipe(
      map(
        badgeages =>
          badgeages.filter(e => !!e).length !==
          BadgeurService.MAX_BADGEAGES_PER_DAY
      )
    );
  }
}
