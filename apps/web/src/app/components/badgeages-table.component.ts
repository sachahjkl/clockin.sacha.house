import { Component, input, output, signal } from "@angular/core";
import { DatePipe } from "@angular/common";

@Component({
    selector: "app-badgeages-table",
    standalone: true,
    imports: [DatePipe],
    template: `
		<section class="overflow-hidden rounded-xl bg-white shadow">
			<div class="px-5 py-4 sm:px-6">
				<p class="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">🔎 Récapitulatif</p>
				<h2 class="mt-1 text-lg font-bold text-slate-900">Badgeages de la semaine</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full border-separate border-spacing-0 text-left text-sm">
					<thead class="bg-slate-100 text-slate-600">
					<tr>
						<th class="px-4 py-3 font-semibold">Jour</th>
						<th class="px-4 py-3 font-semibold">Entrée 1</th>
						<th class="px-4 py-3 font-semibold">Sortie 1</th>
						<th class="px-4 py-3 font-semibold">Entrée 2</th>
						<th class="px-4 py-3 font-semibold">Sortie 2</th>
						<th class="px-4 py-3 font-semibold">Total</th>
					</tr>
					</thead>
					<tbody class="bg-white">
					@for (row of rows(); track row.day) {
						<tr class="align-middle border-t border-slate-100">
							<td class="px-4 py-3 font-semibold text-slate-800">{{ row.day | date: 'EEE d MMM' }}</td>
							@for (slot of slots; track slot) {
								<td class="px-4 py-3 text-slate-600">
									@if (row[slot]; as value) {
										@if (isEditing(row.day, slot)) {
											<input
												autofocus
												type="text"
												inputmode="numeric"
												placeholder="08:30:00"
												class="block w-28 rounded-lg border border-transparent bg-slate-100 px-2 py-1 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-0"
												[class.!border-rose-300]="invalidDraft()"
												[class.!bg-rose-50]="invalidDraft()"
												[value]="draftValue()"
												(input)="draftValue.set($any($event.target).value); invalidDraft.set(false)"
												(blur)="saveEdit(row.day, slot)"
												(keydown.enter)="saveEdit(row.day, slot)"
												(keydown.escape)="cancelEdit()"
											/>
										} @else {
											<button
												type="button"
												class="rounded-lg px-2 py-1 font-medium text-slate-700 transition hover:bg-slate-100 hover:text-sky-700 hover:underline"
												(click)="startEdit(row.day, slot, value)"
											>
												{{ value | date: 'HH:mm:ss' }}
											</button>
										}
									} @else {
										<span class="text-slate-300">N/A</span>
									}
								</td>
							}
							<td class="px-4 py-3 font-bold text-slate-900">{{ row.total }}</td>
						</tr>
					} @empty {
						<tr>
							<td colspan="6" class="px-4 py-8 text-center text-slate-400">Aucun badgeage cette semaine</td>
						</tr>
					}
					</tbody>
				</table>
			</div>
		</section>
	`,
})
export class BadgeagesTableComponent {
    rows = input.required<TableRow[]>();
    edit = output<{ slot: SlotKey; day: string; value: string }>();

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
