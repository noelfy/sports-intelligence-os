"""
Exercise context configuration.

Maps exercise IDs to biomechanical analysis parameters so the analysis
pipeline can provide exercise-specific feedback instead of volleyball-specific.
"""

from dataclasses import dataclass, field


@dataclass
class ExerciseContext:
    """Biomechanical context for analyzing a specific exercise."""

    exercise_id: str
    exercise_name: str
    category: str  # squat, hinge, push, pull, core, isolation, carry

    # Which joints to focus on when finding the key frame
    # "lowest_hip" = frame with lowest hip position (squat bottom)
    # "highest_wrist" = frame with highest wrist (overhead press)
    # "peak_knee_flexion" = frame where knee angle is most acute
    # "midpoint" = middle frame
    key_frame_strategy: str = "lowest_hip"

    # Phase names appropriate for this exercise type
    phase_names: list[str] = field(default_factory=lambda: ["eccentric", "bottom", "concentric"])

    # Primary joints for angle analysis
    primary_joints: list[str] = field(default_factory=list)

    # Biomechanical thresholds (overrides defaults)
    # balance: acceptable CoM lateral variation
    # trunk_angle: acceptable forward lean in degrees
    # shoulder_symmetry: acceptable shoulder height diff ratio
    thresholds: dict = field(default_factory=dict)

    # Correct form description for the LLM prompt
    correct_form: str = ""
    common_mistakes: list[str] = field(default_factory=list)
    coaching_cues: list[str] = field(default_factory=list)


# ============================================================
# Exercise configurations by category
# ============================================================

