type TodayStatus = "noRecord" | "firstEntryIn" | "firstExitOut" | "secondEntryIn" | "allFilled";

import { Component, computed, inject, input, linkedSignal, signal } from "@angular/core";
import { AccountService } from "../../core/account.service";
import { BadgeagesClient } from "../../core/badgeages.client";
import { BadgeageButtonComponent } from "../../components/badgeage-button.component";
import {
    BadgeagesTableComponent,
    type SlotKey,
    type TableRow,
} from "../../components/badgeages-table.component";
import { CopyableIdComponent } from "../../components/copyable-id.component";
import { WelcomeWizardComponent } from "../../components/welcome-wizard.component";
import { I18nService, type TranslationKey } from "../../core/i18n.service";
import type { Badgeage, HomeData, Slot, User } from "../../core/models";

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
                    <h1 class="text-2xl font-bold">{{ greetingText() }}</h1>
                </div>
                @if (userId()) {
                    <app-copyable-id [id]="userId()!" />
                }
            </section>

            <section class="flex items-center justify-center py-8">
                <app-badgeage-button [disabled]="badgeageLocked()" (badge)="badge()" />
            </section>

            @if (error()) {
                <div
                    class="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-rose-700 shadow-sm"
                >
                    {{ error() }}
                </div>
            }

            <section class="mx-auto w-full">
                <app-badgeages-table
                    [rows]="rows()"
                    [weekTotal]="weekTotal()"
                    (edit)="onEdit($event)"
                    (deleteSlot)="clearSlot($event)"
                />
            </section>
        </article>
    `,
})
export class HomeComponent {
    private readonly badgeagesClient = inject(BadgeagesClient);
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);
    protected readonly homeData = input.required<HomeData>();

    readonly userId = computed(() => this.account.userId());
    readonly badgeages = linkedSignal(() => this.homeData().badgeages);
    readonly profile = linkedSignal<User | null>(() => this.homeData().profile);
    readonly profileName = computed(() => this.profile()?.name?.trim() ?? "");
    readonly error = signal<string | null>(null);

    readonly todayBadgeage = computed(() => {
        const today = new Date().toISOString().split("T")[0];
        return this.badgeages().find((b) => b.day === today) ?? null;
    });

    readonly todayStatus = computed<TodayStatus>(() => {
        const r = this.todayBadgeage();
        if (!r) return "noRecord";
        if (!r.firstEntry) return "noRecord";
        if (!r.firstExit) return "firstEntryIn";
        if (!r.secondEntry) return "firstExitOut";
        if (!r.secondExit) return "secondEntryIn";
        return "allFilled";
    });

    readonly badgeageLocked = computed(() => this.todayStatus() === "allFilled");
    readonly greetingText = computed(() => {
        const map: Record<TodayStatus, TranslationKey> = {
            noRecord: "greeting.noEntry",
            firstEntryIn: "greeting.firstEntryIn",
            firstExitOut: "greeting.firstExitOut",
            secondEntryIn: "greeting.secondEntryIn",
            allFilled: "greeting.secondExitOut",
        };
        const base = this.i18n.t(map[this.todayStatus()]);
        const name = this.profileName();
        return name ? `${base}, ${name} !` : `${base} !`;
    });
    readonly rows = computed(() => buildWeekRows(this.badgeages()));
    readonly weekTotal = computed(() =>
        formatDuration(
            this.badgeages().reduce((total, badgeage) => total + computeTotalSeconds(badgeage), 0),
        ),
    );

    badge(): void {
        this.error.set(null);
        this.badgeagesClient.badge(new Date().toISOString()).subscribe({
            next: (updated) => {
                this.upsertBadgeage(updated);
            },
            error: (error: unknown) => {
                this.error.set(errorMessage(error, this.i18n));
            },
        });
    }

    onEdit(event: { slot: SlotKey; day: string; value: string }): void {
        const record = this.badgeages().find((b) => b.day === event.day);
        if (!record) return;

        this.error.set(null);
        const timestamp = new Date(`${event.day}T${normalizeTimeValue(event.value)}`).toISOString();
        this.badgeagesClient.updateSlot(record.id, event.slot, timestamp).subscribe({
            next: (updated) => {
                this.upsertBadgeage(updated);
            },
            error: (error: unknown) => {
                this.error.set(errorMessage(error, this.i18n));
            },
        });
    }

    clearSlot(event: { slot: SlotKey; day: string }): void {
        const record = this.badgeages().find((b) => b.day === event.day);
        if (!record) return;

        this.error.set(null);
        this.badgeagesClient.updateSlot(record.id, event.slot, null).subscribe({
            next: (updated) => {
                this.upsertBadgeage(updated);
            },
            error: (error: unknown) => {
                this.error.set(errorMessage(error, this.i18n));
            },
        });
    }

    private upsertBadgeage(updated: Badgeage): void {
        this.badgeages.update((items) => {
            const idx = items.findIndex((b) => b.id === updated.id);
            if (idx !== -1) {
                const copy = [...items];
                copy[idx] = updated;
                return copy;
            }
            return [...items, updated];
        });
    }
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

function errorMessage(error: unknown, i18n: I18nService): string {
    return error instanceof Error ? error.message : i18n.t("errors.requestFailed");
}
