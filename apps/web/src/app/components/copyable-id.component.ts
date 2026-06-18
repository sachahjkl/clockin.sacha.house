import { Component, inject, input, signal } from "@angular/core";
import { I18nService } from "../core/i18n.service";
import { IconComponent } from "./icon.component";

@Component({
    selector: "app-copyable-id",
    standalone: true,
    imports: [IconComponent],
    template: `
        <code
            class="inline-flex cursor-pointer items-center gap-1.5 rounded bg-slate-100 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-200 active:scale-95"
            (click)="copy()"
            [title]="title()"
            >{{ i18n.t("copy.id") }}: <strong>{{ copied() ? i18n.t("copy.copied") : id() }}</strong
            ><app-icon name="content_copy" size="1rem" class="inline-block" /></code
    >`,
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