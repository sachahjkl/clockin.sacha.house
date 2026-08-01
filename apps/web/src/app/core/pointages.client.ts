import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { I18nService } from "./i18n.service";
import type {
    HistoryChartRequest,
    HistoryIndexLookup,
    HistoryPageData,
    HistoryStats,
    Pointage,
    Slot,
} from "./models";

@Injectable({ providedIn: "root" })
export class PointagesClient {
    private readonly http = inject(HttpClient);
    private readonly i18n = inject(I18nService);

    loadHistoryPage(offset = 0, limit = 500): Observable<HistoryPageData> {
        return this.http.get<HistoryPageData>("/pointages", {
            params: new HttpParams({
                fromObject: {
                    from: "1970-01-01",
                    to: "2099-12-31",
                    offset,
                    limit,
                },
            }),
        });
    }

    locateHistoryIndex(day: string): Observable<HistoryIndexLookup> {
        return this.http.get<HistoryIndexLookup>("/pointages/index", {
            params: new HttpParams({ fromObject: { day } }),
        });
    }

    loadHistoryStats(
        request: HistoryChartRequest = { unit: "day", window: "week" },
    ): Observable<HistoryStats> {
        return this.http.get<HistoryStats>("/pointages/stats", {
            params: new HttpParams({
                fromObject: {
                    unit: request.unit,
                    window: request.window,
                    ...(request.anchor ? { anchor: request.anchor } : {}),
                },
            }),
        });
    }

    pointer(timestamp: string): Observable<Pointage> {
        return this.http.post<Pointage>("/pointages", { timestamp });
    }

    updateSlot(id: number, slot: Slot, timestamp: string | null): Observable<Pointage> {
        return this.http.patch<Pointage>(`/pointages/${id}`, { slot, timestamp });
    }

    upsertSlotForDay(day: string, slot: Slot, timestamp: string): Observable<Pointage> {
        return this.http.patch<Pointage>(`/pointages/by-day/${day}`, { slot, timestamp });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`/pointages/${id}`);
    }

    export(from: string, to: string, format: "csv" | "xlsx", iso = false): Observable<Blob> {
        return this.http.get("/pointages/export", {
            params: new HttpParams({
                fromObject: {
                    from,
                    to,
                    format,
                    iso: String(iso),
                    lang: this.i18n.language(),
                },
            }),
            responseType: "blob",
        });
    }
}
