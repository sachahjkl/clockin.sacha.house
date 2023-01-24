import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { Badgeages } from '../core/types';
import { BadgeurService } from '../core/badgeur.service';
import Duration from 'duration';
import { client } from '../core/trpc';

// import { Option, none } from 'fp-ts/Option';

@Component({
  selector: 'app-badgeur-detail',
  templateUrl: './badgeur-detail.component.html',
  styleUrls: ['./badgeur-detail.component.css'],
})
export class BadgeurDetailComponent implements OnInit {
  ngOnInit(): void {
    client.user.greet.query().then(data => (this.greet = data));
  }
  @Input() badgeages: Badgeages | null = [];

  @Output() editBadgeageEvent = new EventEmitter<{
    position: number;
    badgeage: Date;
  }>();

  readonly daysOfWeek = this.getDaysOfWeek();

  readonly dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });

  readonly shortFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });

  greet = 'Chargement...';

  adjustedBadgeages(_day: Date) {
    const adjustedBadgeages = [...(this.badgeages || [])];
    if (adjustedBadgeages.length < BadgeurService.MAX_BADGEAGES_PER_DAY)
      adjustedBadgeages.push(
        ...new Array(
          BadgeurService.MAX_BADGEAGES_PER_DAY - adjustedBadgeages.length
        )
      );
    return adjustedBadgeages;
  }

  private decomposeWrittenTime(toParse: string) {
    const [hours, minutes, seconds = '0'] = toParse.split(':');
    if (!(hours && minutes)) return;

    const hoursParsed = parseInt(hours);
    const minutesParsed = parseInt(minutes);
    const secondsParsed = parseInt(seconds);
    if (isNaN(hoursParsed) || isNaN(minutesParsed) || isNaN(secondsParsed))
      return;
    console.info([hoursParsed, minutesParsed, secondsParsed]);
    return [hoursParsed, minutesParsed, secondsParsed];
  }

  editBadgeage(position: number, submitted: string) {
    try {
      const parsed = this.decomposeWrittenTime(submitted);
      console.log(parsed);
      if (!parsed) return;

      const badgeage = this.badgeages?.at(position) ?? new Date();
      badgeage.setHours(parsed[0]);
      badgeage.setMinutes(parsed[1]);
      badgeage.setSeconds(parsed[2]);
      this.editBadgeageEvent.emit({ position, badgeage });
    } catch (error) {
      return;
    }
  }

  getValue(event: Event): string {
    return (event.target as HTMLElement).innerText;
  }

  duration(_day: Date) {
    const zeroDate = new Date(0);
    let d = new Duration(zeroDate, zeroDate);
    if (this.badgeages?.length === 2 || this.badgeages?.length === 3) {
      const d1 = new Duration(
        this.badgeages.at(0) as Date,
        this.badgeages.at(1) as Date
      );
      d = d1;
    }
    if (this.badgeages?.length === 4) {
      const d1 = new Duration(
        this.badgeages.at(0) as Date,
        this.badgeages.at(1) as Date
      );

      const d2 = new Duration(
        this.badgeages.at(2) as Date,
        this.badgeages.at(3) as Date
      );
      d = new Duration(zeroDate, new Date(d1.milliseconds + d2.milliseconds));
    }
    // console.info(d);
    return d;
  }

  getDaysOfWeek() {
    const now = new Date();
    const NUMBER_OF_DAYS_IN_WEEK = 5;
    const days: Date[] = [];
    for (let dayToSet = 1; dayToSet <= NUMBER_OF_DAYS_IN_WEEK; dayToSet++) {
      console.info(dayToSet);
      const day = new Date(now);
      day.setDate(now.getDate() + (dayToSet - now.getDay()));
      days.push(day);
    }
    return days;
  }
}
