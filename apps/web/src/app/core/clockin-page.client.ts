import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import type { HomeData } from "./models";

@Injectable({ providedIn: "root" })
export class ClockinPageClient {
    private readonly http = inject(HttpClient);

    load(): Observable<HomeData> {
        return this.http.get<HomeData>("/clockin-page-data");
    }
}
