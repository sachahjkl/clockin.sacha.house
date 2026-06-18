import { type HttpInterceptorFn } from "@angular/common/http";

export const apiBaseInterceptor: HttpInterceptorFn = (request, next) => {
    if (!request.url.startsWith("/")) {
        return next(request);
    }

    if (request.url.startsWith("/api/") || request.url.startsWith("/assets/")) {
        return next(request);
    }

    return next(request.clone({ url: `/api${request.url}` }));
};
