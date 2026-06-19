import {
    ENVIRONMENT_INITIALIZER,
    LOCALE_ID,
    ApplicationConfig,
    inject,
    isDevMode,
    provideZoneChangeDetection,
} from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
    provideRouter,
    withComponentInputBinding,
    withDebugTracing,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { apiBaseInterceptor } from "./core/api-base.interceptor";
import { apiErrorInterceptor } from "./core/api-error.interceptor";
import { authHeadersInterceptor } from "./core/auth-headers.interceptor";
import { routes } from "./app.routes";
import { provideClientHydration } from "@angular/platform-browser";
import { SeoService } from "./core/seo.service";

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
        provideServiceWorker("ngsw-worker.js", {
            enabled: !isDevMode(),
            registrationStrategy: "registerWhenStable:30000",
        }),
        {
            provide: ENVIRONMENT_INITIALIZER,
            multi: true,
            useValue: () => inject(SeoService),
        },
        { provide: LOCALE_ID, useValue: "fr-FR" },
        provideClientHydration(),
    ],
};
