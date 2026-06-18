import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import { I18nService } from "./i18n.service";
import type { Badgeage, HistoryPageData, Slot } from "./models";

@Injectable({ providedIn: "root" })
export class BadgeagesClient {
    private readonly http = inject(HttpClient);
    private readonly i18n = inject(I18nService);

    loadHistoryPage(offset = 0, limit = 500): Observable<HistoryPageData> {
        return this.http.get<HistoryPageData>("/badgeages", {
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

    badge(timestamp: string): Observable<Badgeage> {
        return this.http.post<Badgeage>("/badgeages", { timestamp });
    }

    updateSlot(id: number, slot: Slot, timestamp: string | null): Observable<Badgeage> {
        return this.http.patch<Badgeage>(`/badgeages/${id}`, { slot, timestamp });
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`/badgeages/${id}`);
    }

    export(from: string, to: string, format: "csv" | "xlsx", iso = false): Observable<Blob> {
        return this.http.get("/badgeages/export", {
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
