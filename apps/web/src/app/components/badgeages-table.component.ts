import { Component, input, output } from "@angular/core";
import { DatePipe } from "@angular/common";

@Component({
    selector: "app-badgeages-table",
    standalone: true,
    imports: [DatePipe],
    template: `
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
			<table class="w-full text-left text-sm">
				<thead class="bg-gray-100">
					<tr>
						<th class="px-4 py-2">Jour</th>
						<th class="px-4 py-2">Entrée 1</th>
						<th class="px-4 py-2">Sortie 1</th>
						<th class="px-4 py-2">Entrée 2</th>
						<th class="px-4 py-2">Sortie 2</th>
						<th class="px-4 py-2">Total</th>
					</tr>
				</thead>
				<tbody>
					@for (row of rows(); track row.day) {
						<tr class="border-t border-gray-100">
							<td class="px-4 py-2 font-medium">{{ row.day | date: 'EEE d MMM' }}</td>
							@for (slot of slots; track slot) {
								<td class="px-4 py-2">
									@if (row[slot]; as value) {
										<button
											type="button"
											class="hover:underline"
											(click)="edit.emit({ slot, day: row.day, current: value })"
										>
											{{ value | date: 'HH:mm:ss' }}
										</button>
									} @else {
										<span class="text-gray-400">N/A</span>
									}
								</td>
							}
							<td class="px-4 py-2 font-semibold">{{ row.total }}</td>
						</tr>
					} @empty {
						<tr>
							<td colspan="6" class="px-4 py-6 text-center text-gray-500">Aucun badgeage cette semaine</td>
						</tr>
					}
				</tbody>
			</table>
		</div>
	`,
})
export class BadgeagesTableComponent {
    rows = input.required<TableRow[]>();
    edit = output<{ slot: string; day: string; current: string }>();

    readonly slots: SlotKey[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
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