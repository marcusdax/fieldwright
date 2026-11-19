// Fieldwright Backend — Community Safety Blanket, Zero-Harm Policy & Blanket Search Party Contract
// Zero-dependency Node ESM module mirroring core/model/.../SafetyBlanket.kt & MASTERNEX.os safety_blanket.py.

export const VANGUARD_TIERS = Object.freeze(["tier_1_sentinel", "tier_2_cst", "tier_3_lcso"]);

export const HIGH_DANGER_HAZARDS = Object.freeze([
  "potential_violent_resident",
  "potential_violent_family_member",
  "active_protective_order",
  "weapons_reported_on_premises",
]);

export const VERIFIED_HAZARD_SOURCES = Object.freeze([
  "court_protective_order",
  "caseworker_verified_history",
  "law_enforcement_prior_incident",
  "clinical_behavioral_plan",
]);

export function evaluateFieldwrightDispatch({
  tier = "tier_1_sentinel",
  isActiveThreat = false,
  hazards = [],
  stateLicenseVerified = false,
  homeownerAuthorizedLcso = false,
} = {}) {
  if (!VANGUARD_TIERS.includes(tier)) throw new Error(`Invalid tier: ${tier}`);
  for (const h of hazards) {
    if (!VERIFIED_HAZARD_SOURCES.includes(h.source)) {
      throw new Error(`Hazard flag requires verified non-AI source: ${h.source}`);
    }
  }
  const hasViolenceRisk = hazards.some((h) => HIGH_DANGER_HAZARDS.includes(h.flag));
  if (isActiveThreat || hasViolenceRisk) {
    if (tier !== "tier_3_lcso") {
      return {
        permitted: false,
        stayClearGeofenceActive: true,
        lawEnforcementEscortRecommended: true,
        reason: "ZERO_HARM_LOCK: Tier 1/2 field workers hard-blocked; STAY_CLEAR geofence enforced.",
      };
    }
    const lcsoOk = Boolean(stateLicenseVerified && homeownerAuthorizedLcso && !hasViolenceRisk);
    return {
      permitted: lcsoOk,
      stayClearGeofenceActive: !lcsoOk,
      lawEnforcementEscortRecommended: true,
      reason: lcsoOk ? "TIER_3_LCSO_EXTERIOR_VERIFICATION_AUTHORIZED" : "LAW_ENFORCEMENT_ESCORT_REQUIRED",
    };
  }
  return {
    permitted: true,
    stayClearGeofenceActive: false,
    lawEnforcementEscortRecommended: false,
    reason: "SAFE_SUPPORT_OR_SEARCH_PARTY_PERMITTED",
  };
}

export function wipeSearchCardOnFoundSafe(card, outcome = "found_safe") {
  return {
    ...card,
    status: `closed:${outcome}`,
    clothing: "[CRYPTOGRAPHICALLY_WIPED]",
    deescalationInstructions: "[CRYPTOGRAPHICALLY_WIPED]",
    photoTokenActive: false,
  };
}
