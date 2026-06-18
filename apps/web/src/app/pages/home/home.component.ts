import { Component, OnInit, computed, effect, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { AccountService } from "../../core/account.service";
import { BadgeageButtonComponent } from "../../components/badgeage-button.component";
import {
    BadgeagesTableComponent,
    type SlotKey,
    type TableRow,
} from "../../components/badgeages-table.component";
import { CopyableIdComponent } from "../../components/copyable-id.component";
import { WelcomeWizardComponent } from "../../components/welcome-wizard.component";
import { I18nService } from "../../core/i18n.service";
import type { Badgeage, Slot, User } from "../../core/models";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [
        BadgeageButtonComponent,
        BadgeagesTableComponent,
        CopyableIdComponent,
        WelcomeWizardComponent,
    ],
    template: `
        <article class="mx-auto w-full min-w-0 max-w-[80rem] space-y-6">
            @if (account.welcomeWizardOpen() && userId()) {
                <app-welcome-wizard [userId]="userId()!" (close)="account.dismissWelcomeWizard()" />
            }

            <section class="flex items-center justify-between flex-wrap gap-3 px-2">
                <div>
                    <h1 class="text-2xl font-bold">
                        @if (profileName()) {
                            {{ i18n.t("clockin.greeting") }} {{ profileName() }}
                        } @else {
                            {{ i18n.t("app.clockin") }}
                        }
                    </h1>
                </div>
                @if (userId()) {
                    <app-copyable-id [id]="userId()!" />
                }
            </section>

            <section class="flex items-center justify-center py-8">
                <app-badgeage-button (badge)="badge()" />
            </section>

            @if (error()) {
                <div
                    class="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-rose-700 shadow-sm"
                >
                    {{ error() }}
                </div>
            }

            <section class="mx-auto w-full min-w-[300px]">
                <app-badgeages-table
                    [rows]="rows()"
                    [weekTotal]="weekTotal()"
                    (edit)="onEdit($event)"
                />
            </section>
        </article>
    `,
})
export class HomeComponent implements OnInit {
    private api = inject(ApiService);
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);
    private router = inject(Router);

    readonly userId = computed(() => this.account.userId());
    readonly badgeages = signal<Badgeage[]>([]);
    readonly profile = signal<User | null>(null);
    readonly profileName = computed(() => this.profile()?.name?.trim() ?? "");
    readonly error = signal<string | null>(null);
    readonly rows = computed(() => buildWeekRows(this.badgeages()));
    readonly weekTotal = computed(() =>
        formatDuration(
            this.badgeages().reduce((total, badgeage) => total + computeTotalSeconds(badgeage), 0),
        ),
    );

    constructor() {
        effect(() => {
            if (!this.account.userId()) {
                void this.router.navigate(["/connect"]);
            }
        });
    }

    ngOnInit(): void {
        if (this.account.userId()) {
            this.load().catch((e) => this.error.set(e.message));
        }
    }

    async load(): Promise<void> {
        const { from, to } = weekRange();
        const [profile, badgeages] = await Promise.all([
            this.api.get<User>("/me"),
            this.api.get<Badgeage[]>(`/badgeages?from=${from}&to=${to}`),
        ]);
        this.profile.set(profile);
        this.badgeages.set(badgeages);
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

    async onEdit(event: { slot: SlotKey; day: string; value: string }): Promise<void> {
        const record = this.badgeages().find((b) => b.day === event.day);
        if (!record) return;

        this.error.set(null);
        try {
            const timestamp = new Date(
                `${event.day}T${normalizeTimeValue(event.value)}`,
            ).toISOString();
            await this.api.patch<Badgeage>(`/badgeages/${record.id}`, {
                slot: event.slot,
                timestamp,
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
            total: record ? formatDuration(computeTotalSeconds(record)) : "-",
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

function computeTotalSeconds(badgeage: Badgeage): number {
    const slots: Slot[] = ["firstEntry", "firstExit", "secondEntry", "secondExit"];
    let totalSeconds = 0;
    for (let i = 0; i < slots.length; i += 2) {
        const start = badgeage[slots[i]];
        const end = badgeage[slots[i + 1]];
        if (start && end) {
            totalSeconds += Math.max(
                0,
                Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000),
            );
        }
    }

    return totalSeconds;
}

function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}

function normalizeTimeValue(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
}