EXERCISE_CONFIGS: dict[str, ExerciseContext] = {
    # ── SQUAT variations ────────────────────────────────────
    "barbell-squats": ExerciseContext(
        exercise_id="barbell-squats",
        exercise_name="Barbell Squats",
        category="squat",
        key_frame_strategy="lowest_hip",
        phase_names=["descent", "bottom", "ascent"],
        primary_joints=["knee", "hip", "ankle", "trunk", "shoulder"],
        thresholds={
            "trunk_angle_max": 45,  # forward lean > 45° is excessive
            "trunk_angle_ideal": 25,  # some forward lean is normal
            "shoulder_diff_max": 0.15,  # bar should be level
            "balance_std_max": 0.05,
        },
        correct_form="Feet shoulder-width apart, chest up, back straight. Break at hips and knees simultaneously. Descend until thighs are parallel to ground (or deeper). Knees track over toes. Drive through heels to stand.",
        common_mistakes=[
            "Knees caving inward (valgus collapse)",
            "Heels lifting off the ground",
            "Rounding the lower back (butt wink)",
            "Not hitting parallel depth",
            "Chest collapsing forward",
        ],
        coaching_cues=[
            "Push knees outward",
            "Keep weight on heels",
            "Chest up, proud posture",
            "Break parallel",
        ],
    ),
    "bulgarian-split-squats": ExerciseContext(
        exercise_id="bulgarian-split-squats",
        exercise_name="Bulgarian Split Squats",
        category="squat",
        key_frame_strategy="lowest_hip",
        phase_names=["descent", "bottom", "ascent"],
        primary_joints=["knee", "hip", "ankle", "trunk"],
        thresholds={"trunk_angle_max": 30, "balance_std_max": 0.06},
        correct_form="Rear foot elevated on bench. Front foot far enough forward that knee doesn't travel past toes. Torso upright. Descend until front thigh is parallel. Drive through front heel.",
        common_mistakes=[
            "Front knee traveling too far forward",
            "Torso leaning too far forward",
            "Rear leg doing too much work",
            "Instability / wobbling",
        ],
        coaching_cues=["Keep torso upright", "Drive through front heel", "Control the descent"],
    ),
    "goblet-squats": ExerciseContext(
        exercise_id="goblet-squats",
        exercise_name="Goblet Squats",
        category="squat",
        key_frame_strategy="lowest_hip",
        phase_names=["descent", "bottom", "ascent"],
        primary_joints=["knee", "hip", "ankle", "trunk"],
        thresholds={"trunk_angle_max": 30, "balance_std_max": 0.04},
        correct_form="Hold dumbbell/ketlebell at chest. Feet shoulder-width. Elbows inside knees at bottom. Chest up. Descend deep while keeping torso upright.",
        common_mistakes=["Rounding upper back", "Knees caving in", "Not going deep enough"],
        coaching_cues=["Elbows touch knees", "Chest up", "Push knees out"],
    ),
    "lunges": ExerciseContext(
        exercise_id="lunges",
        exercise_name="Lunges",
        category="squat",
        key_frame_strategy="lowest_hip",
        phase_names=["step", "descent", "bottom", "ascent", "recover"],
        primary_joints=["knee", "hip", "ankle", "trunk"],
        thresholds={"trunk_angle_max": 25, "balance_std_max": 0.07},
        correct_form="Step forward, both knees bend to ~90°. Front knee over ankle (not past toes). Rear knee hovers just above ground. Torso upright. Push through front heel to return.",
        common_mistakes=["Front knee caving in", "Torso leaning forward", "Rear knee slamming into ground", "Wobbly balance"],
        coaching_cues=["Knees at 90°", "Stay upright", "Controlled step"],
    ),

    # ── HINGE variations ────────────────────────────────────
    "deadlifts": ExerciseContext(
        exercise_id="deadlifts",
        exercise_name="Deadlifts",
        category="hinge",
        key_frame_strategy="lowest_hip",
        phase_names=["setup", "pull", "lockout", "lowering"],
        primary_joints=["hip", "knee", "trunk", "shoulder"],
        thresholds={
            "trunk_angle_min": 45,  # should be bent over at start
            "trunk_angle_max": 80,  # but not horizontal
            "shoulder_diff_max": 0.12,
            "balance_std_max": 0.04,
        },
        correct_form="Feet hip-width, bar over midfoot. Hips back, chest up, back flat (neutral spine). Shoulders slightly ahead of bar. Drive through heels, extend hips and knees together. Lock out with glutes. Bar stays close to body.",
        common_mistakes=[
            "Rounding the lower back",
            "Hips rising too fast (stiff-leg deadlift)",
            "Bar drifting away from body",
            "Jerking the bar off the floor",
            "Over-extending at lockout",
        ],
        coaching_cues=[
            "Chest up, proud posture",
            "Push the floor away",
            "Bar close to shins",
            "Hips and shoulders rise together",
        ],
    ),
    "romanian-deadlifts": ExerciseContext(
        exercise_id="romanian-deadlifts",
        exercise_name="Romanian Deadlifts",
        category="hinge",
        key_frame_strategy="peak_hip_flexion",
        phase_names=["descent", "bottom", "ascent"],
        primary_joints=["hip", "knee", "trunk"],
        thresholds={"trunk_angle_max": 70, "balance_std_max": 0.04},
        correct_form="Soft knees, hips back, back flat. Bar stays close to legs. Descend until hamstring stretch (mid-shin). Hinge at hips — minimal knee bend change. Return by driving hips forward.",
        common_mistakes=["Rounding back", "Bending knees too much (turning into squat)", "Bar too far from legs"],
        coaching_cues=["Hips back", "Flat back", "Bar on legs"],
    ),
    "hip-thrusts": ExerciseContext(
        exercise_id="hip-thrusts",
        exercise_name="Hip Thrusts",
        category="hinge",
        key_frame_strategy="peak_hip_extension",
        phase_names=["descent", "bottom", "thrust"],
        primary_joints=["hip", "knee", "trunk"],
        thresholds={"trunk_angle_max": 30, "balance_std_max": 0.03},
        correct_form="Upper back on bench, bar across hips. Knees bent ~90°. Drive hips up until body forms straight line from shoulders to knees. Squeeze glutes at top. Controlled descent.",
        common_mistakes=["Hyperextending lower back", "Not achieving full hip extension", "Feet too far or too close"],
        coaching_cues=["Squeeze glutes at top", "Ribs down", "Drive through heels"],
    ),
    "glute-bridges": ExerciseContext(
        exercise_id="glute-bridges",
        exercise_name="Glute Bridges",
        category="hinge",
        key_frame_strategy="peak_hip_extension",
        phase_names=["descent", "bottom", "thrust"],
        primary_joints=["hip", "trunk"],
        thresholds={"trunk_angle_max": 20, "balance_std_max": 0.03},
        correct_form="Lie on back, knees bent, feet flat. Drive hips up until straight line from knees to shoulders. Squeeze glutes. Controlled lowering.",
        common_mistakes=["Hyperextending back", "Not squeezing glutes", "Heels lifting"],
        coaching_cues=["Glute squeeze", "Straight line", "Push through heels"],
    ),

    # ── PUSH variations ────────────────────────────────────
    "barbell-bench-press": ExerciseContext(
        exercise_id="barbell-bench-press",
        exercise_name="Barbell Bench Press",
        category="push",
        key_frame_strategy="lowest_bar",
        phase_names=["descent", "bottom", "press"],
        primary_joints=["shoulder", "elbow", "wrist"],
        thresholds={
            "shoulder_diff_max": 0.08,  # bar must be level
            "trunk_angle_max": 5,  # lying down — trunk angle irrelevant
            "balance_std_max": 0.02,  # should be very stable
        },
        correct_form="Lie flat on bench. Feet planted. Retract shoulder blades. Bar lowers to lower chest / sternum. Elbows at ~45-75° from body. Press bar in straight line (or slight J-curve). Lock out at top.",
        common_mistakes=[
            "Elbows flaring too wide (90° from body)",
            "Bouncing bar off chest",
            "Uneven bar (one side higher)",
            "Feet lifting off floor",
            "Shoulders rounding forward",
        ],
        coaching_cues=["Retract scapula", "Tuck elbows", "Touch and press", "Feet planted"],
    ),
    "incline-dumbbell-press": ExerciseContext(
        exercise_id="incline-dumbbell-press",
        exercise_name="Incline Dumbbell Press",
        category="push",
        key_frame_strategy="lowest_wrist",
        phase_names=["descent", "bottom", "press"],
        primary_joints=["shoulder", "elbow", "wrist"],
        thresholds={"shoulder_diff_max": 0.10, "balance_std_max": 0.03},
        correct_form="Bench at 30-45°. Dumbbells at chest level. Press straight up. Control the descent. Both arms move symmetrically.",
        common_mistakes=["Asymmetric pressing", "Over-extending at top", "Bench angle too steep (becomes shoulder press)"],
        coaching_cues=["Both arms together", "Control descent", "Full range"],
    ),
    "push-ups": ExerciseContext(
        exercise_id="push-ups",
        exercise_name="Push-Ups",
        category="push",
        key_frame_strategy="lowest_chest",
        phase_names=["descent", "bottom", "push"],
        primary_joints=["shoulder", "elbow", "trunk"],
        thresholds={"trunk_angle_max": 15, "shoulder_diff_max": 0.10, "balance_std_max": 0.04},
        correct_form="Body in straight line from head to heels. Hands shoulder-width. Elbows at ~45° from body. Lower chest to ground. Push back up maintaining plank position. No sagging or piking.",
        common_mistakes=["Hips sagging", "Elbows flaring", "Half reps (not going deep enough)", "Head dropping"],
        coaching_cues=["Body like a plank", "Chest to ground", "Tuck elbows"],
    ),
    "chest-dips": ExerciseContext(
        exercise_id="chest-dips",
        exercise_name="Chest Dips",
        category="push",
        key_frame_strategy="lowest_shoulder",
        phase_names=["descent", "bottom", "press"],
        primary_joints=["shoulder", "elbow", "trunk"],
        thresholds={"trunk_angle_max": 30, "balance_std_max": 0.04},
        correct_form="Lean slightly forward. Arms at ~90° at bottom. Shoulders should not dip below elbows excessively. Press back to top without locking out completely.",
        common_mistakes=["Going too deep (shoulder strain)", "Not leaning forward (tricep-dominant)", "Swinging/kicking"],
        coaching_cues=["Lean forward", "Control depth", "No swinging"],
    ),
    "chest-flyes": ExerciseContext(
        exercise_id="chest-flyes",
        exercise_name="Chest Flyes",
        category="push",
        key_frame_strategy="peak_arm_abduction",
        phase_names=["opening", "stretch", "closing"],
        primary_joints=["shoulder", "elbow"],
        thresholds={"shoulder_diff_max": 0.10, "balance_std_max": 0.02},
        correct_form="Slight elbow bend maintained throughout. Arms open wide to chest level. Squeeze chest to bring weights together. Control the eccentric.",
        common_mistakes=["Bending elbows too much (turns into press)", "Going too deep (shoulder strain)", "Using momentum"],
        coaching_cues=["Slight bend in elbows", "Squeeze at top", "Control the opening"],
    ),
    "arnold-press": ExerciseContext(
        exercise_id="arnold-press",
        exercise_name="Arnold Press",
        category="push",
        key_frame_strategy="highest_wrist",
        phase_names=["rotation", "bottom", "press"],
        primary_joints=["shoulder", "elbow", "wrist"],
        thresholds={"shoulder_diff_max": 0.10, "balance_std_max": 0.03},
        correct_form="Start with dumbbells in front of shoulders (palms facing you). As you press up, rotate palms to face forward. Reverse on the way down — full rotation.",
        common_mistakes=["Not rotating through full range", "Pressing too fast", "Asymmetric arms"],
        coaching_cues=["Full rotation", "Smooth press", "Control both directions"],
    ),
    "overhead-press": ExerciseContext(
        exercise_id="overhead-press",
        exercise_name="Overhead Press",
        category="push",
        key_frame_strategy="highest_wrist",
        phase_names=["descent", "bottom", "press"],
        primary_joints=["shoulder", "elbow", "wrist", "trunk"],
        thresholds={"trunk_angle_max": 15, "shoulder_diff_max": 0.08, "balance_std_max": 0.03},
        correct_form="Bar at collarbone level. Elbows slightly in front of bar. Press bar straight up, moving head back then through. Lock out overhead. Bar path is straight vertical line.",
        common_mistakes=["Excessive back arch", "Bar path curving around face", "Not locking out", "Elbows flaring"],
        coaching_cues=["Bar over midfoot", "Move head back", "Lock out overhead"],
    ),
    "tricep-dips": ExerciseContext(
        exercise_id="tricep-dips",
        exercise_name="Tricep Dips",
        category="push",
        key_frame_strategy="lowest_shoulder",
        phase_names=["descent", "bottom", "press"],
        primary_joints=["shoulder", "elbow"],
        thresholds={"balance_std_max": 0.04},
        correct_form="Body upright (not leaning forward). Arms close to body. Descend to ~90° elbow bend. Press back up without locking out. Keep shoulders down.",
        common_mistakes=["Leaning forward (becomes chest dip)", "Going too deep", "Shoulders shrugging up"],
        coaching_cues=["Stay upright", "Elbows back", "Shoulders down"],
    ),
    "tricep-pushdowns": ExerciseContext(
        exercise_id="tricep-pushdowns",
        exercise_name="Tricep Pushdowns",
        category="push",
        key_frame_strategy="lowest_hand",
        phase_names=["top", "pushdown", "bottom"],
        primary_joints=["elbow", "shoulder"],
        thresholds={"balance_std_max": 0.03},
        correct_form="Elbows pinned to sides. Push bar/handle down until arms are straight. Squeeze triceps. Controlled return. Only forearms should move.",
        common_mistakes=["Elbows moving forward/back", "Using body momentum", "Not full range", "Leaning over cable"],
        coaching_cues=["Elbows locked at sides", "Squeeze at bottom", "Only forearms move"],
    ),

    # ── PULL variations ────────────────────────────────────
    "pull-ups": ExerciseContext(
        exercise_id="pull-ups",
        exercise_name="Pull-Ups",
        category="pull",
        key_frame_strategy="highest_wrist",
        phase_names=["hang", "pull", "top", "lowering"],
        primary_joints=["shoulder", "elbow", "trunk"],
        thresholds={"shoulder_diff_max": 0.10, "trunk_angle_max": 15, "balance_std_max": 0.06},
        correct_form="Full hang at bottom. Pull chin over bar. Controlled descent. No kipping/swinging. Scapula engaged throughout.",
        common_mistakes=["Kipping / using momentum", "Not going to full dead hang", "Chin not clearing bar", "Asymmetric pulling"],
        coaching_cues=["Dead hang start", "Chin over bar", "Control descent", "No swing"],
    ),
    "lat-pulldowns": ExerciseContext(
        exercise_id="lat-pulldowns",
        exercise_name="Lat Pulldowns",
        category="pull",
        key_frame_strategy="lowest_bar",
        phase_names=["start", "pull", "bottom", "release"],
        primary_joints=["shoulder", "elbow", "trunk"],
        thresholds={"trunk_angle_max": 20, "shoulder_diff_max": 0.12, "balance_std_max": 0.03},
        correct_form="Slight lean back (~10-15°). Pull bar to upper chest. Squeeze shoulder blades. Controlled release to full extension. No swinging.",
        common_mistakes=["Swinging body backward (using momentum)", "Pulling behind neck", "Not full range at top", "Grip too wide"],
        coaching_cues=["Pull to chest", "Squeeze shoulder blades", "No momentum"],
    ),
    "bent-over-rows": ExerciseContext(
        exercise_id="bent-over-rows",
        exercise_name="Bent-Over Rows",
        category="pull",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["setup", "pull", "squeeze", "lowering"],
        primary_joints=["shoulder", "elbow", "trunk", "hip"],
        thresholds={"trunk_angle_min": 40, "trunk_angle_max": 70, "balance_std_max": 0.04},
        correct_form="Hinge at hips until torso is ~45-60°. Back flat. Pull bar to lower chest / upper abs. Squeeze shoulder blades. Lower with control. Torso angle stays constant.",
        common_mistakes=["Rounding back", "Using body english (jerking)", "Torso angle changing during pull", "Not squeezing scapula"],
        coaching_cues=["Flat back", "Pull to chest", "Squeeze at top", "Hips still"],
    ),
    "face-pulls": ExerciseContext(
        exercise_id="face-pulls",
        exercise_name="Face Pulls",
        category="pull",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "pull", "external_rotation", "release"],
        primary_joints=["shoulder", "elbow"],
        thresholds={"balance_std_max": 0.03},
        correct_form="Rope at face height. Pull toward face while externally rotating shoulders. Hands end beside ears, elbows high. Squeeze rear delts and rotator cuff.",
        common_mistakes=["Using too much weight (body english)", "Not externally rotating", "Pulling too low (becomes row)", "Elbows dropping"],
        coaching_cues=["Pull to face", "Rotate out", "Elbows high", "Light weight"],
    ),

    # ── ISOLATION variations ───────────────────────────────
    "barbell-curls": ExerciseContext(
        exercise_id="barbell-curls",
        exercise_name="Barbell Curls",
        category="isolation",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "curl", "peak", "lowering"],
        primary_joints=["elbow", "shoulder", "wrist"],
        thresholds={"balance_std_max": 0.04, "trunk_angle_max": 10},
        correct_form="Elbows pinned to sides. Curl bar to shoulders without swinging. Squeeze biceps at top. Controlled negative. Only forearms should move.",
        common_mistakes=["Swinging body (cheating)", "Elbows drifting forward", "Not full range at bottom", "Wrist curling"],
        coaching_cues=["Elbows at sides", "No swing", "Squeeze at top", "Control negative"],
    ),
    "dumbbell-curls": ExerciseContext(
        exercise_id="dumbbell-curls",
        exercise_name="Dumbbell Curls",
        category="isolation",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "curl", "peak", "lowering"],
        primary_joints=["elbow", "shoulder"],
        thresholds={"shoulder_diff_max": 0.12, "balance_std_max": 0.04},
        correct_form="Arms at sides. Curl dumbbells simultaneously or alternating. Full supination. No swinging. Control both directions.",
        common_mistakes=["Swinging", "Not supinating", "Partial reps", "One arm doing more work"],
        coaching_cues=["Full supination", "No momentum", "Both arms equal"],
    ),
    "hammer-curls": ExerciseContext(
        exercise_id="hammer-curls",
        exercise_name="Hammer Curls",
        category="isolation",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "curl", "peak", "lowering"],
        primary_joints=["elbow", "wrist"],
        thresholds={"balance_std_max": 0.04},
        correct_form="Neutral grip (thumbs up). Elbows pinned. Curl to shoulders. Squeeze. Control descent.",
        common_mistakes=["Rotating wrist during curl", "Swinging", "Partial range"],
        coaching_cues=["Thumbs up", "Elbows pinned", "Full range"],
    ),
    "lateral-raises": ExerciseContext(
        exercise_id="lateral-raises",
        exercise_name="Lateral Raises",
        category="isolation",
        key_frame_strategy="peak_shoulder_abduction",
        phase_names=["start", "raise", "hold", "lowering"],
        primary_joints=["shoulder", "elbow"],
        thresholds={"shoulder_diff_max": 0.15, "balance_std_max": 0.04},
        correct_form="Slight forward lean. Arms nearly straight (slight elbow bend). Raise to shoulder height (no higher). Control descent. Don't use momentum.",
        common_mistakes=["Using body momentum", "Raising too high (traps take over)", "Bending elbows too much", "Thumbs up (internal rotation)"],
        coaching_cues=["Slight lean forward", "To shoulder height", "Pour the pitcher", "No swing"],
    ),

    # ── CORE variations ────────────────────────────────────
    "planks": ExerciseContext(
        exercise_id="planks",
        exercise_name="Planks",
        category="core",
        key_frame_strategy="midpoint",
        phase_names=["hold"],
        primary_joints=["trunk", "hip", "shoulder"],
        thresholds={"trunk_angle_max": 10, "balance_std_max": 0.03},
        correct_form="Body in straight line from head to heels. Elbows under shoulders. Core braced. Glutes squeezed. Neutral neck. Hold position without sagging or piking.",
        common_mistakes=["Hips sagging", "Hips too high (piking)", "Looking up (neck strain)", "Holding breath"],
        coaching_cues=["Straight line", "Brace core", "Squeeze glutes", "Breathe"],
    ),
    "hanging-leg-raises": ExerciseContext(
        exercise_id="hanging-leg-raises",
        exercise_name="Hanging Leg Raises",
        category="core",
        key_frame_strategy="peak_hip_flexion",
        phase_names=["hang", "raise", "peak", "lowering"],
        primary_joints=["hip", "trunk", "shoulder"],
        thresholds={"trunk_angle_max": 15, "balance_std_max": 0.08},
        correct_form="Full hang from bar. Raise legs with control (avoid swinging). Bring knees or feet toward chest/shoulders. Controlled descent. No kipping.",
        common_mistakes=["Swinging / using momentum", "Not controlling the negative", "Bending knees excessively", "Shoulders shrugging"],
        coaching_cues=["No swing", "Control both ways", "Full hang start"],
    ),
    "russian-twists": ExerciseContext(
        exercise_id="russian-twists",
        exercise_name="Russian Twists",
        category="core",
        key_frame_strategy="midpoint",
        phase_names=["center", "twist_left", "center", "twist_right"],
        primary_joints=["trunk", "shoulder", "hip"],
        thresholds={"trunk_angle_max": 30, "balance_std_max": 0.05},
        correct_form="Seated, knees bent, feet elevated or on ground. Lean back slightly (~45°). Rotate torso side to side with control. Arms move with rotation. Core stays engaged.",
        common_mistakes=["Rounding back", "Moving arms but not torso", "Using momentum", "Holding breath"],
        coaching_cues=["Rotate from core", "Control speed", "Keep chest up"],
    ),
    "bird-dogs": ExerciseContext(
        exercise_id="bird-dogs",
        exercise_name="Bird Dogs",
        category="core",
        key_frame_strategy="peak_extension",
        phase_names=["start", "extend", "hold", "return"],
        primary_joints=["trunk", "hip", "shoulder"],
        thresholds={"trunk_angle_max": 10, "shoulder_diff_max": 0.12, "balance_std_max": 0.05},
        correct_form="All fours. Extend opposite arm and leg simultaneously. Keep hips level (don't rotate). Neck neutral. Hold briefly at full extension. Controlled return.",
        common_mistakes=["Hips rotating open", "Arching back", "Rushing the movement", "Neck craning"],
        coaching_cues=["Hips level", "Slow and controlled", "Full extension", "Neutral neck"],
    ),
}

