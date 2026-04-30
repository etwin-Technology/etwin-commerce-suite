// Re-export the landing editor under /admin/landing for super admins.
// The marketing landing page belongs to the platform, not individual sellers.
import { createFileRoute } from "@tanstack/react-router";
import { Route as DashboardLandingRoute } from "./dashboard.landing";

export const Route = createFileRoute("/admin/landing")({
  component: DashboardLandingRoute.options.component!,
});
