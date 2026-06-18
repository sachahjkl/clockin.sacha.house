import { Component, inject, input, signal } from "@angular/core";
import { I18nService } from "../core/i18n.service";

@Component({
    selector: "app-copyable-id",
    standalone: true,
    styles: [
        `
            .copy-icon {
                display: inline-block;
                width: 1em;
                height: 1em;
                --svg: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='14' height='14' x='8' y='2' fill='black' rx='2' ry='2'/%3E%3Cpath fill='black' d='M8.5 18A2.5 2.5 0 0 1 6 15.5V8H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-2z'/%3E%3C/svg%3E");
                background-color: currentColor;
                -webkit-mask-image: var(--svg);
                mask-image: var(--svg);
                -webkit-mask-repeat: no-repeat;
                mask-repeat: no-repeat;
                -webkit-mask-size: 100% 100%;
                mask-size: 100% 100%;
            }
        `,
    ],
    template: `
        <code
            class="inline-flex cursor-pointer items-center gap-1.5 rounded bg-slate-100 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-200 active:scale-95"
            (click)="copy()"
            [title]="title()"
            >{{ i18n.t("copy.id") }}: <strong>{{ copied() ? i18n.t("copy.copied") : id() }}</strong
            ><span class="copy-icon"></span
        ></code>
    `,
})
export class CopyableIdComponent {
    protected readonly i18n = inject(I18nService);
    id = input.required<string>();
    title = input(this.i18n.t("copy.title"));
    copied = signal(false);

    async copy(): Promise<void> {
        await navigator.clipboard.writeText(this.id());
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1500);
    }
}