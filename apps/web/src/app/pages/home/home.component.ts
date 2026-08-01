type TodayStatus = "noRecord" | "firstEntryIn" | "firstExitOut" | "secondEntryIn" | "allFilled";

import { ActivatedRoute, Router } from "@angular/router";
import { Component, computed, inject, input, linkedSignal } from "@angular/core";
import { AccountService } from "../../core/account.service";
import { PointagesClient } from "../../core/pointages.client";
import { PointageButtonComponent } from "../../components/pointage-button.component";
import {
    PointagesTableComponent,
    type SlotKey,
    type TableRow,
} from "../../components/pointages-table.component";
import { CopyableIdComponent } from "../../components/copyable-id.component";
import { I18nService, type TranslationKey } from "../../core/i18n.service";
import type { HomeData, Pointage, User } from "../../core/models";
import { ToastService } from "../../core/toast.service";
import {
    computePointageTotalSeconds,
    dailyTargetSeconds,
    isNearTarget,
} from "../../core/work-target";

@Component({
    selector: "app-home",
    standalone: true,
    imports: [PointageButtonComponent, PointagesTableComponent, CopyableIdComponent],
    template: `
        <article class="mx-auto my-3 w-full min-w-0 max-w-[80rem] space-y-6">
            <section class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 class="text-2xl font-bold">{{ greetingText() }}</h1>
                </div>
                @if (userId()) {
                    <app-copyable-id [id]="userId()!" />
                }
            </section>

            <section class="flex items-center justify-center py-6">
                <app-pointage-button [disabled]="pointageLocked()" (point)="pointer()" />
            </section>

            <section class="mx-auto w-full">
                <app-pointages-table
                    [rows]="rows()"
                    [weekTotal]="weekTotal()"
                    [from]="homeData().from"
                    [to]="homeData().to"
                    [weekOffset]="weekOffset()"
                    (edit)="onEdit($event)"
                    (deleteSlot)="clearSlot($event)"
                    (goToDate)="goToDate($event)"
                    (previousWeek)="goToWeek(weekOffset() - 1)"
                    (nextWeek)="goToWeek(weekOffset() + 1)"
                    (currentWeek)="goToWeek(0)"
                />
            </section>
        </article>
    `,
})
export class HomeComponent {
    private readonly pointagesClient = inject(PointagesClient);
    private readonly toastService = inject(ToastService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    protected readonly account = inject(AccountService);
    protected readonly i18n = inject(I18nService);
    protected readonly homeData = input.required<HomeData>();
    readonly weekOffset = input(0, {
        transform: (value: number | string | undefined) => {
            const parsed = Number(value ?? 0);
            return Number.isFinite(parsed) ? parsed : 0;
        },
    });

    readonly userId = computed(() => this.account.userId());
    readonly pointages = linkedSignal(() => this.homeData().pointages);
    readonly profile = linkedSignal<User | null>(() => this.homeData().profile);
    readonly profileName = computed(() => this.profile()?.name?.trim() ?? "");
    readonly todayPointage = computed(() => {
        const today = new Date().toISOString().split("T")[0];
        return this.pointages().find((pointage) => pointage.day === today) ?? null;
    });

    readonly todayStatus = computed<TodayStatus>(() => {
        const r = this.todayPointage();
        if (!r) return "noRecord";
        if (!r.firstEntry) return "noRecord";
        if (!r.firstExit) return "firstEntryIn";
        if (!r.secondEntry) return "firstExitOut";
        if (!r.secondExit) return "secondEntryIn";
        return "allFilled";
    });

    readonly pointageLocked = computed(() => this.todayStatus() === "allFilled");
    readonly greetingText = computed(() => {
        const base = this.i18n.t(
            greetingKeyForStatus(this.todayStatus(), this.todayPointage(), new Date()),
        );
        const name = this.profileName();
        return name ? `${base}, ${name} !` : `${base} !`;
    });
    readonly dailyTargetSeconds = computed(() => {
        const profile = this.profile();
        return profile
            ? dailyTargetSeconds(profile.weeklyTargetMinutes, profile.workDaysPerWeek)
            : 0;
    });
    readonly rows = computed(() =>
        buildWeekRows(this.pointages(), this.homeData().from, this.dailyTargetSeconds()),
    );
    readonly weekTotal = computed(() =>
        formatDuration(
            this.pointages().reduce(
                (total, pointage) => total + computePointageTotalSeconds(pointage),
                0,
            ),
        ),
    );

    pointer(): void {
        this.pointagesClient.pointer(new Date().toISOString()).subscribe({
            next: (updated) => {
                this.upsertPointage(updated);
                this.toastService.success(this.i18n.t("toast.pointageSaved"));
            },
            error: (error: unknown) => {
                this.toastService.error(errorMessage(error, this.i18n));
            },
        });
    }

    onEdit(event: { slot: SlotKey; day: string; value: string }): void {
        const record = this.pointages().find((pointage) => pointage.day === event.day);
        const timestamp = new Date(`${event.day}T${normalizeTimeValue(event.value)}`).toISOString();

        const request = record
            ? this.pointagesClient.updateSlot(record.id, event.slot, timestamp)
            : this.pointagesClient.upsertSlotForDay(event.day, event.slot, timestamp);

        request.subscribe({
            next: (updated) => {
                this.upsertPointage(updated);
                this.toastService.success(this.i18n.t("toast.pointageUpdated"));
            },
            error: (error: unknown) => {
                this.toastService.error(errorMessage(error, this.i18n));
            },
        });
    }

    clearSlot(event: { slot: SlotKey; day: string }): void {
        const record = this.pointages().find((pointage) => pointage.day === event.day);
        if (!record) return;

        this.pointagesClient.updateSlot(record.id, event.slot, null).subscribe({
            next: (updated) => {
                this.upsertPointage(updated);
                this.toastService.success(this.i18n.t("toast.pointageCleared"));
            },
            error: (error: unknown) => {
                this.toastService.error(errorMessage(error, this.i18n));
            },
        });
    }

    goToWeek(weekOffset: number): void {
        void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: weekOffset === 0 ? { weekOffset: null } : { weekOffset },
            queryParamsHandling: "merge",
        });
    }

    goToDate(day: string): void {
        const target = new Date(`${day}T12:00:00`);
        if (Number.isNaN(target.getTime())) return;

        const currentWeekStart = startOfWeek(new Date());
        const targetWeekStart = startOfWeek(target);
        const diffMs = targetWeekStart.getTime() - currentWeekStart.getTime();
        const weekOffset = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));

        this.goToWeek(weekOffset);
    }

    private upsertPointage(updated: Pointage): void {
        this.pointages.update((items) => {
            const idx = items.findIndex((pointage) => pointage.id === updated.id);
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

function startOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
}

function buildWeekRows(pointages: Pointage[], from: string, targetSeconds: number): TableRow[] {
    const rows: TableRow[] = [];
    const start = new Date(`${from}T12:00:00`);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dayStr = toISODate(d);
        const record = pointages.find((pointage) => pointage.day === dayStr);
        const totalSeconds = record ? computePointageTotalSeconds(record) : 0;
        rows.push({
            day: dayStr,
            id: record?.id,
            firstEntry: record?.firstEntry ?? null,
            firstExit: record?.firstExit ?? null,
            secondEntry: record?.secondEntry ?? null,
            secondExit: record?.secondExit ?? null,
            total: record ? formatDuration(totalSeconds) : "-",
            hot: isNearTarget(totalSeconds, targetSeconds),
        });
    }
    return rows;
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

function greetingKeyForStatus(
    status: TodayStatus,
    pointage: Pointage | null,
    now: Date,
): TranslationKey {
    switch (status) {
        case "noRecord":
            return greetingKeyForNoRecord(now.getHours());
        case "firstEntryIn":
            return greetingKeyForFirstEntry(hourForTimestamp(pointage?.firstEntry) ?? now.getHours());
        case "firstExitOut":
            return greetingKeyForFirstExit(hourForTimestamp(pointage?.firstExit) ?? now.getHours());
        case "secondEntryIn":
            return greetingKeyForSecondEntry(hourForTimestamp(pointage?.secondEntry) ?? now.getHours());
        case "allFilled":
            return greetingKeyForSecondExit(hourForTimestamp(pointage?.secondExit) ?? now.getHours());
    }
}

function greetingKeyForNoRecord(hour: number): TranslationKey {
    if (hour < 6) return "greeting.noEntry.beforeDawn";
    if (hour < 10) return "greeting.noEntry.morning";
    if (hour < 14) return "greeting.noEntry.lateMorning";
    if (hour < 18) return "greeting.noEntry.afternoon";
    return "greeting.noEntry.evening";
}

function greetingKeyForFirstEntry(hour: number): TranslationKey {
    if (hour < 6) return "greeting.firstEntryIn.earlyBird";
    if (hour < 10) return "greeting.firstEntryIn.morning";
    if (hour < 12) return "greeting.firstEntryIn.lateMorning";
    return "greeting.firstEntryIn.afternoon";
}

function greetingKeyForFirstExit(hour: number): TranslationKey {
    if (hour < 11) return "greeting.firstExitOut.early";
    if (hour < 14) return "greeting.firstExitOut.lunch";
    if (hour < 17) return "greeting.firstExitOut.break";
    return "greeting.firstExitOut.late";
}

function greetingKeyForSecondEntry(hour: number): TranslationKey {
    if (hour < 12) return "greeting.secondEntryIn.early";
    if (hour < 14.5) return "greeting.secondEntryIn.lunchReturn";
    if (hour < 17.5) return "greeting.secondEntryIn.afternoon";
    return "greeting.secondEntryIn.late";
}

function greetingKeyForSecondExit(hour: number): TranslationKey {
    if (hour < 15) return "greeting.secondExitOut.early";
    if (hour < 18) return "greeting.secondExitOut.afternoon";
    if (hour < 21) return "greeting.secondExitOut.evening";
    return "greeting.secondExitOut.night";
}

function hourForTimestamp(value: string | null | undefined): number | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.getHours() + date.getMinutes() / 60;
}
