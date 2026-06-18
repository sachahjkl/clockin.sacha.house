import { type HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AccountService } from "./account.service";
import { I18nService } from "./i18n.service";

export const authHeadersInterceptor: HttpInterceptorFn = (request, next) => {
    const account = inject(AccountService);
    const i18n = inject(I18nService);

    let clone = request.clone({
        setHeaders: {
            "Accept-Language": i18n.language(),
        },
    });

    const userId = account.userId();
    if (userId) {
        clone = clone.clone({
            setHeaders: {
                Authorization: `Bearer ${userId}`,
            },
        });
    }

    return next(clone);
};
