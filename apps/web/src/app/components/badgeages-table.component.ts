import {
    Component,
    input,
    output,
    signal,
    Directive,
    ElementRef,
    AfterViewInit,
    inject,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { I18nService } from "../core/i18n.service";

@Directive({
    selector: "[autoFocus]",
    standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
    private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

    ngAfterViewInit() {
        this.el.nativeElement.focus();
    }
}

@Component({
    selector: "app-badgeages-table",
    standalone: true,
    imports: [DatePipe, AutoFocusDirective],
    styles: [
        `
            .trash-icon {
                display: inline-block;
                width: 1em;
                height: 1em;
                background-color: currentColor;
                -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M20 6a1 1 0 0 1 .117 1.993L20 8h-.081L19 19a3 3 0 0 1-2.824 2.995L16 22H8c-1.598 0-2.904-1.249-2.992-2.75l-.005-.167L4.08 8H4a1 1 0 0 1-.117-1.993L4 6zm-10 4a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1m0-8a2 2 0 0 1 2 2a1 1 0 0 1-1.993.117L14 4h-4l-.007.117A1 1 0 0 1 8 4a2 2 0 0 1 1.85-1.995L10 2z'/%3E%3C/svg%3E");
                mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='black' d='M20 6a1 1 0 0 1 .117 1.993L20 8h-.081L19 19a3 3 0 0 1-2.824 2.995L16 22H8c-1.598 0-2.904-1.249-2.992-2.75l-.005-.167L4.08 8H4a1 1 0 0 1-.117-1.993L4 6zm-10 4a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1m4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1m0-8a2 2 0 0 1 2 2a1 1 0 0 1-1.993.117L14 4h-4l-.007.117A1 1 0 0 1 8 4a2 2 0 0 1 1.85-1.995L10 2z'/%3E%3C/svg%3E");
                -webkit-mask-repeat: no-repeat;
                mask-repeat: no-repeat;
                -webkit-mask-size: contain;
                mask-size: contain;
            }
        `,
    ],
    template: `
        <section class="overflow-hidden rounded-xl bg-white shadow">
            <div class="px-5 py-4 sm:px-6">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
                    🔎 {{ i18n.t("table.summary") }}
                </p>
                <h2 class="mt-1 text-lg font-bold text-slate-900">
                    {{ i18n.t("table.weekBadgeages") }}
                </h2>
            </div>
            <div class="overflow-x-auto">
                <table class="mx-auto min-w-full table-fixed border-separate border-spacing-0 text-left text-sm">
                    <thead class="bg-slate-100 text-slate-600">
                        <tr>
                            <th class="w-[200px] whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.day") }}
                            </th>
                            <th class="w-32 whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.firstEntry") }}
                            </th>
                            <th class="w-32 whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.firstExit") }}
                            </th>
                            <th class="w-32 whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.secondEntry") }}
                            </th>
                            <th class="w-32 whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.secondExit") }}
                            </th>
                            <th class="whitespace-nowrap px-4 py-3 font-semibold">
                                {{ i18n.t("table.total") }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white">
                        @for (row of rows(); track row.day) {
                            <tr class="align-middle border-t border-slate-100">
                                <td
                                    class="whitespace-nowrap px-4 py-3 font-semibold text-slate-800"
                                    [title]="row.day"
                                >
                                    {{
                                        row.day | date: "EEE d MMM" : undefined : i18n.dateLocale()
                                    }}
                                </td>
                                @for (slot of slots; track slot) {
                                    <td class="px-4 py-3 text-slate-600">
                                        @if (row[slot]; as value) {
                                            @if (isEditing(row.day, slot)) {
                                                <input
                                                    type="text"
                                                    inputmode="numeric"
                                                    placeholder="08:30:00"
                                                    class="block w-full rounded-lg border border-transparent bg-slate-100 px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-300 focus:bg-white focus:ring-0"
                                                    [class.!border-rose-300]="invalidDraft()"
                                                    [class.!bg-rose-50]="invalidDraft()"
                                                    [value]="draftValue()"
                                                    autoFocus
                                                    (input)="
                                                        draftValue.set($any($event.target).value);
                                                        invalidDraft.set(false)
                                                    "
                                                    (blur)="saveEdit(row.day, slot)"
                                                    (keydown.enter)="saveEdit(row.day, slot)"
                                                    (keydown.escape)="cancelEdit()"
                                                />
                                             } @else {
                                                 <div class="flex items-center gap-1">
                                                     <button
                                                         type="button"
                                                         class="inline-flex justify-start rounded-lg px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 hover:text-sky-700 hover:underline"
                                                         (click)="startEdit(row.day, slot, value)"
                                                         [title]="i18n.t('table.editTime')"
                                                     >
                                                         {{
                                                             value
                                                                 | date
                                                                     : "HH:mm:ss"
                                                                     : undefined
                                                                     : i18n.dateLocale()
                                                         }}
                                                     </button>
                                                     <button
                                                         type="button"
                                                         class="inline-flex cursor-pointer items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                                         (click)="deleteSlot.emit({ day: row.day, slot })"
                                                         title="Supprimer"
                                                     >
                                                         <span class="trash-icon inline-block h-4 w-4"></span>
                                                     </button>
                                                 </div>
                                             }
                                        } @else {
                                            <span
                                                class="inline-flex items-center px-2 text-slate-300"
                                                >N/A</span
                                            >
                                        }
                                    </td>
                                }
                                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-900">
                                    {{ row.total }}
                                </td>
                            </tr>
                        } @empty {
                            <tr>
                                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                                    {{ i18n.t("table.noneThisWeek") }}
                                </td>
                            </tr>
                        }
                    </tbody>
                    <tfoot class="bg-slate-50 text-slate-900">
                        <tr class="border-t border-slate-200">
                            <td class="whitespace-nowrap px-4 py-3 font-bold">
                                {{ i18n.t("table.weekTotal") }}
                            </td>
                            @for (slot of slots; track slot) {
                                <td class="whitespace-nowrap px-4 py-3 font-bold text-slate-500">
                                    -
                                </td>
                            }
                            <td class="whitespace-nowrap px-4 py-3 font-bold">{{ weekTotal() }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    `,
})
export class BadgeagesTableComponent {
    protected readonly i18n = inject(I18nService);
    rows = input.required<TableRow[]>();
    weekTotal = input.required<string>();
    edit = output<{ slot: SlotKey; day: string; value: string }>();
    deleteSlot = output<{ slot: SlotKey; day: string }>();

    readonly slots: SlotKey[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
    readonly editingKey = signal<string | null>(null);
    readonly draftValue = signal("");
    readonly invalidDraft = signal(false);

    startEdit(day: string, slot: SlotKey, current: string): void {
        this.editingKey.set(this.keyFor(day, slot));
        this.draftValue.set(formatTimeFieldValue(current));
        this.invalidDraft.set(false);
    }

    isEditing(day: string, slot: SlotKey): boolean {
        return this.editingKey() === this.keyFor(day, slot);
    }

    saveEdit(day: string, slot: SlotKey): void {
        const value = this.draftValue().trim();
        if (!value) {
            this.cancelEdit();
            return;
        }

        if (!TIME_FIELD_PATTERN.test(value)) {
            this.invalidDraft.set(true);
            return;
        }

        this.edit.emit({ day, slot, value });
        this.cancelEdit();
    }

    cancelEdit(): void {
        this.editingKey.set(null);
        this.draftValue.set("");
        this.invalidDraft.set(false);
    }

    private keyFor(day: string, slot: SlotKey): string {
        return `${day}:${slot}`;
    }
}

export type SlotKey = "firstEntry" | "firstExit" | "secondEntry" | "secondExit";

export interface TableRow {
    day: string;
    id?: number;
    firstEntry: string | null;
    firstExit: string | null;
    secondEntry: string | null;
    secondExit: string | null;
    total: string;
}

function formatTimeFieldValue(value: string): string {
    const date = new Date(value);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

const TIME_FIELD_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;