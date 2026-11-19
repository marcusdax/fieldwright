package com.odasi.fieldwright.model

/**
 * Fieldwright Community Safety Blanket Domain Model & Zero-Harm Policy Engine.
 * Mirrors MASTERNEX.os (safety_blanket.py) and @vanguard/trust-engine (safetyBlanket.ts).
 */
enum class VanguardSecurityTier {
    TIER_1_SENTINEL,
    TIER_2_CST,
    TIER_3_LCSO
}

enum class HouseholdHazardFlag {
    POTENTIAL_VIOLENT_RESIDENT,
    POTENTIAL_VIOLENT_FAMILY_MEMBER,
    ACTIVE_PROTECTIVE_ORDER,
    WEAPONS_REPORTED_ON_PREMISES,
    ACUTE_BEHAVIORAL_AGGRESSION,
    AGGRESSIVE_ANIMAL_ON_PREMISES
}

enum class HazardRecordSource {
    COURT_PROTECTIVE_ORDER,
    CASEWORKER_VERIFIED_HISTORY,
    LAW_ENFORCEMENT_PRIOR_INCIDENT,
    CLINICAL_BEHAVIORAL_PLAN
}

data class HouseholdHazardEntry(
    val flag: HouseholdHazardFlag,
    val source: HazardRecordSource,
    val officerSafetyNote: String = ""
)

data class BlanketSearchCard(
    val searchId: String,
    val status: String,
    val clothing: String,
    val deescalationInstructions: String,
    val waterHazardPriority: Boolean = true,
    val photoTokenActive: Boolean = false,
    val visualOnlyNoRestraint: Boolean = true
) {
    fun wipeOnFoundSafe(outcome: String = "found_safe"): BlanketSearchCard = copy(
        status = "closed:$outcome",
        clothing = "[CRYPTOGRAPHICALLY_WIPED]",
        deescalationInstructions = "[CRYPTOGRAPHICALLY_WIPED]",
        photoTokenActive = false
    )
}

data class DispatchGateDecision(
    val permitted: Boolean,
    val stayClearGeofenceActive: Boolean,
    val lawEnforcementEscortRecommended: Boolean,
    val reason: String
)

object SafetyBlanketPolicy {
    private val HIGH_DANGER_FLAGS = setOf(
        HouseholdHazardFlag.POTENTIAL_VIOLENT_RESIDENT,
        HouseholdHazardFlag.POTENTIAL_VIOLENT_FAMILY_MEMBER,
        HouseholdHazardFlag.ACTIVE_PROTECTIVE_ORDER,
        HouseholdHazardFlag.WEAPONS_REPORTED_ON_PREMISES
    )

    fun evaluateFieldWorkerDispatch(
        tier: VanguardSecurityTier,
        isActiveThreat: Boolean,
        hazards: List<HouseholdHazardEntry> = emptyList(),
        stateLicenseVerified: Boolean = false,
        homeownerAuthorizedLcso: Boolean = false
    ): DispatchGateDecision {
        val hasViolenceOrWeaponRisk = hazards.any { it.flag in HIGH_DANGER_FLAGS }
        if (isActiveThreat || hasViolenceOrWeaponRisk) {
            if (tier != VanguardSecurityTier.TIER_3_LCSO) {
                return DispatchGateDecision(
                    permitted = false,
                    stayClearGeofenceActive = true,
                    lawEnforcementEscortRecommended = true,
                    reason = "ZERO_HARM_LOCK: Tier 1/2 field workers are hard-blocked; STAY_CLEAR geofence enforced."
                )
            }
            val lcsoAllowed = stateLicenseVerified && homeownerAuthorizedLcso && !hasViolenceOrWeaponRisk
            return DispatchGateDecision(
                permitted = lcsoAllowed,
                stayClearGeofenceActive = !lcsoAllowed,
                lawEnforcementEscortRecommended = true,
                reason = if (lcsoAllowed) "TIER_3_LCSO_EXTERIOR_VERIFICATION_AUTHORIZED" else "LAW_ENFORCEMENT_ESCORT_REQUIRED"
            )
        }
        return DispatchGateDecision(
            permitted = true,
            stayClearGeofenceActive = false,
            lawEnforcementEscortRecommended = false,
            reason = "SAFE_SUPPORT_OR_SEARCH_PARTY_PERMITTED"
        )
    }
}
