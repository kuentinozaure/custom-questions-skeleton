// First load Zone.js and JIT compiler before any Angular modules
import "zone.js";
import "@angular/compiler";

import {
  Component,
  ApplicationRef,
  EnvironmentInjector,
  NgZone,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";

// Minimal app component for bootstrapping
@Component({
  selector: "[temp-app-root]",
  standalone: true,
  template: '<div style="display: none;"></div>',
})
class MinimalAppComponent {}

let applicationRef: ApplicationRef | null = null;
let environmentInjector: EnvironmentInjector | null = null;

export async function bootstrapAngular() {
  if (applicationRef && environmentInjector) {
    return { moduleRef: null, applicationRef, environmentInjector };
  }

  try {
    // Create a temporary div with temp-app-root attribute for Angular to bootstrap into
    const tempRoot = document.createElement("div");
    tempRoot.setAttribute("temp-app-root", "");
    tempRoot.style.display = "none";
    document.body.appendChild(tempRoot);

    // Bootstrap a minimal application to properly initialize Angular's change detection
    // This provides all necessary services including ChangeDetectionScheduler
    applicationRef = await bootstrapApplication(MinimalAppComponent, {
      providers: [], // Use default platform providers
    });

    environmentInjector = applicationRef.injector;

    // Remove the temporary element since we don't need it
    document.body.removeChild(tempRoot);

    return { moduleRef: null, applicationRef, environmentInjector };
  } catch (error) {
    console.error("Error bootstrapping Angular application:", error);
    throw error;
  }
}

export function getModuleRef() {
  return environmentInjector;
}
