import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { ApiService } from "../../core/api.service";
import { AccountService } from "../../core/account.service";
import { BadgeageButtonComponent } from "../../components/badgeage-button.component";
import { BadgeagesTableComponent, type TableRow } from "../../components/badgeages-table.component";
import type { Badgeage, Slot } from "../../core/models";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [BadgeageButtonComponent, BadgeagesTableComponent],
    template: `
        <div class="space-y-6">
            @if (error()) {
                <div class="rounded bg-red-100 px-4 py-2 text-red-800">{{ error() }}</div>
            }

            <div class="flex items-center justify-between">
                <h1 class="text-2xl font-bold">Bonjour</h1>
                @if (userId()) {
                    <span class="text-sm text-gray-500">ID: {{ userId() }}</span>
                }
            </div>

            <app-badgeage-button (badge)="badge()" />

            <app-badgeages-table [rows]="rows()" (edit)="onEdit($event)" />
        </div>
    `,
})
export class HomeComponent implements OnInit {
    private api = inject(ApiService);
    private account = inject(AccountService);

    readonly userId = computed(() => this.account.userId());
    readonly badgeages = signal<Badgeage[]>([]);
    readonly error = signal<string | null>(null);
    readonly rows = computed(() => buildWeekRows(this.badgeages()));

    ngOnInit(): void {
		this.load().catch((e) => this.error.set(e.message));
	}

    async load(): Promise<void> {
        const { from, to } = weekRange();
        const data = await this.api.get<Badgeage[]>(`/badgeages?from=${from}&to=${to}`);
        this.badgeages.set(data);
    }

    async badge(): Promise<void> {
        this.error.set(null);
        try {
            await this.api.post<Badgeage>("/badgeages", { timestamp: new Date().toISOString() });
            await this.load();
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Erreur");
        }
    }

    async onEdit(event: { slot: string; day: string; current: string }): Promise<void> {
        const value = prompt("Nouvelle valeur (ISO 8601)", event.current);
        if (!value) return;

        const record = this.badgeages().find((b) => b.day === event.day);
        if (!record) return;

        this.error.set(null);
        try {
            await this.api.patch<Badgeage>(`/badgeages/${record.id}`, {
                slot: event.slot,
                timestamp: new Date(value).toISOString(),
            });
            await this.load();
        } catch (e) {
            this.error.set(e instanceof Error ? e.message : "Erreur");
        }
    }
}

function weekRange() {
    const start = startOfWorkWeek();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { from: toISODate(start), to: toISODate(end) };
}

function toISODate(date: Date) {
    return date.toISOString().split("T")[0];
}

function buildWeekRows(badgeages: Badgeage[]): TableRow[] {
    const rows: TableRow[] = [];
    const start = startOfWorkWeek();
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dayStr = toISODate(d);
        const record = badgeages.find((b) => b.day === dayStr);
        rows.push({
            day: dayStr,
            id: record?.id,
            firstEntry: record?.firstEntry ?? null,
            firstExit: record?.firstExit ?? null,
            secondEntry: record?.secondEntry ?? null,
            secondExit: record?.secondExit ?? null,
            total: record ? computeTotal(record) : "-",
        });
    }
    return rows;
}

function startOfWorkWeek() {
	const start = new Date();
	const day = start.getDay();
	const diff = start.getDate() - day + (day === 0 ? -6 : 1);
	start.setDate(diff);
	return start;
}

function computeTotal(b: Badgeage): string {
    const slots: Slot[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
    let totalSeconds = 0;
    for (let i = 0; i < slots.length; i += 2) {
        const start = b[slots[i]];
        const end = b[slots[i + 1]];
        if (start && end) {
            totalSeconds += Math.max(
                0,
                Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000),
            );
        }
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}
