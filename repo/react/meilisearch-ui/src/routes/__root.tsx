import { Outlet, createRootRoute } from "@tanstack/react-router";
import React from "react";

const TanStackRouterDevtools =
	process.env.NODE_ENV === "development"
		? React.lazy(() =>
				// Lazy load in development
				import("@tanstack/router-devtools").then((res) => ({
					default: res.TanStackRouterDevtools,
				})),
			)
		: () => null; // Render nothing in production;

export const Route = createRootRoute({
	component: () => (
		<>
			<div data-testid="rb-root" style={{ display: "contents" }}>
				<Outlet />
			</div>
			<TanStackRouterDevtools />
		</>
	),
	wrapInSuspense: true,
});
