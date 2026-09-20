import {describe, expect, it} from "vitest";
import {registry, validateRegistry} from "./registry";

// validateRegistry() runs at import time only in dev, so this locks the data invariants
// (option-backed widgets list their own default; duration allowEmpty ⟺ unset default) into CI
// regardless of the runner's dev flag.
describe("validateRegistry", () => {
    it("passes on the shipped registry data", () => {
        expect(() => validateRegistry()).not.toThrow();
    });

    it("upstream-defined enum options include the entry's default", () => {
        // Spot-check the pattern the validator generalizes (see linuxCgroup: options come from
        // Ghostty itself, so default/options drift means an upstream sync went wrong).
        expect(registry.linuxCgroup.widget.options).toContain(registry.linuxCgroup.default);
    });
});
