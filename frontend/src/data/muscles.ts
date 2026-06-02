// ============================================================
// FitForge — Comprehensive Muscle Knowledge Base
// Professional anatomy data with accessible explanations
// ============================================================

export interface Muscle {
  id: string;
  name: string;
  scientificName: string;
  group: MuscleGroupId;
  region: "upper" | "lower" | "core";
  function: string;
  description: string;
  dailyUse: string; // How this muscle helps in daily life
  primaryExercises: string[]; // Exercise IDs
  synergists: string[]; // Muscle IDs that help
  antagonists: string[]; // Opposing muscles
  // SVG body map coordinates (for BodyExplorer)
  svgZone: "chest" | "shoulders" | "biceps" | "triceps" | "forearms" | "abs" | "obliques" |
          "upper-back" | "lats" | "lower-back" | "glutes" | "quads" | "hamstrings" | "calves" | "traps" | "neck";
  stretchTips: string;
}

export const muscleGroups = [
  { id: "chest", name: "Chest", nameZh: "胸部", icon: "🏋️", description: "Pectoral muscles — responsible for pushing movements" },
  { id: "back", name: "Back", nameZh: "背部", icon: "🔙", description: "Latissimus, rhomboids, trapezius — pulling and posture" },
  { id: "shoulders", name: "Shoulders", nameZh: "肩部", icon: "💪", description: "Deltoids — the most mobile joint in the body" },
  { id: "arms", name: "Arms", nameZh: "手臂", icon: "💪", description: "Biceps, triceps, forearms — pushing and pulling power" },
  { id: "core", name: "Core", nameZh: "核心", icon: "🎯", description: "Abs, obliques, lower back — your body's stabilizer" },
  { id: "legs", name: "Legs", nameZh: "腿部", icon: "🦵", description: "Quadriceps, hamstrings, calves — foundation of power" },
  { id: "glutes", name: "Glutes", nameZh: "臀部", icon: "🍑", description: "The body's largest muscle group — posture and power" },
  { id: "full-body", name: "Full Body", nameZh: "全身", icon: "🧍", description: "Compound movements that work multiple groups" },
] as const;

export type MuscleGroupId = typeof muscleGroups[number]["id"];

