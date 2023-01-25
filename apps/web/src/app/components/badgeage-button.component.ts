import { Component, output } from "@angular/core";

@Component({
    selector: "app-badgeage-button",
    standalone: true,
    template: `
        <button
            type="button"
            class="group w-full cursor-pointer rounded-[2rem] bg-gradient-to-r from-yellow-200 to-yellow-300 px-8 py-10 text-4xl font-bold text-slate-900 shadow transition-all hover:shadow-lg active:translate-y-2 sm:text-5xl"
            (click)="badge.emit()"
        >
            <span class="mr-3 inline-block transition-transform group-hover:animate-bounce">👆</span>
            <span>Badger</span>
        </button>
    `,
})
export class BadgeageButtonComponent {
    badge = output<void>();
}
