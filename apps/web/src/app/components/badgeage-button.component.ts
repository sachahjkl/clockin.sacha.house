import { Component, output } from "@angular/core";

@Component({
    selector: "app-badgeage-button",
    standalone: true,
    template: `
        <button
            type="button"
            class="group cursor-pointer rounded-3xl bg-gradient-to-r from-yellow-200 to-yellow-300 px-16 py-10 text-5xl font-bold text-slate-900 shadow transition disabled:grayscale disabled:active:translate-y-0 sm:text-6xl [&:not(:disabled)]:hover:shadow-lg [&:not(:disabled)]:active:translate-y-2 [&:not(:disabled)]:active:shadow-xl"
            (click)="badge.emit()"
        >
            <span class="mr-3 inline-block group-hover:animate-bounce">👆</span>
            <span>Badger</span>
        </button>
    `,
})
export class BadgeageButtonComponent {
    badge = output<void>();
}