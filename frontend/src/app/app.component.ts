import { BehaviorSubject, interval, withLatestFrom } from 'rxjs';
import { Component, OnInit } from '@angular/core';

import { Title } from '@angular/platform-browser';

const MS_TITLE_INTERVAL = 600;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly defaultTitle = 'Clock-In';
  currentTitle$ = new BehaviorSubject(this.defaultTitle);
  constructor(private title: Title) {}

  ngOnInit() {
    interval(MS_TITLE_INTERVAL)
      .pipe(withLatestFrom(this.currentTitle$))
      .subscribe(([_, currentTitle]) => {
        // console.log('interval', i);
        const title = this.title.getTitle();
        if (!title.includes('...')) {
          currentTitle = `${title}.`;
        } else {
          currentTitle = this.defaultTitle;
        }
        this.currentTitle$.next(currentTitle);
      });
    this.currentTitle$.subscribe(c => this.title.setTitle(c));
  }
}
