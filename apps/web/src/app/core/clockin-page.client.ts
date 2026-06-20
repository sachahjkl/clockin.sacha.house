import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import type { HomeData } from "./models";

@Injectable({ providedIn: "root" })
export class ClockinPageClient {
    private readonly http = inject(HttpClient);

    load(from?: string, to?: string): Observable<HomeData> {
        const params =
            from && to
                ? new HttpParams({
                      fromObject: { from, to },
                  })
                : undefined;

        return this.http.get<HomeData>("/clockin-page-data", { params });
    }
}
