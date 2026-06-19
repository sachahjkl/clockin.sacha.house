import { RenderMode, type ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
    {
        path: "clockin",
        renderMode: RenderMode.Client,
    },
    {
        path: "history",
        renderMode: RenderMode.Client,
    },
    {
        path: "account",
        renderMode: RenderMode.Client,
    },
    {
        path: "**",
        renderMode: RenderMode.Server,
    },
];