export const muscles: Muscle[] = [
  // ==================== CHEST ====================
  {
    id: "pectoralis-major",
    name: "Pectoralis Major",
    scientificName: "Pectoralis Major",
    group: "chest",
    region: "upper",
    function: "Shoulder flexion, adduction, and internal rotation — brings arm across body",
    description:
      "The pectoralis major is the large, fan-shaped muscle covering the upper chest. It has two heads: the clavicular head (upper chest) and sternal head (lower chest). This is your primary pushing muscle — every time you push a door open, lift a child, or throw a ball, your pecs are doing the heavy lifting.",
    dailyUse: "Pushing open heavy doors, lifting grocery bags, throwing a ball, hugging someone",
    primaryExercises: ["bench-press", "incline-bench-press", "push-ups", "chest-flyes", "cable-crossovers"],
    synergists: ["pectoralis-minor", "deltoid-anterior", "triceps-brachii"],
    antagonists: ["latissimus-dorsi", "rhomboids", "trapezius-middle"],
    svgZone: "chest",
    stretchTips: "Doorway chest stretch — place forearms on doorframe at shoulder height, gently lean forward until you feel a stretch across the chest. Hold 30 seconds.",
  },
  {
    id: "pectoralis-minor",
    name: "Pectoralis Minor",
    scientificName: "Pectoralis Minor",
    group: "chest",
    region: "upper",
    function: "Stabilizes the scapula by drawing it forward and downward",
    description:
      "A thin, triangular muscle lying beneath the pectoralis major. Though small, it's crucial for shoulder blade stability. Tight pecs minor are extremely common in desk workers and can lead to rounded shoulders and neck pain.",
    dailyUse: "Stabilizing your shoulder when reaching forward, typing at a desk",
    primaryExercises: ["push-ups", "chest-dips", "cable-crossovers"],
    synergists: ["pectoralis-major", "serratus-anterior"],
    antagonists: ["rhomboids", "trapezius-middle"],
    svgZone: "chest",
    stretchTips: "Lie on a foam roller vertically along your spine, let arms fall out to sides. Feel the gentle chest opening.",
  },

  // ==================== BACK ====================
  {
    id: "latissimus-dorsi",
    name: "Latissimus Dorsi",
    scientificName: "Latissimus Dorsi",
    group: "back",
    region: "upper",
    function: "Shoulder extension, adduction, and internal rotation — pulls arm down and back",
    description:
      'The "lats" are the widest muscles in the upper body, giving the back its V-taper shape. They attach from the spine/pelvis to the upper arm bone. Strong lats are essential for pull-ups, rows, and any movement where you pull something toward your body.',
    dailyUse: "Pulling yourself up from a seated position, opening heavy drawers, rowing a boat",
    primaryExercises: ["pull-ups", "lat-pulldowns", "bent-over-rows", "seated-cable-rows", "deadlifts"],
    synergists: ["trapezius-middle", "rhomboids", "deltoid-posterior", "biceps-brachii"],
    antagonists: ["pectoralis-major", "deltoid-anterior"],
    svgZone: "lats",
    stretchTips: "Child's pose with arms extended — kneel, sit back on heels, reach arms forward on floor. Feel the stretch along your sides.",
  },
  {
    id: "trapezius",
    name: "Trapezius",
    scientificName: "Trapezius",
    group: "back",
    region: "upper",
    function: "Elevates, retracts, and rotates the scapula — moves and stabilizes shoulder blades",
    description:
      "A large diamond-shaped muscle spanning the upper back and neck. It has three functional parts: upper (shrug shoulders), middle (pull shoulder blades together), and lower (pull shoulder blades down). The traps are key to good posture and shoulder health.",
    dailyUse: "Carrying a backpack, holding a phone between ear and shoulder, maintaining upright posture",
    primaryExercises: ["deadlifts", "barbell-shrugs", "face-pulls", "farmer-carries", "overhead-press"],
    synergists: ["levator-scapulae", "rhomboids"],
    antagonists: ["pectoralis-minor", "latissimus-dorsi"],
    svgZone: "traps",
    stretchTips: "Ear-to-shoulder neck stretch — gently tilt head to one side, use hand for light pressure. Switch sides. Never force.",
  },
  {
    id: "rhomboids",
    name: "Rhomboids",
    scientificName: "Rhomboideus Major & Minor",
    group: "back",
    region: "upper",
    function: "Retracts the scapula — pulls shoulder blades together toward spine",
    description:
      "Located between your shoulder blades, the rhomboids are the 'posture muscles.' When weak, the shoulders roll forward creating a hunched appearance. Strengthening them is one of the most impactful things you can do for your posture.",
    dailyUse: "Standing up straight, pulling shoulders back, good desk posture",
    primaryExercises: ["face-pulls", "bent-over-rows", "seated-cable-rows", "band-pull-aparts"],
    synergists: ["trapezius-middle", "trapezius-lower"],
    antagonists: ["pectoralis-major", "pectoralis-minor"],
    svgZone: "upper-back",
    stretchTips: "Cross one arm across the chest, use other arm to gently pull it closer. Hold 20 seconds per side.",
  },
  {
    id: "erector-spinae",
    name: "Erector Spinae",
    scientificName: "Erector Spinae",
    group: "back",
    region: "core",
    function: "Extends and laterally flexes the spine — keeps you upright",
    description:
      "A group of muscles running along both sides of the spine from the sacrum to the neck. These are your body's main 'anti-gravity' muscles — they keep you standing upright. A strong lower back is your best defense against back pain.",
    dailyUse: "Standing, walking upright, bending to pick things up, sitting with good posture",
    primaryExercises: ["deadlifts", "back-extensions", "good-mornings", "bird-dogs", "superman-holds"],
    synergists: ["quadratus-lumborum", "multifidus"],
    antagonists: ["rectus-abdominis"],
    svgZone: "lower-back",
    stretchTips: "Cat-cow stretch — on hands and knees, alternate arching and rounding your spine slowly. Breathe deeply.",
  },

  // ==================== SHOULDERS ====================
  {
    id: "deltoid-anterior",
    name: "Anterior Deltoid",
    scientificName: "Deltoideus (Anterior)",
    group: "shoulders",
    region: "upper",
    function: "Shoulder flexion and internal rotation — raises arm forward",
    description:
      "The front portion of the deltoid muscle. This head is heavily used in all pressing movements (bench press, overhead press). Because it's recruited in chest exercises, it often gets overdeveloped relative to the rear delts, creating imbalance.",
    dailyUse: "Reaching forward to grab something on a high shelf, lifting objects in front of you",
    primaryExercises: ["overhead-press", "front-raises", "bench-press", "push-ups"],
    synergists: ["pectoralis-major", "deltoid-lateral"],
    antagonists: ["deltoid-posterior", "latissimus-dorsi"],
    svgZone: "shoulders",
    stretchTips: "Clasp hands behind your back, straighten arms, and gently lift. Feel the stretch in front shoulders.",
  },
  {
    id: "deltoid-lateral",
    name: "Lateral Deltoid",
    scientificName: "Deltoideus (Lateral)",
    group: "shoulders",
    region: "upper",
    function: "Shoulder abduction — raises arm to the side away from body",
    description:
      "The middle portion of the deltoid. This is the muscle that gives shoulders their rounded, broad appearance. It's the primary mover in lateral raises and is often undertrained compared to the front delts.",
    dailyUse: "Carrying a suitcase or shopping bag at your side, putting on a jacket",
    primaryExercises: ["lateral-raises", "overhead-press", "upright-rows", "arnold-press"],
    synergists: ["deltoid-anterior", "supraspinatus", "trapezius-upper"],
    antagonists: ["latissimus-dorsi"],
    svgZone: "shoulders",
    stretchTips: "Bring one arm across your body at shoulder height, use other arm to pull it closer. Hold 20 seconds.",
  },
  {
    id: "deltoid-posterior",
    name: "Posterior Deltoid",
    scientificName: "Deltoideus (Posterior)",
    group: "shoulders",
    region: "upper",
    function: "Shoulder extension and external rotation — pulls arm backward",
    description:
      "The rear portion of the deltoid. This is the most neglected shoulder head. Weak rear delts contribute to poor posture and shoulder injuries. They should be trained with equal volume as the front delts.",
    dailyUse: "Pulling car door closed, reaching into the back seat, rowing movements",
    primaryExercises: ["face-pulls", "reverse-flyes", "bent-over-lateral-raises", "cable-external-rotations"],
    synergists: ["rhomboids", "trapezius-middle", "infraspinatus"],
    antagonists: ["deltoid-anterior", "pectoralis-major"],
    svgZone: "shoulders",
    stretchTips: "Cross one arm under the other at chest height, use the other arm to pull it tighter to your body.",
  },

  // ==================== ARMS ====================
  {
    id: "biceps-brachii",
    name: "Biceps Brachii",
    scientificName: "Biceps Brachii",
    group: "arms",
    region: "upper",
    function: "Elbow flexion and forearm supination — bends the elbow, turns palm up",
    description:
      'The "biceps" has two heads (long and short) that attach at different points on the shoulder blade. Its primary job is bending the elbow, but it also helps turn the palm upward (supination). The biceps work as a team with the brachialis underneath for elbow flexion.',
    dailyUse: "Lifting a water bottle to drink, carrying grocery bags with bent elbows, turning a doorknob",
    primaryExercises: ["barbell-curls", "dumbbell-curls", "chin-ups", "hammer-curls", "preacher-curls"],
    synergists: ["brachialis", "brachioradialis", "deltoid-anterior"],
    antagonists: ["triceps-brachii"],
    svgZone: "biceps",
    stretchTips: "Extend arm straight out to side at shoulder height, palm facing forward. Gently press palm against a wall. Hold 20 seconds.",
  },
  {
    id: "triceps-brachii",
    name: "Triceps Brachii",
    scientificName: "Triceps Brachii",
    group: "arms",
    region: "upper",
    function: "Elbow extension — straightens the arm",
    description:
      'The triceps has three heads (long, lateral, medial) and makes up about 60% of your upper arm mass. For bigger arms, triceps are actually more important than biceps. Every pushing movement — from opening doors to bench pressing — relies on strong triceps.',
    dailyUse: "Pushing yourself up from a chair, closing heavy doors, reaching overhead to place items on high shelves",
    primaryExercises: ["close-grip-bench-press", "tricep-dips", "overhead-tricep-extensions", "tricep-pushdowns", "skull-crushers"],
    synergists: ["deltoid-anterior", "pectoralis-major"],
    antagonists: ["biceps-brachii", "brachialis"],
    svgZone: "triceps",
    stretchTips: "Reach one arm overhead, bend elbow so hand reaches down your back. Use other hand to gently press elbow backward. Hold 20 seconds.",
  },
  {
    id: "brachialis",
    name: "Brachialis",
    scientificName: "Brachialis",
    group: "arms",
    region: "upper",
    function: "Pure elbow flexion — the strongest elbow flexor",
    description:
      "Lying beneath the biceps, the brachialis is actually the strongest elbow flexor. When developed, it pushes the biceps up, making arms look bigger and more defined. It works regardless of palm position, unlike the biceps which prefer supinated grip.",
    dailyUse: "All elbow bending movements — lifting, carrying, pulling",
    primaryExercises: ["hammer-curls", "reverse-curls", "pull-ups", "barbell-curls"],
    synergists: ["biceps-brachii", "brachioradialis"],
    antagonists: ["triceps-brachii"],
    svgZone: "biceps",
    stretchTips: "Same as biceps stretch — fully extend arm, palm up, gently press into a surface.",
  },
  {
    id: "forearm-flexors",
    name: "Forearm Flexors",
    scientificName: "Flexor Carpi Radialis & Ulnaris",
    group: "arms",
    region: "upper",
    function: "Wrist flexion and grip strength — curls wrist forward, squeezes hand",
    description:
      "The muscles on the palm-side of your forearm. They control wrist flexion and grip. Strong forearms are essential for deadlifts, pull-ups, and any exercise requiring grip. Weak grip strength is often the limiting factor in pulling exercises.",
    dailyUse: "Gripping and carrying anything — water bottles, groceries, tools, writing, typing",
    primaryExercises: ["wrist-curls", "farmer-carries", "dead-hangs", "towel-pull-ups", "plate-pinches"],
    synergists: ["forearm-extensors", "brachioradialis"],
    antagonists: ["forearm-extensors"],
    svgZone: "forearms",
    stretchTips: "Extend arm forward, palm up. Use other hand to gently pull fingers down. Then flip palm down, pull fingers toward you. Hold each 20 seconds.",
  },

  // ==================== CORE ====================
  {
    id: "rectus-abdominis",
    name: "Rectus Abdominis",
    scientificName: "Rectus Abdominis",
    group: "core",
    region: "core",
    function: "Spinal flexion — curls torso forward, compresses abdomen",
    description:
      'The "six-pack" muscle running from the sternum to the pubic bone. Visible definition requires both muscle development AND low body fat. More importantly, strong abs protect your spine during heavy lifts and daily activities. They\'re your body\'s natural weight belt.',
    dailyUse: "Sitting up from lying down, coughing, maintaining posture while seated, protecting the spine when lifting",
    primaryExercises: ["crunches", "hanging-leg-raises", "cable-crunches", "planks", "ab-wheel-rollouts"],
    synergists: ["obliques", "transverse-abdominis"],
    antagonists: ["erector-spinae"],
    svgZone: "abs",
    stretchTips: "Cobra pose — lie face down, place hands under shoulders, gently push upper body up. Keep hips on floor. Feel the stretch in abs.",
  },
  {
    id: "obliques",
    name: "Obliques",
    scientificName: "Obliquus Externus & Internus",
    group: "core",
    region: "core",
    function: "Trunk rotation and lateral flexion — twists and side-bends the torso",
    description:
      "The oblique muscles run diagonally along the sides of your abdomen — external obliques (outer layer) and internal obliques (underneath). They're your body's rotation engine, crucial for throwing, swinging, and any twisting movement.",
    dailyUse: "Twisting to look behind you while driving, reaching sideways for an object, throwing a ball, swinging a golf club",
    primaryExercises: ["russian-twists", "side-planks", "bicycle-crunches", "woodchoppers", "pallof-presses"],
    synergists: ["rectus-abdominis", "quadratus-lumborum"],
    antagonists: ["obliques-opposite"],
    svgZone: "obliques",
    stretchTips: "Standing side bend — raise one arm overhead, lean to the opposite side. Feel the stretch along the side of your torso. Hold 20 seconds per side.",
  },
  {
    id: "transverse-abdominis",
    name: "Transverse Abdominis",
    scientificName: "Transversus Abdominis",
    group: "core",
    region: "core",
    function: "Core stabilization — compresses abdomen, the body's natural corset",
    description:
      "The deepest layer of abdominal muscles, wrapping around like a corset. Unlike the six-pack (rectus abdominis), you can't see this muscle, but it's arguably more important. It's your primary spinal stabilizer and the first muscle that should activate before any movement.",
    dailyUse: "Stabilizing the spine before any movement, maintaining posture, protecting the lower back during lifting",
    primaryExercises: ["planks", "dead-bugs", "stomach-vacuum", "bird-dogs", "pallof-presses"],
    synergists: ["rectus-abdominis", "obliques", "multifidus"],
    antagonists: [],
    svgZone: "abs",
    stretchTips: "Deep breathing with expansion — lie on back, knees bent. Breathe deeply into belly, feeling it expand. On exhale, draw belly button toward spine.",
  },

  // ==================== LEGS ====================
  {
    id: "quadriceps",
    name: "Quadriceps",
    scientificName: "Quadriceps Femoris",
    group: "legs",
    region: "lower",
    function: "Knee extension — straightens the leg; one head also flexes the hip",
    description:
      'The quads are a group of four muscles on the front of the thigh: vastus lateralis, vastus medialis (the "teardrop"), vastus intermedius, and rectus femoris (crosses both hip and knee). They\'re the primary muscles for walking, running, jumping, and squatting.',
    dailyUse: "Walking up stairs, standing up from a chair, squatting to pick something up, climbing, jumping",
    primaryExercises: ["barbell-squats", "lunges", "leg-press", "bulgarian-split-squats", "step-ups"],
    synergists: ["gluteus-maximus", "hamstrings"],
    antagonists: ["hamstrings"],
    svgZone: "quads",
    stretchTips: "Standing quad stretch — bend one knee, grab ankle behind you, gently pull heel toward glute. Keep knees together. Hold 25 seconds per side.",
  },
  {
    id: "hamstrings",
    name: "Hamstrings",
    scientificName: "Biceps Femoris, Semitendinosus, Semimembranosus",
    group: "legs",
    region: "lower",
    function: "Knee flexion and hip extension — bends the knee, drives the hip forward",
    description:
      "Three muscles running down the back of the thigh. The hamstrings are crucial for running speed, jumping power, and protecting the knee joint. Tight hamstrings are one of the most common causes of lower back pain — they pull on the pelvis when tight.",
    dailyUse: "Walking, running, bending down to tie shoes, climbing stairs, any forward propulsion",
    primaryExercises: ["romanian-deadlifts", "leg-curls", "nordic-curls", "glute-bridges", "kettlebell-swings"],
    synergists: ["gluteus-maximus", "gastrocnemius"],
    antagonists: ["quadriceps"],
    svgZone: "hamstrings",
    stretchTips: "Seated forward fold — sit on floor, legs extended. Hinge from hips, reach toward toes with straight back. Never lock knees. Hold 30 seconds.",
  },
  {
    id: "gastrocnemius",
    name: "Gastrocnemius",
    scientificName: "Gastrocnemius",
    group: "legs",
    region: "lower",
    function: "Plantar flexion — points the foot downward; also assists knee flexion",
    description:
      "The larger, more visible calf muscle with two heads forming the diamond shape. It crosses both the ankle AND knee joint, making it unique. This muscle gives explosive power for jumping and sprinting.",
    dailyUse: "Standing on tiptoes, walking uphill, climbing stairs, pushing car pedals, jumping",
    primaryExercises: ["standing-calf-raises", "seated-calf-raises", "jump-rope", "box-jumps"],
    synergists: ["soleus", "hamstrings"],
    antagonists: ["tibialis-anterior"],
    svgZone: "calves",
    stretchTips: "Downward dog — start in plank, push hips up and back, press heels toward floor. Pedal feet by alternating bent knees. Hold 30 seconds.",
  },
  {
    id: "soleus",
    name: "Soleus",
    scientificName: "Soleus",
    group: "legs",
    region: "lower",
    function: "Plantar flexion with bent knee — endurance muscle for standing and walking",
    description:
      "Lying beneath the gastrocnemius, the soleus is a flat, thick muscle that only crosses the ankle joint. It's composed mostly of slow-twitch fibers, making it your primary endurance calf for standing and walking. Often called the 'second heart' because its pumping action helps return blood to the heart.",
    dailyUse: "Maintaining balance while standing, walking long distances, posture control",
    primaryExercises: ["seated-calf-raises", "walking", "standing-calf-raises-bent-knee", "jump-rope"],
    synergists: ["gastrocnemius"],
    antagonists: ["tibialis-anterior"],
    svgZone: "calves",
    stretchTips: "Seated calf stretch — sit with one leg extended, loop a towel around ball of foot. Gently pull toward you. Hold 25 seconds.",
  },

  // ==================== GLUTES ====================
  {
    id: "gluteus-maximus",
    name: "Gluteus Maximus",
    scientificName: "Gluteus Maximus",
    group: "glutes",
    region: "lower",
    function: "Hip extension and external rotation — the body's most powerful muscle",
    description:
      "The largest and strongest muscle in the human body. It extends the hip (drives you forward when walking/running), externally rotates the femur, and stabilizes the pelvis. Weak glutes are epidemic in modern society due to prolonged sitting — leading to lower back pain, knee issues, and poor posture.",
    dailyUse: "Standing up from sitting, climbing stairs, walking uphill, running, lifting heavy objects from the ground",
    primaryExercises: ["barbell-squats", "deadlifts", "hip-thrusts", "lunges", "glute-bridges", "bulgarian-split-squats"],
    synergists: ["hamstrings", "erector-spinae", "gluteus-medius"],
    antagonists: ["hip-flexors"],
    svgZone: "glutes",
    stretchTips: "Figure-4 stretch — lie on back, cross one ankle over opposite knee. Pull the uncrossed leg toward you. Feel the stretch in glute. Hold 30 seconds per side.",
  },
  {
    id: "gluteus-medius",
    name: "Gluteus Medius",
    scientificName: "Gluteus Medius",
    group: "glutes",
    region: "lower",
    function: "Hip abduction — lifts leg to the side; stabilizes pelvis during walking",
    description:
      "Located on the outer hip beneath the gluteus maximus. When you walk, this muscle keeps your pelvis level as you shift weight from one leg to the other. Weak gluteus medius causes the hip to drop on the opposite side when walking — a major contributor to knee and lower back pain.",
    dailyUse: "Walking with stable hips, stepping sideways, balancing on one leg, getting out of a car",
    primaryExercises: ["lateral-band-walks", "clamshells", "side-lying-leg-lifts", "single-leg-squats", "cable-hip-abductions"],
    synergists: ["gluteus-minimus", "tensor-fasciae-latae"],
    antagonists: ["hip-adductors"],
    svgZone: "glutes",
    stretchTips: "Seated figure-4 — sit, cross ankle over opposite knee. Gently lean forward with straight back. Hold 25 seconds per side.",
  },
];

// Helper: get muscles by group
export function getMusclesByGroup(groupId: MuscleGroupId): Muscle[] {
  return muscles.filter((m) => m.group === groupId);
}

// Helper: get muscle by ID
export function getMuscleById(id: string): Muscle | undefined {
  return muscles.find((m) => m.id === id);
}

// Helper: get muscle group info
export function getMuscleGroup(groupId: MuscleGroupId) {
  return muscleGroups.find((g) => g.id === groupId);
}
