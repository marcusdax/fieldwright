import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateFieldwrightDispatch, wipeSearchCardOnFoundSafe } from "./safety-blanket.mjs";

describe("Fieldwright Community Safety Blanket & Zero-Harm Policy", () => {
  it("hard-blocks Tier 1/2 field workers on active threats and documented violence hazards", () => {
    const active = evaluateFieldwrightDispatch({ tier: "tier_1_sentinel", isActiveThreat: true });
    assert.equal(active.permitted, false);
    assert.equal(active.stayClearGeofenceActive, true);
    assert.equal(active.lawEnforcementEscortRecommended, true);

    assert.throws(
      () =>
        evaluateFieldwrightDispatch({
          tier: "tier_2_cst",
          hazards: [{ flag: "potential_violent_family_member", source: "ai_guess" }],
        }),
      /verified non-AI source/
    );

    const violence = evaluateFieldwrightDispatch({
      tier: "tier_2_cst",
      hazards: [{ flag: "potential_violent_family_member", source: "court_protective_order" }],
    });
    assert.equal(violence.permitted, false);
    assert.equal(violence.stayClearGeofenceActive, true);

    const lcso = evaluateFieldwrightDispatch({
      tier: "tier_3_lcso",
      isActiveThreat: true,
      stateLicenseVerified: true,
      homeownerAuthorizedLcso: true,
    });
    assert.equal(lcso.permitted, true);

    const safe = evaluateFieldwrightDispatch({ tier: "tier_1_sentinel", isActiveThreat: false });
    assert.equal(safe.permitted, true);
    assert.equal(safe.stayClearGeofenceActive, false);
  });

  it("cryptographically wipes Blanket Search Party card when found safe", () => {
    const wiped = wipeSearchCardOnFoundSafe({
      searchId: "bsp-1",
      status: "active",
      clothing: "Red hoodie",
      deescalationInstructions: "Nonverbal",
      photoTokenActive: true,
    });
    assert.equal(wiped.clothing, "[CRYPTOGRAPHICALLY_WIPED]");
    assert.equal(wiped.photoTokenActive, false);
  });
});
