import { HttpErrorResponse, type HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AccountService } from "./account.service";
import { I18nService } from "./i18n.service";

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
    const account = inject(AccountService);
    const i18n = inject(I18nService);
    const router = inject(Router);

    return next(request).pipe(
        catchError((error: unknown) => {
            if (!(error instanceof HttpErrorResponse)) {
                return throwError(() =>
                    error instanceof Error ? error : new Error(i18n.t("errors.requestFailed")),
                );
            }

            if (error.status === 401) {
                account.clear();
                void router.navigate(["/connect"]);
                return throwError(() => new Error(i18n.t("errors.unauthorized")));
            }

            return throwError(() => new Error(errorMessage(error, i18n)));
        }),
    );
};

function errorMessage(error: HttpErrorResponse, i18n: I18nService): string {
    if (typeof error.error?.error === "string") {
        return error.error.error;
    }

    return i18n.t("errors.requestFailed");
}
