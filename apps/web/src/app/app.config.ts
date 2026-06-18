import { LOCALE_ID, ApplicationConfig, isDevMode, provideZoneChangeDetection } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
    provideRouter,
    withComponentInputBinding,
    withDebugTracing,
} from "@angular/router";
import { apiBaseInterceptor } from "./core/api-base.interceptor";
import { apiErrorInterceptor } from "./core/api-error.interceptor";
import { authHeadersInterceptor } from "./core/auth-headers.interceptor";
import { routes } from "./app.routes";

const routerFeatures = [
    withComponentInputBinding(),
    ...(isDevMode() ? [withDebugTracing()] : []),
];

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(
            withInterceptors([apiBaseInterceptor, authHeadersInterceptor, apiErrorInterceptor]),
        ),
        provideRouter(routes, ...routerFeatures),
        { provide: LOCALE_ID, useValue: "fr-FR" },
    ],
};