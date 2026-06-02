// ============================================================
// FitForge — Goal Categories
// Maps user goals to muscle groups and recommended exercises
// ============================================================

import type { MuscleGroupId } from "./muscles";

export interface Goal {
  id: string;
  title: string;
  titleZh: string;
  subtitle: string;
  icon: string;
  targetGroups: MuscleGroupId[];
  description: string;
  featuredExercises: string[]; // Exercise IDs
  tip: string; // Quick expert tip
}

export const goals: Goal[] = [
  {
    id: "build-chest",
    title: "Build a Stronger Chest",
    titleZh: "练出强壮胸部",
    subtitle: "Push with power and confidence",
    icon: "🏋️",
    targetGroups: ["chest"],
    description:
      "Your chest muscles (pectoralis major & minor) are your primary pushing muscles. A strong chest improves your bench press, push-ups, and every pushing movement in daily life — from opening heavy doors to pushing a stalled car.",
    featuredExercises: ["bench-press", "push-ups", "incline-bench-press", "chest-flyes"],
    tip: "For complete chest development, train at multiple angles: flat, incline (upper chest), and decline (lower chest). The incline press is often neglected but critical for balanced development.",
  },
  {
    id: "wider-back",
    title: "Develop a Wider Back",
    titleZh: "打造宽阔背部",
    subtitle: "Build your V-taper and improve posture",
    icon: "🔙",
    targetGroups: ["back"],
    description:
      "Your back muscles — lats, rhomboids, and trapezius — create the classic V-taper physique and are essential for good posture. A strong back pulls your shoulders back, making you look taller and more confident instantly.",
    featuredExercises: ["pull-ups", "bent-over-rows", "deadlifts", "face-pulls"],
    tip: "The lat pulldown and pull-up are the 'squats of the upper body' — they build back width like nothing else. If you can't do a pull-up yet, start with negatives and lat pulldowns.",
  },
  {
    id: "powerful-legs",
    title: "Build Powerful Legs",
    titleZh: "锻造强壮双腿",
    subtitle: "The foundation of athletic power",
    icon: "🦵",
    targetGroups: ["legs", "glutes"],
    description:
      "Your legs contain the body's largest muscles — quadriceps, hamstrings, and glutes. Training legs releases the most growth hormone and testosterone of any workout. Strong legs aren't just for aesthetics — they're the foundation of all athletic movement.",
    featuredExercises: ["barbell-squats", "lunges", "romanian-deadlifts", "bulgarian-split-squats"],
    tip: "Don't skip leg day — ever. Leg training boosts your metabolism for up to 48 hours after your workout due to the sheer muscle mass involved. Plus, strong legs protect your knees and lower back.",
  },
  {
    id: "core-stability",
    title: "Build Core Stability",
    titleZh: "建立核心稳定",
    subtitle: "Protect your spine, move with control",
    icon: "🎯",
    targetGroups: ["core"],
    description:
      "Your core is more than just abs — it's the entire muscular cylinder around your spine: rectus abdominis, obliques, transverse abdominis, and erector spinae. A strong core is your body's natural weight belt, protecting your spine during every movement.",
    featuredExercises: ["planks", "hanging-leg-raises", "russian-twists", "bird-dogs"],
    tip: "Visible abs are made in the kitchen, but functional core strength is built with progressive overload — just like any other muscle. Add weight to your planks and leg raises over time.",
  },
  {
    id: "better-posture",
    title: "Fix Your Posture",
    titleZh: "改善你的姿态",
    subtitle: "Stand taller, feel better, prevent pain",
    icon: "🧍",
    targetGroups: ["back", "core", "shoulders"],
    description:
      "Poor posture — rounded shoulders, forward head, hunched back — is epidemic in the digital age. The fix isn't just 'stand up straight.' It requires strengthening the weak, lengthened muscles (upper back, rear delts, deep neck flexors) and stretching the tight, shortened ones (chest, front delts).",
    featuredExercises: ["face-pulls", "bird-dogs", "planks", "romanian-deadlifts"],
    tip: "For every hour you spend sitting hunched forward, do one set of face pulls or band pull-aparts. This 1:1 ratio is your best defense against 'desk posture.' Your shoulders will thank you.",
  },
  {
    id: "full-body",
    title: "Total Body Transformation",
    titleZh: "全身蜕变",
    subtitle: "Compound movements for complete development",
    icon: "🧍",
    targetGroups: ["full-body"],
    description:
      "For overall fitness, nothing beats compound exercises that work multiple muscle groups simultaneously. These movements build functional strength, burn more calories, and are the most efficient use of your training time.",
    featuredExercises: ["barbell-squats", "deadlifts", "bench-press", "pull-ups", "overhead-press"],
    tip: "The 'Big 5' compound lifts — squat, deadlift, bench press, overhead press, and pull-up/row — should form the foundation of any training program. Master these before worrying about isolation exercises.",
  },
];

export function getGoalById(id: string): Goal | undefined {
  return goals.find((g) => g.id === id);
}
