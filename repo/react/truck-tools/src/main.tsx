// RepairBench environment adaptation: install the offline Tauri host stub BEFORE anything can
// reach for window.__TAURI_INTERNALS__. An explicit call on an imported binding, not a bare
// side-effect import, so neither the React Compiler nor rolldown can tree-shake it away.
import { installRbBackend } from "@/rbBackend";
import { installRbErrorTap, publishRbProbe } from "@/rbProbe";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";

// UI
import { HeroUIProvider } from "@heroui/system";

// Hooks
import { DarkMode } from "@/hooks/useDarkModeContex";
import { Locale } from "@/hooks/useLocaleContext";
import { ProfileContexInfo } from "@/hooks/useProfileContex";

import "@/styles.css";

installRbBackend();

// RepairBench instrumentation: tap window errors BEFORE the first render so a boot-time crash is
// recorded instead of being swallowed. This tap is what carries the adaptation positive control:
// the pristine seed rejects on mount, the adapted tree must read 0.
installRbErrorTap();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<HeroUIProvider>
			<DarkMode>
				<Locale>
					<ProfileContexInfo>
						<App />
					</ProfileContexInfo>
				</Locale>
			</DarkMode>
		</HeroUIProvider>
	</React.StrictMode>
);

// RepairBench instrumentation: publish the read-only probe object exactly once.
publishRbProbe();