# ============================================================
# Category defaults (used when a specific exercise isn't found)
# ============================================================

CATEGORY_DEFAULTS: dict[str, ExerciseContext] = {
    "squat": ExerciseContext(
        exercise_id="",
        exercise_name="Squat Movement",
        category="squat",
        key_frame_strategy="lowest_hip",
        phase_names=["descent", "bottom", "ascent"],
        primary_joints=["knee", "hip", "ankle", "trunk"],
        thresholds={"trunk_angle_max": 45, "balance_std_max": 0.05, "shoulder_diff_max": 0.15},
        correct_form="Controlled descent, break at hips and knees, chest up, knees track over toes, drive through heels.",
        common_mistakes=["Knees caving inward", "Heels lifting", "Rounding back", "Shallow depth"],
        coaching_cues=["Chest up", "Knees out", "Weight on heels", "Hit depth"],
    ),
    "hinge": ExerciseContext(
        exercise_id="",
        exercise_name="Hip Hinge Movement",
        category="hinge",
        key_frame_strategy="peak_hip_flexion",
        phase_names=["setup", "hinge", "lockout", "lowering"],
        primary_joints=["hip", "knee", "trunk"],
        thresholds={"trunk_angle_min": 45, "trunk_angle_max": 80, "balance_std_max": 0.04},
        correct_form="Hips back, back flat, bar close to body, drive through heels, extend hips and knees together.",
        common_mistakes=["Rounding back", "Bar drifting away", "Hips rising too fast"],
        coaching_cues=["Chest up", "Hips back", "Bar on legs"],
    ),
    "push": ExerciseContext(
        exercise_id="",
        exercise_name="Pushing Movement",
        category="push",
        key_frame_strategy="lowest_wrist",
        phase_names=["eccentric", "bottom", "concentric"],
        primary_joints=["shoulder", "elbow", "wrist"],
        thresholds={"shoulder_diff_max": 0.10, "balance_std_max": 0.03},
        correct_form="Controlled descent, stable base, symmetrical pressing, full range of motion.",
        common_mistakes=["Asymmetric pressing", "Partial range", "Elbow flare"],
        coaching_cues=["Full range", "Both sides equal", "Control descent"],
    ),
    "pull": ExerciseContext(
        exercise_id="",
        exercise_name="Pulling Movement",
        category="pull",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "pull", "squeeze", "release"],
        primary_joints=["shoulder", "elbow", "trunk"],
        thresholds={"balance_std_max": 0.05, "shoulder_diff_max": 0.12},
        correct_form="Full range at start, squeeze at peak contraction, control the eccentric, no momentum.",
        common_mistakes=["Using momentum", "Not full range", "Asymmetric pull"],
        coaching_cues=["Full stretch", "Squeeze at peak", "No swing"],
    ),
    "isolation": ExerciseContext(
        exercise_id="",
        exercise_name="Isolation Movement",
        category="isolation",
        key_frame_strategy="peak_elbow_flexion",
        phase_names=["start", "concentric", "peak", "eccentric"],
        primary_joints=["elbow", "shoulder"],
        thresholds={"balance_std_max": 0.05},
        correct_form="Isolate the target muscle, no body momentum, full range of motion, control both phases.",
        common_mistakes=["Using body momentum", "Partial reps", "Too much weight"],
        coaching_cues=["No swing", "Full range", "Mind-muscle connection"],
    ),
    "core": ExerciseContext(
        exercise_id="",
        exercise_name="Core Movement",
        category="core",
        key_frame_strategy="midpoint",
        phase_names=["hold"],
        primary_joints=["trunk", "hip", "shoulder"],
        thresholds={"trunk_angle_max": 15, "balance_std_max": 0.05},
        correct_form="Brace core, maintain alignment, breathe steadily, control the movement.",
        common_mistakes=["Sagging hips", "Holding breath", "Rushing"],
        coaching_cues=["Brace core", "Straight line", "Breathe", "Control"],
    ),
    "carry": ExerciseContext(
        exercise_id="",
        exercise_name="Carry Movement",
        category="carry",
        key_frame_strategy="midpoint",
        phase_names=["carry"],
        primary_joints=["trunk", "shoulder", "hip"],
        thresholds={"trunk_angle_max": 15, "balance_std_max": 0.04},
        correct_form="Upright posture, shoulders back, core braced, smooth walking gait.",
        common_mistakes=["Leaning to one side", "Rounded shoulders", "Short steps"],
        coaching_cues=["Stand tall", "Shoulders back", "Core tight"],
    ),
}


def get_exercise_context(exercise_id: str) -> ExerciseContext:
    """Get biomechanical context for a specific exercise.

    Falls back to category defaults if the exact exercise isn't configured.
    Falls back to a generic 'exercise' context if category is unknown.
    """
    if exercise_id in EXERCISE_CONFIGS:
        return EXERCISE_CONFIGS[exercise_id]

    # Look up by category prefix or full match
    for eid, config in EXERCISE_CONFIGS.items():
        if eid == exercise_id:
            return config

    # Return generic default
    return ExerciseContext(
        exercise_id=exercise_id,
        exercise_name=exercise_id.replace("-", " ").title(),
        category="general",
        key_frame_strategy="midpoint",
        phase_names=["start", "execution", "finish"],
        primary_joints=["shoulder", "elbow", "hip", "knee", "trunk"],
        thresholds={"balance_std_max": 0.06, "trunk_angle_max": 30, "shoulder_diff_max": 0.15},
        correct_form="Controlled movement through full range of motion with proper posture and breathing.",
        common_mistakes=["Using momentum", "Partial range of motion", "Poor posture"],
        coaching_cues=["Full range of motion", "Control the movement", "Maintain posture"],
    )
