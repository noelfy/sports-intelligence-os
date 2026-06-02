"""
Biomechanical observation extractor — exercise-aware.

Converts raw biomechanical metrics + exercise context into specific,
actionable observations about movement quality. Each observation describes
WHAT was detected, WHY it matters for THIS exercise, and HOW to fix it.
"""

import numpy as np


class ObservationExtractor:
    """Extracts exercise-specific biomechanical observations.

    Uses exercise context (correct form, common mistakes, coaching cues,
    category-specific thresholds) to generate observations that are
    specific and actionable for each exercise type.
    """

    def __init__(self, sport: str = "general"):
        self.sport = sport

    def evaluate(self, metrics: dict[str, float], sport: str = "general",
                 exercise_context: dict | None = None) -> dict:
        """Convert raw metrics into exercise-aware observations.

        Args:
            metrics: Exercise-specific biomechanical measurements.
            sport: Exercise/sport type for context-aware analysis.
            exercise_context: Dict with exercise_name, category, correct_form,
                              common_mistakes, coaching_cues, phase_names,
                              primary_joints, thresholds.

        Returns:
            Dict with observations, focus_areas, phase_findings, and summary.
        """
        category = exercise_context.get("category", "general") if exercise_context else "general"
        exercise_name = exercise_context.get("exercise_name", "this exercise") if exercise_context else "this exercise"
        thresholds = exercise_context.get("thresholds", {}) if exercise_context else {}
        correct_form = exercise_context.get("correct_form", "") if exercise_context else ""
        common_mistakes = exercise_context.get("common_mistakes", []) if exercise_context else []

        observations = []
        focus_areas = []

        # ── Delegate to category-specific evaluator ──
        if category == "squat":
            observations, focus_areas = self._evaluate_squat(metrics, thresholds, common_mistakes)
        elif category == "hinge":
            observations, focus_areas = self._evaluate_hinge(metrics, thresholds, common_mistakes)
        elif category == "push":
            observations, focus_areas = self._evaluate_push(metrics, thresholds, common_mistakes)
        elif category == "pull":
            observations, focus_areas = self._evaluate_pull(metrics, thresholds, common_mistakes)
        elif category == "core":
            observations, focus_areas = self._evaluate_core(metrics, thresholds)
        elif category == "carry":
            observations, focus_areas = self._evaluate_carry(metrics, thresholds)
        elif category == "isolation":
            observations, focus_areas = self._evaluate_isolation(metrics, thresholds)
        else:
            observations, focus_areas = self._evaluate_general(metrics, thresholds)

        # ── Build summary ──
        summary = self._build_summary(exercise_name, observations, focus_areas, category)

        return {
            "observations": observations,
            "focus_areas": focus_areas,
            "phase_findings": [],
            "summary": summary,
            "category": category,
            "exercise_name": exercise_name,
        }

    # ═══════════════════════════════════════════════════════════════
    # SQUAT EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_squat(self, m: dict, thresholds: dict,
                        common_mistakes: list[str]) -> tuple[list, list]:
        """Evaluate squat-specific metrics."""
        observations = []
        focus_areas = []

        # 1. Depth assessment
        depth = m.get("depth_quality", "unknown")
        knee_min = m.get("knee_angle_min", 0)
        if depth == "deep":
            observations.append({
                "area": "depth",
                "finding": f"Excellent squat depth — knee angle reaches {knee_min}° (well below parallel).",
                "implication": "Full depth maximizes quad and glute activation. Great mobility.",
                "severity": "positive",
            })
        elif depth == "parallel":
            observations.append({
                "area": "depth",
                "finding": f"Good depth — knee angle reaches {knee_min}° (at or near parallel).",
                "implication": "Parallel is sufficient for strength development. Continue working on mobility for deeper squats.",
                "severity": "positive",
            })
        elif depth == "above_parallel":
            observations.append({
                "area": "depth",
                "finding": f"Squat depth is above parallel — knee angle only reaches {knee_min}°.",
                "implication": "Shallow squats reduce quad and glute activation. Work on ankle mobility and hip flexor flexibility to hit depth.",
                "severity": "warning",
            })
            focus_areas.append("Squat depth — aim for hip crease below knee (parallel or deeper). Improve ankle dorsiflexion and hip mobility.")
        elif depth == "shallow":
            observations.append({
                "area": "depth",
                "finding": f"Very shallow squat — knee angle only reaches {knee_min}°. This is closer to a partial squat.",
                "implication": "You're missing most of the strength and muscle-building benefit. Reduce weight and prioritize full range of motion.",
                "severity": "critical",
            })
            focus_areas.append("Squat depth (CRITICAL) — significantly reduce weight and work on achieving parallel depth before adding load.")

        # 2. Knee valgus
        valgus_sev = m.get("knee_valgus_severity", "unknown")
        valgus_max = m.get("knee_valgus_max", 0)
        if valgus_sev == "significant":
            observations.append({
                "area": "knee_tracking",
                "finding": f"Significant knee valgus detected — knees are collapsing inward during the squat.",
                "implication": "Knee valgus increases ACL injury risk and reduces force transfer. Actively push knees outward (think 'spread the floor') and strengthen gluteus medius.",
                "severity": "critical",
            })
            focus_areas.append("Knee valgus — push knees outward during descent and ascent. Strengthen gluteus medius with banded lateral walks and clamshells.")
        elif valgus_sev == "moderate":
            observations.append({
                "area": "knee_tracking",
                "finding": f"Moderate knee valgus detected — knees show some inward collapse.",
                "implication": "Even mild valgus reduces power output. Focus on driving knees out over toes throughout the movement.",
                "severity": "warning",
            })
            focus_areas.append("Knee tracking — consciously push knees outward in line with toes during the squat.")

        # 3. Trunk angle
        trunk_mean = m.get("trunk_angle_mean", 0)
        trunk_max = m.get("trunk_angle_max", 0)
        trunk_threshold = thresholds.get("trunk_angle_max", 45)
        if trunk_max > trunk_threshold:
            observations.append({
                "area": "trunk_position",
                "finding": f"Excessive forward lean — trunk angle reaches {trunk_max:.0f}° (threshold: {trunk_threshold}°).",
                "implication": "Too much forward lean shifts load from legs to lower back, increasing injury risk. Keep chest up and maintain a more upright torso.",
                "severity": "warning",
            })
            focus_areas.append(f"Trunk position — reduce forward lean (currently {trunk_max:.0f}°). Keep chest up, engage lats, and maintain upright posture.")
        elif trunk_mean < 25:
            observations.append({
                "area": "trunk_position",
                "finding": f"Good upright torso position — average trunk angle {trunk_mean:.0f}°.",
                "implication": "Your upright posture keeps the load on your legs where it belongs. Well done.",
                "severity": "positive",
            })

        # 4. Knee asymmetry
        knee_asym = m.get("knee_asymmetry", 0)
        if knee_asym > 10:
            observations.append({
                "area": "symmetry",
                "finding": f"Significant knee asymmetry — {knee_asym:.0f}° difference between left and right knee angles.",
                "implication": "This suggests a strength imbalance or mobility limitation on one side. Consider unilateral work (split squats, lunges) to address the imbalance.",
                "severity": "warning",
            })
            focus_areas.append(f"Left-right asymmetry — {knee_asym:.0f}° knee angle difference. Add unilateral leg work to correct imbalances.")

        # 5. Overall balance
        balance_std = m.get("balance_std", 0)
        if balance_std > 0.06:
            observations.append({
                "area": "stability",
                "finding": f"Lateral instability detected — center of mass variation is high ({balance_std:.3f}).",
                "implication": "This indicates balance issues. Focus on a stable, controlled descent and maintain even foot pressure.",
                "severity": "warning",
            })
            focus_areas.append("Stability — maintain even weight distribution through both feet. Slow down the descent for better control.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # HINGE EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_hinge(self, m: dict, thresholds: dict,
                        common_mistakes: list[str]) -> tuple[list, list]:
        """Evaluate hip hinge movements (deadlift, RDL, clean, snatch, good morning)."""
        observations = []
        focus_areas = []

        # 1. Hip hinge range
        hip_range = m.get("hip_angle_range", 0)
        hip_min = m.get("hip_angle_min", 0)
        if hip_range > 40:
            observations.append({
                "area": "hip_hinge",
                "finding": f"Good hip hinge range — hip angle varies {hip_range:.0f}° through the movement.",
                "implication": "You're effectively using hip flexion and extension, which is the goal of hinge movements.",
                "severity": "positive",
            })
        elif hip_range > 20:
            observations.append({
                "area": "hip_hinge",
                "finding": f"Moderate hip hinge range — hip angle only varies {hip_range:.0f}°.",
                "implication": "Try to achieve greater hip flexion (push hips further back) for more posterior chain engagement.",
                "severity": "info",
            })
        else:
            observations.append({
                "area": "hip_hinge",
                "finding": f"Limited hip hinge — hip angle varies only {hip_range:.0f}°. The movement may be too knee-dominant.",
                "implication": "This looks more like a squat than a hinge. Push your hips BACK (not down) to engage hamstrings and glutes.",
                "severity": "warning",
            })
            focus_areas.append("Hip hinge pattern — push hips BACK, not down. Imagine closing a car door with your butt.")

        # 2. Back position (trunk angle)
        trunk_max = m.get("trunk_angle_max", 0)
        trunk_max_threshold = thresholds.get("trunk_angle_max", 75)
        trunk_min_threshold = thresholds.get("trunk_angle_min", 40)
        if trunk_max > trunk_max_threshold:
            observations.append({
                "area": "back_position",
                "finding": f"Back nearly horizontal at max hinge — trunk angle reaches {trunk_max:.0f}°.",
                "implication": "While some exercises require a near-horizontal back, ensure your spine stays neutral and doesn't round.",
                "severity": "info",
            })
        if trunk_max < trunk_min_threshold and hip_range < 30:
            observations.append({
                "area": "back_position",
                "finding": f"Back too upright for a hinge — trunk angle only reaches {trunk_max:.0f}°.",
                "implication": "You may be squatting the weight rather than hinging. Push hips back further.",
                "severity": "warning",
            })

        # 3. Bar proximity
        bar_prox = m.get("bar_proximity", "unknown")
        bar_dist = m.get("bar_body_distance", 0)
        if bar_prox == "excellent":
            observations.append({
                "area": "bar_path",
                "finding": "Bar stays very close to the body throughout the movement — excellent bar path.",
                "implication": "Keeping the bar close maximizes leverage and reduces lower back stress. Perfect technique.",
                "severity": "positive",
            })
        elif bar_prox == "poor":
            observations.append({
                "area": "bar_path",
                "finding": f"Bar drifts away from the body — average distance {bar_dist:.3f} from center of mass.",
                "implication": "Bar drifting forward dramatically increases lower back strain. Keep the bar in contact with your legs throughout the pull.",
                "severity": "critical",
            })
            focus_areas.append("Bar path — keep the bar pressed against your shins and thighs. If it drifts away, it multiplies the load on your lower back.")

        # 4. Knee stability
        knee_stab = m.get("knee_stability", "unknown")
        knee_range = m.get("knee_angle_range", 0)
        if knee_stab == "poor":
            observations.append({
                "area": "knee_position",
                "finding": f"Knee angle varies {knee_range:.0f}° during the hinge — knees are bending too much.",
                "implication": "The knee should stay at a nearly constant slight bend during a pure hinge. Excess knee movement turns it into a squat pattern.",
                "severity": "warning",
            })
            focus_areas.append("Knee stability — maintain a constant slight knee bend. The movement comes from hips, not knees.")

        # 5. Balance
        balance_std = m.get("balance_std", 0)
        if balance_std > 0.05:
            observations.append({
                "area": "stability",
                "finding": f"Balance instability detected — center of mass variation {balance_std:.3f}.",
                "implication": "Weight should stay centered over mid-foot. Avoid rocking onto toes or heels.",
                "severity": "warning",
            })
            focus_areas.append("Foot pressure — keep weight evenly distributed over mid-foot. Don't rock onto toes.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # PUSH EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_push(self, m: dict, thresholds: dict,
                       common_mistakes: list[str]) -> tuple[list, list]:
        """Evaluate pushing movements (bench, OHP, push-ups, dips, jerks)."""
        observations = []
        focus_areas = []

        # 1. Elbow flare risk
        flare_risk = m.get("elbow_flare_risk", "unknown")
        shoulder_abd = m.get("shoulder_abduction_mean", 0)
        if flare_risk == "high":
            observations.append({
                "area": "elbow_position",
                "finding": f"High elbow flare risk — shoulder abduction averages {shoulder_abd:.0f}° (above 80° is dangerous).",
                "implication": "Elbows flared at 90° put enormous stress on shoulder joints and rotator cuff. Tuck elbows to 45-60° from your body.",
                "severity": "critical",
            })
            focus_areas.append("Elbow flare (CRITICAL) — tuck elbows to 45-60° from body. Wide flaring at 90° risks shoulder impingement and reduces pressing power.")
        elif flare_risk == "moderate":
            observations.append({
                "area": "elbow_position",
                "finding": f"Moderate elbow flare — shoulder abduction at {shoulder_abd:.0f}°.",
                "implication": "Elbows could be tucked slightly more for optimal shoulder safety and pressing efficiency.",
                "severity": "info",
            })

        # 2. Bar path
        bar_path = m.get("bar_path_quality", "unknown")
        bar_std = m.get("bar_path_std", 0)
        if bar_path == "excellent":
            observations.append({
                "area": "bar_path",
                "finding": "Straight, controlled bar path — excellent pressing mechanics.",
                "implication": "A straight bar path is the most efficient way to move weight overhead or off the chest.",
                "severity": "positive",
            })
        elif bar_path == "needs_work":
            observations.append({
                "area": "bar_path",
                "finding": f"Bar path is inconsistent — lateral deviation std of {bar_std:.3f}.",
                "implication": "The bar is not traveling in a straight line, wasting energy. Focus on a controlled, vertical bar path.",
                "severity": "warning",
            })
            focus_areas.append("Bar path — focus on pressing in a straight vertical line. Avoid the bar wandering forward or sideways.")

        # 3. Lockout quality
        lockout = m.get("lockout_quality", "unknown")
        lockout_angle = m.get("lockout_max_angle", 0)
        if lockout == "full":
            observations.append({
                "area": "lockout",
                "finding": f"Full lockout achieved — elbows reach {lockout_angle:.0f}° extension.",
                "implication": "Full lockout builds tricep strength and shoulder stability at end range.",
                "severity": "positive",
            })
        elif lockout == "incomplete":
            observations.append({
                "area": "lockout",
                "finding": f"Incomplete lockout — elbows only reach {lockout_angle:.0f}°. Full extension should be above 160°.",
                "implication": "Not locking out means you're missing the most important part of the lift for tricep development and shoulder stability.",
                "severity": "warning",
            })
            focus_areas.append("Lockout — fully extend arms at the top of each rep. The lockout position builds critical shoulder stability.")

        # 4. Shoulder symmetry
        shoulder_sym = m.get("shoulder_symmetry", 0)
        if shoulder_sym > 0.15:
            observations.append({
                "area": "symmetry",
                "finding": f"Shoulder asymmetry detected — one side is significantly higher ({shoulder_sym*100:.0f}% difference).",
                "implication": "Asymmetry during pressing can indicate strength imbalance or scapular dysfunction. Focus on even, symmetrical pressing.",
                "severity": "warning",
            })
            focus_areas.append("Press symmetry — ensure both arms work evenly. Dumbbell work can help correct side-to-side imbalances.")

        # 5. Balance
        balance_std = m.get("balance_std", 0)
        if balance_std > 0.04:
            observations.append({
                "area": "stability",
                "finding": f"Upper body instability — center of mass variation {balance_std:.3f} during press.",
                "implication": "Maintain a stable base. For standing presses, brace your core and squeeze glutes. For bench, keep shoulder blades retracted.",
                "severity": "warning",
            })
            focus_areas.append("Stability — create a solid base before pressing. Brace core, retract scapula, plant feet.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # PULL EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_pull(self, m: dict, thresholds: dict,
                       common_mistakes: list[str]) -> tuple[list, list]:
        """Evaluate pulling movements (pull-ups, rows, face pulls, muscle-ups)."""
        observations = []
        focus_areas = []

        # 1. Body stability (swing detection)
        body_stab = m.get("body_stability", "unknown")
        swing_std = m.get("body_swing_std", 0)
        if body_stab == "excellent":
            observations.append({
                "area": "body_control",
                "finding": "Minimal body swing — excellent stability during the pull.",
                "implication": "No energy wasted on swinging. All force goes into the pull. Textbook form.",
                "severity": "positive",
            })
        elif body_stab == "excessive_swing":
            observations.append({
                "area": "body_control",
                "finding": f"Excessive body swing detected — lateral movement variation {swing_std:.3f}.",
                "implication": "Swinging/kipping reduces the effectiveness of the exercise. Use strict, controlled form for maximum muscle activation.",
                "severity": "critical",
            })
            focus_areas.append("Body control — eliminate swinging/kipping. Use strict, controlled form. If you can't complete reps without swinging, use assistance (bands or assisted machine).")

        # 2. Range of motion
        elbow_rom = m.get("elbow_rom", 0)
        if elbow_rom > 80:
            observations.append({
                "area": "range_of_motion",
                "finding": f"Full range of motion — elbow angle travels {elbow_rom:.0f}° from full extension to full contraction.",
                "implication": "Full ROM maximizes back muscle activation and flexibility benefits.",
                "severity": "positive",
            })
        elif elbow_rom > 50:
            observations.append({
                "area": "range_of_motion",
                "finding": f"Partial range of motion — elbow only travels {elbow_rom:.0f}°.",
                "implication": "You're missing the stretched position (full extension), which is crucial for back development.",
                "severity": "warning",
            })
            focus_areas.append("Range of motion — go to full extension at the bottom of each rep (dead hang for pull-ups, full arm extension for rows).")
        else:
            observations.append({
                "area": "range_of_motion",
                "finding": f"Very limited range of motion — elbow only moves {elbow_rom:.0f}°.",
                "implication": "These are partial reps. Reduce weight/resistance and prioritize full range of motion to actually build strength through the entire movement.",
                "severity": "critical",
            })
            focus_areas.append("Range of motion (CRITICAL) — significantly reduce weight and perform full ROM reps. Half reps build half the strength.")

        # 3. Scapular engagement
        scap_range = m.get("scapular_retraction_range", 0)
        if scap_range > 30:
            observations.append({
                "area": "scapular_engagement",
                "finding": f"Good scapular retraction — shoulder blades move through {scap_range:.0f}° range.",
                "implication": "You're engaging your back muscles properly. Scapular movement is essential for healthy shoulders.",
                "severity": "positive",
            })
        elif scap_range < 15:
            observations.append({
                "area": "scapular_engagement",
                "finding": f"Limited scapular movement — shoulder blades only move {scap_range:.0f}°.",
                "implication": "You may be pulling primarily with arms rather than back. Focus on initiating the pull by squeezing shoulder blades together first.",
                "severity": "warning",
            })
            focus_areas.append("Scapular engagement — initiate each pull by squeezing shoulder blades together FIRST, then pull with arms.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # CORE EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_core(self, m: dict, thresholds: dict) -> tuple[list, list]:
        """Evaluate core/stability exercises."""
        observations = []
        focus_areas = []

        core_stab = m.get("core_stability", "unknown")
        hip_sag = m.get("hip_sag_std", 0)
        body_line_quality = m.get("body_line_quality", "unknown")
        body_line_angle = m.get("body_line_angle", 0)

        if core_stab == "excellent":
            observations.append({
                "area": "core_stability",
                "finding": "Excellent core stability — minimal hip movement throughout the hold.",
                "implication": "Your core is effectively stabilizing your spine. This is the foundation of all strength.",
                "severity": "positive",
            })
        elif core_stab == "needs_work":
            observations.append({
                "area": "core_stability",
                "finding": f"Hips are sagging or piking — vertical variation {hip_sag:.3f}.",
                "implication": "Hip sagging indicates core fatigue or insufficient bracing. Focus on squeezing glutes and pulling belly button to spine.",
                "severity": "warning",
            })
            focus_areas.append("Core bracing — squeeze glutes, pull belly button to spine, maintain a straight line from head to heels.")

        if body_line_quality == "excellent":
            observations.append({
                "area": "body_alignment",
                "finding": f"Excellent body alignment — near-perfect straight line at {body_line_angle:.0f}°.",
                "implication": "Your body position is ideal for core activation and spinal safety.",
                "severity": "positive",
            })
        elif body_line_quality == "poor":
            observations.append({
                "area": "body_alignment",
                "finding": f"Poor body alignment — body angle {body_line_angle:.0f}° (180° is ideal).",
                "implication": "Your body is not in a straight line. This reduces core activation and can strain the lower back.",
                "severity": "critical",
            })
            focus_areas.append("Body alignment — your body should form a straight line. Tuck your pelvis slightly (posterior tilt) to engage abs fully.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # CARRY EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_carry(self, m: dict, thresholds: dict) -> tuple[list, list]:
        """Evaluate loaded carry movements."""
        observations = []
        focus_areas = []

        posture = m.get("posture_quality", "unknown")
        trunk_lean = m.get("trunk_lean_mean", 0)

        if posture == "excellent":
            observations.append({
                "area": "posture",
                "finding": f"Excellent upright posture — trunk lean only {trunk_lean:.0f}°.",
                "implication": "You're maintaining proper alignment under load. This protects your spine during carries.",
                "severity": "positive",
            })
        elif posture == "needs_work":
            observations.append({
                "area": "posture",
                "finding": f"Significant trunk lean — {trunk_lean:.0f}° from vertical.",
                "implication": "Leaning under load puts uneven stress on the spine. Stand tall, shoulders back, core braced.",
                "severity": "warning",
            })
            focus_areas.append(f"Posture — stand tall with shoulders back. Currently leaning {trunk_lean:.0f}° from vertical. Brace core and keep load centered.")

        walk_stab = m.get("walking_stability", 0)
        if walk_stab > 0.05:
            observations.append({
                "area": "gait",
                "finding": "Uneven walking pattern detected during the carry.",
                "implication": "Short, controlled steps with even weight distribution work best for loaded carries.",
                "severity": "info",
            })
            focus_areas.append("Walking pattern — take short, controlled steps. Avoid long strides that cause lateral sway.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # ISOLATION EVALUATION
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_isolation(self, m: dict, thresholds: dict) -> tuple[list, list]:
        """Evaluate isolation exercises."""
        observations = []
        focus_areas = []

        iso_quality = m.get("isolation_quality", "unknown")
        momentum = m.get("body_momentum_std", 0)
        elbow_rom = m.get("elbow_rom", 0)

        if iso_quality == "excellent":
            observations.append({
                "area": "isolation",
                "finding": "Excellent isolation — minimal body movement, all work done by the target muscle.",
                "implication": "This is how isolation exercises should look. The target muscle is doing all the work.",
                "severity": "positive",
            })
        elif iso_quality == "poor":
            observations.append({
                "area": "isolation",
                "finding": f"Significant body momentum detected — body sway {momentum:.3f}. The target muscle is being assisted by body English.",
                "implication": "Using momentum to move the weight defeats the purpose of isolation work. Reduce weight and use strict, controlled form.",
                "severity": "critical",
            })
            focus_areas.append("Strict form — eliminate body momentum. Reduce weight and focus on feeling the target muscle work through a full range of motion. No swinging, no cheating.")

        if elbow_rom < 40:
            observations.append({
                "area": "range_of_motion",
                "finding": f"Limited range of motion — elbow only moves {elbow_rom:.0f}°.",
                "implication": "Partial reps reduce muscle activation and growth stimulus. Use full range of motion.",
                "severity": "warning",
            })
            focus_areas.append("Full range of motion — complete each rep from full stretch to full contraction.")

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # GENERAL EVALUATION (fallback)
    # ═══════════════════════════════════════════════════════════════

    def _evaluate_general(self, m: dict, thresholds: dict) -> tuple[list, list]:
        """Generic evaluation when category is unknown."""
        observations = []
        focus_areas = []

        balance_std = m.get("balance_std", 0)
        shoulder_sym = m.get("shoulder_symmetry", 0)
        trunk_mean = m.get("trunk_angle_mean", 0)

        if balance_std > 0.06:
            observations.append({
                "area": "stability",
                "finding": f"Center of mass variation is elevated ({balance_std:.3f}).",
                "implication": "Work on maintaining a stable, controlled base throughout the movement.",
                "severity": "warning",
            })
            focus_areas.append("Stability — maintain a controlled, stable position throughout the movement.")

        if shoulder_sym > 0.2:
            observations.append({
                "area": "symmetry",
                "finding": f"Shoulder asymmetry detected ({shoulder_sym*100:.0f}%).",
                "implication": "This may indicate a strength imbalance. Focus on even, bilateral movement.",
                "severity": "warning",
            })
            focus_areas.append("Symmetry — work on even, balanced movement on both sides.")

        if trunk_mean > 30:
            observations.append({
                "area": "posture",
                "finding": f"Trunk lean averages {trunk_mean:.0f}°.",
                "implication": "Depending on the exercise, this may be excessive. Keep your core engaged.",
                "severity": "info",
            })

        if not focus_areas:
            observations.append({
                "area": "overall",
                "finding": "Movement mechanics appear within normal ranges for the detected movement pattern.",
                "implication": "Continue focused practice with attention to form.",
                "severity": "positive",
            })

        return observations, focus_areas

    # ═══════════════════════════════════════════════════════════════
    # SUMMARY BUILDER
    # ═══════════════════════════════════════════════════════════════

    def _build_summary(self, exercise_name: str, observations: list,
                       focus_areas: list, category: str) -> str:
        """Build an exercise-specific summary."""
        critical = [o for o in observations if o.get("severity") == "critical"]
        warnings = [o for o in observations if o.get("severity") == "warning"]
        positive = [o for o in observations if o.get("severity") == "positive"]

        parts = []

        # Lead with the most important finding
        if critical:
            parts.append(
                f"Your {exercise_name} shows {len(critical)} critical form issue{'s' if len(critical) > 1 else ''} "
                f"that need immediate attention: {critical[0]['finding'].split('.')[0].lower()}."
            )
        elif warnings:
            parts.append(
                f"Your {exercise_name} has {len(warnings)} area{'s' if len(warnings) > 1 else ''} "
                f"for improvement. The most impactful: {warnings[0]['finding'].split('.')[0].lower()}."
            )
        else:
            parts.append(
                f"Your {exercise_name} form looks solid across the key metrics measured."
            )

        # Add positive reinforcement
        if positive:
            parts.append(
                f"On the positive side, {positive[0]['finding'].split('.')[0].lower()}."
            )

        # Add specific coaching cues based on category
        if focus_areas:
            parts.append(f"Focus your next session on: {focus_areas[0]}")

        return " ".join(parts)
