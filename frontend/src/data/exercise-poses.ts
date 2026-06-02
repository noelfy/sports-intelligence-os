// ============================================================
// FitForge — Exercise Pose Data
// Joint coordinate system for SVG body animation
// viewBox: 0 0 200 400
// ============================================================

export interface JointPositions {
  head: [number, number];
  neck: [number, number];
  lShoulder: [number, number];
  rShoulder: [number, number];
  lElbow: [number, number];
  rElbow: [number, number];
  lWrist: [number, number];
  rWrist: [number, number];
  lHip: [number, number];
  rHip: [number, number];
  lKnee: [number, number];
  rKnee: [number, number];
  lAnkle: [number, number];
  rAnkle: [number, number];
  // Optional equipment
  bar?: [[number, number], [number, number]]; // barbell line
  dbL?: [number, number]; // dumbbell left
  dbR?: [number, number]; // dumbbell right
}

export interface ExercisePose {
  id: string; // "start" | "mid" | "end"
  label: string;
  labelZh: string;
  joints: JointPositions;
}

export interface ExercisePoseData {
  exerciseId: string;
  poses: ExercisePose[];
  loopDuration: number; // ms for full cycle
  viewBox: string;
}

// Helper to create symmetric standing pose
function standingPose(): JointPositions {
  return {
    head: [100, 28],
    neck: [100, 52],
    lShoulder: [82, 58],
    rShoulder: [118, 58],
    lElbow: [68, 95],
    rElbow: [132, 95],
    lWrist: [62, 132],
    rWrist: [138, 132],
    lHip: [88, 140],
    rHip: [112, 140],
    lKnee: [84, 208],
    rKnee: [116, 208],
    lAnkle: [82, 278],
    rAnkle: [118, 278],
  };
}

// ==================== EXERCISE POSE DATA ====================

export const exercisePoses: ExercisePoseData[] = [
  // ===== BARBELL SQUAT =====
  {
    exerciseId: "barbell-squats",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Start",
        labelZh: "起始",
        joints: {
          head: [100, 22],
          neck: [100, 44],
          lShoulder: [88, 48],
          rShoulder: [112, 48],
          lElbow: [58, 38],
          rElbow: [142, 38],
          lWrist: [78, 54],
          rWrist: [122, 54],
          lHip: [88, 128],
          rHip: [112, 128],
          lKnee: [84, 198],
          rKnee: [116, 198],
          lAnkle: [82, 268],
          rAnkle: [118, 268],
          bar: [[76, 50], [124, 50]],
        },
      },
      {
        id: "mid",
        label: "Descent",
        labelZh: "下蹲",
        joints: {
          head: [100, 80],
          neck: [100, 102],
          lShoulder: [88, 106],
          rShoulder: [112, 106],
          lElbow: [56, 88],
          rElbow: [144, 88],
          lWrist: [78, 112],
          rWrist: [122, 112],
          lHip: [80, 168],
          rHip: [120, 168],
          lKnee: [72, 226],
          rKnee: [128, 226],
          lAnkle: [82, 268],
          rAnkle: [118, 268],
          bar: [[76, 108], [124, 108]],
        },
      },
      {
        id: "end",
        label: "Bottom",
        labelZh: "底部",
        joints: {
          head: [100, 108],
          neck: [100, 130],
          lShoulder: [88, 134],
          rShoulder: [112, 134],
          lElbow: [54, 110],
          rElbow: [146, 110],
          lWrist: [78, 140],
          rWrist: [122, 140],
          lHip: [72, 196],
          rHip: [128, 196],
          lKnee: [64, 254],
          rKnee: [136, 254],
          lAnkle: [82, 268],
          rAnkle: [118, 268],
          bar: [[76, 136], [124, 136]],
        },
      },
    ],
  },

  // ===== DEADLIFT =====
  {
    exerciseId: "deadlifts",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Setup",
        labelZh: "准备",
        joints: {
          head: [100, 70],
          neck: [100, 90],
          lShoulder: [84, 98],
          rShoulder: [116, 98],
          lElbow: [68, 130],
          rElbow: [132, 130],
          lWrist: [76, 160],
          rWrist: [124, 160],
          lHip: [76, 164],
          rHip: [124, 164],
          lKnee: [70, 224],
          rKnee: [130, 224],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[72, 172], [128, 172]],
        },
      },
      {
        id: "mid",
        label: "Pull",
        labelZh: "拉起",
        joints: {
          head: [100, 46],
          neck: [100, 66],
          lShoulder: [86, 70],
          rShoulder: [114, 70],
          lElbow: [66, 106],
          rElbow: [134, 106],
          lWrist: [60, 142],
          rWrist: [140, 142],
          lHip: [82, 148],
          rHip: [118, 148],
          lKnee: [78, 208],
          rKnee: [122, 208],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[58, 150], [142, 150]],
        },
      },
      {
        id: "end",
        label: "Lockout",
        labelZh: "锁定",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [88, 44],
          rShoulder: [112, 44],
          lElbow: [66, 96],
          rElbow: [134, 96],
          lWrist: [62, 142],
          rWrist: [138, 142],
          lHip: [88, 134],
          rHip: [112, 134],
          lKnee: [84, 202],
          rKnee: [116, 202],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[60, 144], [140, 144]],
        },
      },
    ],
  },

  // ===== BENCH PRESS =====
  {
    exerciseId: "bench-press",
    loopDuration: 4000,
    viewBox: "30 0 140 300",
    poses: [
      {
        id: "start",
        label: "Lockout",
        labelZh: "锁定",
        joints: {
          head: [100, 40],
          neck: [100, 58],
          lShoulder: [74, 64],
          rShoulder: [126, 64],
          lElbow: [58, 40],
          rElbow: [142, 40],
          lWrist: [66, 20],
          rWrist: [134, 20],
          lHip: [84, 140],
          rHip: [116, 140],
          lKnee: [60, 200],
          rKnee: [140, 200],
          lAnkle: [54, 222],
          rAnkle: [146, 222],
          bar: [[56, 18], [144, 18]],
        },
      },
      {
        id: "mid",
        label: "Lowering",
        labelZh: "下降",
        joints: {
          head: [100, 40],
          neck: [100, 58],
          lShoulder: [74, 64],
          rShoulder: [126, 64],
          lElbow: [54, 80],
          rElbow: [146, 80],
          lWrist: [62, 50],
          rWrist: [138, 50],
          lHip: [84, 140],
          rHip: [116, 140],
          lKnee: [60, 200],
          rKnee: [140, 200],
          lAnkle: [54, 222],
          rAnkle: [146, 222],
          bar: [[56, 48], [144, 48]],
        },
      },
      {
        id: "end",
        label: "Bottom",
        labelZh: "底部",
        joints: {
          head: [100, 40],
          neck: [100, 58],
          lShoulder: [74, 64],
          rShoulder: [126, 64],
          lElbow: [46, 100],
          rElbow: [154, 100],
          lWrist: [64, 64],
          rWrist: [136, 64],
          lHip: [84, 140],
          rHip: [116, 140],
          lKnee: [60, 200],
          rKnee: [140, 200],
          lAnkle: [54, 222],
          rAnkle: [146, 222],
          bar: [[56, 62], [144, 62]],
        },
      },
    ],
  },

  // ===== PULL-UPS =====
  {
    exerciseId: "pull-ups",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Dead Hang",
        labelZh: "悬垂",
        joints: {
          head: [100, 55],
          neck: [100, 72],
          lShoulder: [82, 80],
          rShoulder: [118, 80],
          lElbow: [74, 118],
          rElbow: [126, 118],
          lWrist: [70, 30],
          rWrist: [130, 30],
          lHip: [90, 154],
          rHip: [110, 154],
          lKnee: [88, 216],
          rKnee: [112, 216],
          lAnkle: [86, 278],
          rAnkle: [114, 278],
          bar: [[60, 28], [140, 28]],
        },
      },
      {
        id: "mid",
        label: "Pull",
        labelZh: "上拉",
        joints: {
          head: [100, 30],
          neck: [100, 48],
          lShoulder: [78, 56],
          rShoulder: [122, 56],
          lElbow: [56, 86],
          rElbow: [144, 86],
          lWrist: [70, 30],
          rWrist: [130, 30],
          lHip: [88, 128],
          rHip: [112, 128],
          lKnee: [86, 180],
          rKnee: [114, 180],
          lAnkle: [84, 232],
          rAnkle: [116, 232],
          bar: [[60, 28], [140, 28]],
        },
      },
      {
        id: "end",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 28],
          neck: [100, 44],
          lShoulder: [76, 52],
          rShoulder: [124, 52],
          lElbow: [44, 70],
          rElbow: [156, 70],
          lWrist: [70, 30],
          rWrist: [130, 30],
          lHip: [88, 120],
          rHip: [112, 120],
          lKnee: [86, 166],
          rKnee: [114, 166],
          lAnkle: [84, 212],
          rAnkle: [116, 212],
          bar: [[60, 28], [140, 28]],
        },
      },
    ],
  },

  // ===== OVERHEAD PRESS =====
  {
    exerciseId: "overhead-press",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Start",
        labelZh: "起始",
        joints: {
          head: [100, 18],
          neck: [100, 42],
          lShoulder: [84, 48],
          rShoulder: [116, 48],
          lElbow: [72, 58],
          rElbow: [128, 58],
          lWrist: [80, 44],
          rWrist: [120, 44],
          lHip: [88, 134],
          rHip: [112, 134],
          lKnee: [84, 210],
          rKnee: [116, 210],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[76, 42], [124, 42]],
        },
      },
      {
        id: "mid",
        label: "Press",
        labelZh: "上推",
        joints: {
          head: [100, 18],
          neck: [100, 42],
          lShoulder: [84, 48],
          rShoulder: [116, 48],
          lElbow: [60, 22],
          rElbow: [140, 22],
          lWrist: [68, 4],
          rWrist: [132, 4],
          lHip: [88, 134],
          rHip: [112, 134],
          lKnee: [84, 210],
          rKnee: [116, 210],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[64, 2], [136, 2]],
        },
      },
      {
        id: "end",
        label: "Lockout",
        labelZh: "锁定",
        joints: {
          head: [100, 18],
          neck: [100, 42],
          lShoulder: [84, 48],
          rShoulder: [116, 48],
          lElbow: [62, 8],
          rElbow: [138, 8],
          lWrist: [70, -4],
          rWrist: [130, -4],
          lHip: [88, 134],
          rHip: [112, 134],
          lKnee: [84, 210],
          rKnee: [116, 210],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[66, -6], [134, -6]],
        },
      },
    ],
  },

  // ===== PUSH-UPS =====
  {
    exerciseId: "push-ups",
    loopDuration: 3500,
    viewBox: "30 0 140 280",
    poses: [
      {
        id: "start",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 48],
          neck: [100, 68],
          lShoulder: [74, 78],
          rShoulder: [126, 78],
          lElbow: [58, 78],
          rElbow: [142, 78],
          lWrist: [48, 110],
          rWrist: [152, 110],
          lHip: [88, 178],
          rHip: [112, 178],
          lKnee: [74, 208],
          rKnee: [126, 208],
          lAnkle: [56, 224],
          rAnkle: [144, 224],
        },
      },
      {
        id: "mid",
        label: "Lowering",
        labelZh: "下降",
        joints: {
          head: [100, 58],
          neck: [100, 78],
          lShoulder: [74, 88],
          rShoulder: [126, 88],
          lElbow: [48, 102],
          rElbow: [152, 102],
          lWrist: [48, 110],
          rWrist: [152, 110],
          lHip: [88, 178],
          rHip: [112, 178],
          lKnee: [74, 208],
          rKnee: [126, 208],
          lAnkle: [56, 224],
          rAnkle: [144, 224],
        },
      },
      {
        id: "end",
        label: "Bottom",
        labelZh: "底部",
        joints: {
          head: [100, 68],
          neck: [100, 88],
          lShoulder: [74, 98],
          rShoulder: [126, 98],
          lElbow: [40, 120],
          rElbow: [160, 120],
          lWrist: [48, 110],
          rWrist: [152, 110],
          lHip: [88, 178],
          rHip: [112, 178],
          lKnee: [74, 208],
          rKnee: [126, 208],
          lAnkle: [56, 224],
          rAnkle: [144, 224],
        },
      },
    ],
  },

  // ===== LUNGES =====
  {
    exerciseId: "lunges",
    loopDuration: 4500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Standing",
        labelZh: "站立",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [85, 46],
          rShoulder: [115, 46],
          lElbow: [70, 80],
          rElbow: [130, 80],
          lWrist: [64, 114],
          rWrist: [136, 114],
          lHip: [88, 130],
          rHip: [112, 130],
          lKnee: [84, 200],
          rKnee: [116, 200],
          lAnkle: [80, 270],
          rAnkle: [120, 270],
        },
      },
      {
        id: "mid",
        label: "Step Forward",
        labelZh: "前跨",
        joints: {
          head: [100, 36],
          neck: [100, 56],
          lShoulder: [85, 62],
          rShoulder: [115, 62],
          lElbow: [70, 100],
          rElbow: [130, 100],
          lWrist: [64, 138],
          rWrist: [136, 138],
          lHip: [76, 154],
          rHip: [116, 148],
          lKnee: [72, 218],
          rKnee: [120, 208],
          lAnkle: [82, 268],
          rAnkle: [100, 270],
        },
      },
      {
        id: "end",
        label: "Lunge Bottom",
        labelZh: "弓步底",
        joints: {
          head: [100, 48],
          neck: [100, 68],
          lShoulder: [85, 74],
          rShoulder: [115, 74],
          lElbow: [70, 114],
          rElbow: [130, 114],
          lWrist: [64, 152],
          rWrist: [136, 152],
          lHip: [68, 170],
          rHip: [118, 156],
          lKnee: [62, 238],
          rKnee: [124, 218],
          lAnkle: [82, 268],
          rAnkle: [90, 274],
        },
      },
    ],
  },

  // ===== PLANK =====
  {
    exerciseId: "planks",
    loopDuration: 3000,
    viewBox: "30 20 140 240",
    poses: [
      {
        id: "start",
        label: "Plank",
        labelZh: "平板",
        joints: {
          head: [100, 48],
          neck: [100, 66],
          lShoulder: [76, 76],
          rShoulder: [124, 76],
          lElbow: [64, 100],
          rElbow: [136, 100],
          lWrist: [56, 100],
          rWrist: [144, 100],
          lHip: [88, 166],
          rHip: [112, 166],
          lKnee: [76, 204],
          rKnee: [124, 204],
          lAnkle: [62, 224],
          rAnkle: [138, 224],
        },
      },
      {
        id: "mid",
        label: "Hold",
        labelZh: "保持",
        joints: {
          head: [100, 48],
          neck: [100, 66],
          lShoulder: [76, 76],
          rShoulder: [124, 76],
          lElbow: [64, 100],
          rElbow: [136, 100],
          lWrist: [56, 100],
          rWrist: [144, 100],
          lHip: [88, 168],
          rHip: [112, 168],
          lKnee: [76, 204],
          rKnee: [124, 204],
          lAnkle: [62, 224],
          rAnkle: [138, 224],
        },
      },
      {
        id: "end",
        label: "Hold",
        labelZh: "保持",
        joints: {
          head: [100, 48],
          neck: [100, 66],
          lShoulder: [76, 76],
          rShoulder: [124, 76],
          lElbow: [64, 100],
          rElbow: [136, 100],
          lWrist: [56, 100],
          rWrist: [144, 100],
          lHip: [88, 166],
          rHip: [112, 166],
          lKnee: [76, 204],
          rKnee: [124, 204],
          lAnkle: [62, 224],
          rAnkle: [138, 224],
        },
      },
    ],
  },

  // ===== PULL-UPS (already above) =====
  // ===== BICEP CURL =====
  {
    exerciseId: "barbell-curls",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Start",
        labelZh: "起始",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [70, 96],
          rElbow: [130, 96],
          lWrist: [74, 138],
          rWrist: [126, 138],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[70, 140], [130, 140]],
        },
      },
      {
        id: "mid",
        label: "Curl",
        labelZh: "弯举",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [70, 96],
          rElbow: [130, 96],
          lWrist: [78, 66],
          rWrist: [122, 66],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[74, 64], [126, 64]],
        },
      },
      {
        id: "end",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [70, 96],
          rElbow: [130, 96],
          lWrist: [80, 52],
          rWrist: [120, 52],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[76, 50], [124, 50]],
        },
      },
    ],
  },

  // ===== LATERAL RAISES =====
  {
    exerciseId: "lateral-raises",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Start",
        labelZh: "起始",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [66, 98],
          rElbow: [134, 98],
          lWrist: [58, 134],
          rWrist: [142, 134],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [64, 132],
          dbR: [136, 132],
        },
      },
      {
        id: "mid",
        label: "Raise",
        labelZh: "侧举",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [50, 54],
          rElbow: [150, 54],
          lWrist: [40, 60],
          rWrist: [160, 60],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [36, 58],
          dbR: [164, 58],
        },
      },
      {
        id: "end",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [44, 48],
          rElbow: [156, 48],
          lWrist: [36, 50],
          rWrist: [164, 50],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [32, 48],
          dbR: [168, 48],
        },
      },
    ],
  },

  // ===== DUMBBELL CURL =====
  {
    exerciseId: "dumbbell-curls",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Start",
        labelZh: "起始",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [68, 98],
          rElbow: [132, 98],
          lWrist: [56, 138],
          rWrist: [144, 138],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [58, 140],
          dbR: [142, 140],
        },
      },
      {
        id: "mid",
        label: "Curl",
        labelZh: "弯举",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [68, 98],
          rElbow: [132, 98],
          lWrist: [62, 64],
          rWrist: [138, 64],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [60, 62],
          dbR: [140, 62],
        },
      },
      {
        id: "end",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [84, 46],
          rShoulder: [116, 46],
          lElbow: [68, 98],
          rElbow: [132, 98],
          lWrist: [66, 52],
          rWrist: [134, 52],
          lHip: [90, 136],
          rHip: [110, 136],
          lKnee: [86, 212],
          rKnee: [114, 212],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          dbL: [64, 50],
          dbR: [136, 50],
        },
      },
    ],
  },

  // ===== ROMANIAN DEADLIFT =====
  {
    exerciseId: "romanian-deadlifts",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start",
        label: "Standing",
        labelZh: "站立",
        joints: {
          head: [100, 18],
          neck: [100, 40],
          lShoulder: [86, 46],
          rShoulder: [114, 46],
          lElbow: [64, 100],
          rElbow: [136, 100],
          lWrist: [62, 140],
          rWrist: [138, 140],
          lHip: [88, 136],
          rHip: [112, 136],
          lKnee: [84, 214],
          rKnee: [116, 214],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[60, 142], [140, 142]],
        },
      },
      {
        id: "mid",
        label: "Hinge",
        labelZh: "屈髋",
        joints: {
          head: [100, 56],
          neck: [100, 76],
          lShoulder: [84, 82],
          rShoulder: [116, 82],
          lElbow: [60, 130],
          rElbow: [140, 130],
          lWrist: [64, 172],
          rWrist: [136, 172],
          lHip: [86, 158],
          rHip: [114, 158],
          lKnee: [84, 232],
          rKnee: [116, 232],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[62, 176], [138, 176]],
        },
      },
      {
        id: "end",
        label: "Stretch",
        labelZh: "拉伸",
        joints: {
          head: [100, 78],
          neck: [100, 98],
          lShoulder: [84, 104],
          rShoulder: [116, 104],
          lElbow: [58, 146],
          rElbow: [142, 146],
          lWrist: [68, 190],
          rWrist: [132, 190],
          lHip: [86, 172],
          rHip: [114, 172],
          lKnee: [84, 240],
          rKnee: [116, 240],
          lAnkle: [82, 278],
          rAnkle: [118, 278],
          bar: [[66, 194], [134, 194]],
        },
      },
    ],
  },

  // ===== HIP THRUSTS =====
  {
    exerciseId: "hip-thrusts",
    loopDuration: 4000,
    viewBox: "30 40 140 280",
    poses: [
      {
        id: "start",
        label: "Bottom",
        labelZh: "底部",
        joints: {
          head: [100, 60],
          neck: [100, 76],
          lShoulder: [76, 82],
          rShoulder: [124, 82],
          lElbow: [64, 110],
          rElbow: [136, 110],
          lWrist: [58, 136],
          rWrist: [142, 136],
          lHip: [86, 178],
          rHip: [114, 178],
          lKnee: [72, 244],
          rKnee: [128, 244],
          lAnkle: [66, 280],
          rAnkle: [134, 280],
          bar: [[72, 180], [128, 180]],
        },
      },
      {
        id: "mid",
        label: "Thrust",
        labelZh: "上推",
        joints: {
          head: [100, 56],
          neck: [100, 72],
          lShoulder: [76, 78],
          rShoulder: [124, 78],
          lElbow: [64, 106],
          rElbow: [136, 106],
          lWrist: [58, 132],
          rWrist: [142, 132],
          lHip: [86, 148],
          rHip: [114, 148],
          lKnee: [72, 216],
          rKnee: [128, 216],
          lAnkle: [66, 280],
          rAnkle: [134, 280],
          bar: [[72, 150], [128, 150]],
        },
      },
      {
        id: "end",
        label: "Top",
        labelZh: "顶点",
        joints: {
          head: [100, 52],
          neck: [100, 68],
          lShoulder: [76, 74],
          rShoulder: [124, 74],
          lElbow: [64, 102],
          rElbow: [136, 102],
          lWrist: [58, 128],
          rWrist: [142, 128],
          lHip: [86, 128],
          rHip: [114, 128],
          lKnee: [72, 196],
          rKnee: [128, 196],
          lAnkle: [66, 280],
          rAnkle: [134, 280],
          bar: [[72, 130], [128, 130]],
        },
      },
    ],
  },

  // ===== INCLINE BENCH PRESS =====
  {
    exerciseId: "incline-bench-press",
    loopDuration: 4000,
    viewBox: "30 0 140 300",
    poses: [
      {
        id: "start",
        label: "Lockout",
        labelZh: "锁定",
        joints: {
          head: [100, 20],
          neck: [100, 40],
          lShoulder: [72, 46],
          rShoulder: [128, 46],
          lElbow: [54, 20],
          rElbow: [146, 20],
          lWrist: [64, 2],
          rWrist: [136, 2],
          lHip: [84, 132],
          rHip: [116, 132],
          lKnee: [58, 196],
          rKnee: [142, 196],
          lAnkle: [54, 218],
          rAnkle: [146, 218],
          bar: [[54, 0], [146, 0]],
        },
      },
      {
        id: "mid",
        label: "Lowering",
        labelZh: "下降",
        joints: {
          head: [100, 20],
          neck: [100, 40],
          lShoulder: [72, 46],
          rShoulder: [128, 46],
          lElbow: [46, 64],
          rElbow: [154, 64],
          lWrist: [60, 30],
          rWrist: [140, 30],
          lHip: [84, 132],
          rHip: [116, 132],
          lKnee: [58, 196],
          rKnee: [142, 196],
          lAnkle: [54, 218],
          rAnkle: [146, 218],
          bar: [[56, 28], [144, 28]],
        },
      },
      {
        id: "end",
        label: "Bottom",
        labelZh: "底部",
        joints: {
          head: [100, 20],
          neck: [100, 40],
          lShoulder: [72, 46],
          rShoulder: [128, 46],
          lElbow: [40, 88],
          rElbow: [160, 88],
          lWrist: [62, 48],
          rWrist: [138, 48],
          lHip: [84, 132],
          rHip: [116, 132],
          lKnee: [58, 196],
          rKnee: [142, 196],
          lAnkle: [54, 218],
          rAnkle: [146, 218],
          bar: [[56, 46], [144, 46]],
        },
      },
    ],
  },

  // ===== CHEST DIPS =====
  {
    exerciseId: "chest-dips",
    loopDuration: 3500,
    viewBox: "30 -20 140 300",
    poses: [
      {
        id: "start", label: "Top", labelZh: "顶点",
        joints: {
          head: [100, 18], neck: [100, 38], lShoulder: [80, 44], rShoulder: [120, 44],
          lElbow: [72, 44], rElbow: [128, 44], lWrist: [66, 44], rWrist: [134, 44],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 180], rKnee: [116, 180],
          lAnkle: [80, 240], rAnkle: [120, 240],
        },
      },
      {
        id: "mid", label: "Lowering", labelZh: "下降",
        joints: {
          head: [100, 30], neck: [100, 50], lShoulder: [80, 56], rShoulder: [120, 56],
          lElbow: [60, 74], rElbow: [140, 74], lWrist: [66, 44], rWrist: [134, 44],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 180], rKnee: [116, 180],
          lAnkle: [80, 240], rAnkle: [120, 240],
        },
      },
      {
        id: "end", label: "Bottom", labelZh: "底部",
        joints: {
          head: [100, 44], neck: [100, 64], lShoulder: [80, 70], rShoulder: [120, 70],
          lElbow: [48, 96], rElbow: [152, 96], lWrist: [66, 44], rWrist: [134, 44],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 180], rKnee: [116, 180],
          lAnkle: [80, 240], rAnkle: [120, 240],
        },
      },
    ],
  },

  // ===== CHEST FLYES =====
  {
    exerciseId: "chest-flyes",
    loopDuration: 3500,
    viewBox: "30 0 140 300",
    poses: [
      {
        id: "start", label: "Top", labelZh: "顶点",
        joints: {
          head: [100, 40], neck: [100, 58], lShoulder: [74, 64], rShoulder: [126, 64],
          lElbow: [62, 24], rElbow: [138, 24], lWrist: [68, 14], rWrist: [132, 14],
          lHip: [84, 140], rHip: [116, 140], lKnee: [60, 200], rKnee: [140, 200],
          lAnkle: [54, 222], rAnkle: [146, 222],
          dbL: [68, 12], dbR: [132, 12],
        },
      },
      {
        id: "mid", label: "Opening", labelZh: "展开",
        joints: {
          head: [100, 40], neck: [100, 58], lShoulder: [74, 64], rShoulder: [126, 64],
          lElbow: [44, 72], rElbow: [156, 72], lWrist: [40, 78], rWrist: [160, 78],
          lHip: [84, 140], rHip: [116, 140], lKnee: [60, 200], rKnee: [140, 200],
          lAnkle: [54, 222], rAnkle: [146, 222],
          dbL: [36, 76], dbR: [164, 76],
        },
      },
      {
        id: "end", label: "Stretch", labelZh: "拉伸",
        joints: {
          head: [100, 40], neck: [100, 58], lShoulder: [74, 64], rShoulder: [126, 64],
          lElbow: [40, 82], rElbow: [160, 82], lWrist: [34, 86], rWrist: [166, 86],
          lHip: [84, 140], rHip: [116, 140], lKnee: [60, 200], rKnee: [140, 200],
          lAnkle: [54, 222], rAnkle: [146, 222],
          dbL: [30, 84], dbR: [170, 84],
        },
      },
    ],
  },

  // ===== BENT-OVER ROWS =====
  {
    exerciseId: "bent-over-rows",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Setup", labelZh: "起始",
        joints: {
          head: [100, 60], neck: [100, 78], lShoulder: [84, 84], rShoulder: [116, 84],
          lElbow: [64, 124], rElbow: [136, 124], lWrist: [72, 162], rWrist: [128, 162],
          lHip: [80, 156], rHip: [120, 156], lKnee: [78, 216], rKnee: [122, 216],
          lAnkle: [82, 278], rAnkle: [118, 278],
          bar: [[68, 168], [132, 168]],
        },
      },
      {
        id: "mid", label: "Pull", labelZh: "拉起",
        joints: {
          head: [100, 58], neck: [100, 76], lShoulder: [84, 82], rShoulder: [116, 82],
          lElbow: [48, 110], rElbow: [152, 110], lWrist: [70, 94], rWrist: [130, 94],
          lHip: [80, 156], rHip: [120, 156], lKnee: [78, 216], rKnee: [122, 216],
          lAnkle: [82, 278], rAnkle: [118, 278],
          bar: [[66, 92], [134, 92]],
        },
      },
      {
        id: "end", label: "Squeeze", labelZh: "收缩",
        joints: {
          head: [100, 56], neck: [100, 74], lShoulder: [84, 80], rShoulder: [116, 80],
          lElbow: [42, 104], rElbow: [158, 104], lWrist: [72, 82], rWrist: [128, 82],
          lHip: [80, 156], rHip: [120, 156], lKnee: [78, 216], rKnee: [122, 216],
          lAnkle: [82, 278], rAnkle: [118, 278],
          bar: [[68, 80], [132, 80]],
        },
      },
    ],
  },

  // ===== FACE PULLS =====
  {
    exerciseId: "face-pulls",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Start", labelZh: "起始",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [46, 54], rElbow: [154, 54], lWrist: [42, 48], rWrist: [158, 48],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
      {
        id: "mid", label: "Pull", labelZh: "后拉",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [56, 26], rElbow: [144, 26], lWrist: [62, 38], rWrist: [138, 38],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
      {
        id: "end", label: "Squeeze", labelZh: "收缩",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [64, 30], rElbow: [136, 30], lWrist: [68, 42], rWrist: [132, 42],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
    ],
  },

  // ===== ARNOLD PRESS =====
  {
    exerciseId: "arnold-press",
    loopDuration: 4000,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Start", labelZh: "起始",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [82, 46], rShoulder: [118, 46],
          lElbow: [74, 60], rElbow: [126, 60], lWrist: [82, 44], rWrist: [118, 44],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [82, 40], dbR: [118, 40],
        },
      },
      {
        id: "mid", label: "Press", labelZh: "上推",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [82, 46], rShoulder: [118, 46],
          lElbow: [56, 24], rElbow: [144, 24], lWrist: [68, 10], rWrist: [132, 10],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [66, 6], dbR: [134, 6],
        },
      },
      {
        id: "end", label: "Lockout", labelZh: "锁定",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [82, 46], rShoulder: [118, 46],
          lElbow: [58, 6], rElbow: [142, 6], lWrist: [68, -2], rWrist: [132, -2],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [66, -8], dbR: [134, -8],
        },
      },
    ],
  },

  // ===== HAMMER CURLS =====
  {
    exerciseId: "hammer-curls",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Start", labelZh: "起始",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [68, 98], rElbow: [132, 98], lWrist: [56, 136], rWrist: [144, 136],
          lHip: [90, 130], rHip: [110, 130], lKnee: [86, 208], rKnee: [114, 208],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [58, 138], dbR: [142, 138],
        },
      },
      {
        id: "mid", label: "Curl", labelZh: "弯举",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [68, 98], rElbow: [132, 98], lWrist: [62, 64], rWrist: [138, 64],
          lHip: [90, 130], rHip: [110, 130], lKnee: [86, 208], rKnee: [114, 208],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [60, 60], dbR: [140, 60],
        },
      },
      {
        id: "end", label: "Top", labelZh: "顶点",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [68, 98], rElbow: [132, 98], lWrist: [66, 52], rWrist: [134, 52],
          lHip: [90, 130], rHip: [110, 130], lKnee: [86, 208], rKnee: [114, 208],
          lAnkle: [82, 278], rAnkle: [118, 278],
          dbL: [64, 48], dbR: [136, 48],
        },
      },
    ],
  },

  // ===== TRICEP DIPS =====
  {
    exerciseId: "tricep-dips",
    loopDuration: 3500,
    viewBox: "30 -20 140 300",
    poses: [
      {
        id: "start", label: "Top", labelZh: "顶点",
        joints: {
          head: [100, 20], neck: [100, 40], lShoulder: [78, 46], rShoulder: [122, 46],
          lElbow: [76, 42], rElbow: [124, 42], lWrist: [70, 40], rWrist: [130, 40],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 174], rKnee: [116, 174],
          lAnkle: [80, 228], rAnkle: [120, 228],
        },
      },
      {
        id: "mid", label: "Lowering", labelZh: "下降",
        joints: {
          head: [100, 32], neck: [100, 52], lShoulder: [78, 58], rShoulder: [122, 58],
          lElbow: [60, 72], rElbow: [140, 72], lWrist: [70, 40], rWrist: [130, 40],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 174], rKnee: [116, 174],
          lAnkle: [80, 228], rAnkle: [120, 228],
        },
      },
      {
        id: "end", label: "Bottom", labelZh: "底部",
        joints: {
          head: [100, 46], neck: [100, 66], lShoulder: [78, 72], rShoulder: [122, 72],
          lElbow: [46, 90], rElbow: [154, 90], lWrist: [70, 40], rWrist: [130, 40],
          lHip: [88, 120], rHip: [112, 120], lKnee: [84, 174], rKnee: [116, 174],
          lAnkle: [80, 228], rAnkle: [120, 228],
        },
      },
    ],
  },

  // ===== TRICEP PUSHDOWNS =====
  {
    exerciseId: "tricep-pushdowns",
    loopDuration: 3500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Start", labelZh: "起始",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [72, 60], rElbow: [128, 60], lWrist: [76, 50], rWrist: [124, 50],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
      {
        id: "mid", label: "Push", labelZh: "下压",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [72, 90], rElbow: [128, 90], lWrist: [72, 120], rWrist: [128, 120],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
      {
        id: "end", label: "Bottom", labelZh: "底部",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [84, 46], rShoulder: [116, 46],
          lElbow: [72, 96], rElbow: [128, 96], lWrist: [70, 138], rWrist: [130, 138],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 278], rAnkle: [118, 278],
        },
      },
    ],
  },

  // ===== BULGARIAN SPLIT SQUATS =====
  {
    exerciseId: "bulgarian-split-squats",
    loopDuration: 4500,
    viewBox: "30 0 140 360",
    poses: [
      {
        id: "start", label: "Standing", labelZh: "站立",
        joints: {
          head: [100, 18], neck: [100, 40], lShoulder: [85, 46], rShoulder: [115, 46],
          lElbow: [70, 80], rElbow: [130, 80], lWrist: [64, 114], rWrist: [136, 114],
          lHip: [88, 130], rHip: [112, 130], lKnee: [84, 200], rKnee: [116, 200],
          lAnkle: [82, 270], rAnkle: [112, 160],
        },
      },
      {
        id: "mid", label: "Descent", labelZh: "下降",
        joints: {
          head: [100, 44], neck: [100, 70], lShoulder: [85, 76], rShoulder: [115, 76],
          lElbow: [72, 118], rElbow: [128, 118], lWrist: [66, 156], rWrist: [134, 156],
          lHip: [80, 156], rHip: [112, 150], lKnee: [76, 226], rKnee: [120, 208],
          lAnkle: [82, 270], rAnkle: [112, 160],
        },
      },
      {
        id: "end", label: "Bottom", labelZh: "底部",
        joints: {
          head: [100, 62], neck: [100, 88], lShoulder: [85, 94], rShoulder: [115, 94],
          lElbow: [74, 140], rElbow: [126, 140], lWrist: [68, 178], rWrist: [132, 178],
          lHip: [74, 170], rHip: [112, 160], lKnee: [68, 244], rKnee: [122, 220],
          lAnkle: [82, 270], rAnkle: [112, 160],
        },
      },
    ],
  },

  // ===== HANGING LEG RAISES =====
  {
    exerciseId: "hanging-leg-raises",
    loopDuration: 4000,
    viewBox: "30 -40 140 320",
    poses: [
      {
        id: "start", label: "Hang", labelZh: "悬垂",
        joints: {
          head: [100, 48], neck: [100, 66], lShoulder: [82, 74], rShoulder: [118, 74],
          lElbow: [74, 110], rElbow: [126, 110], lWrist: [70, 20], rWrist: [130, 20],
          lHip: [90, 146], rHip: [110, 146], lKnee: [88, 206], rKnee: [112, 206],
          lAnkle: [86, 262], rAnkle: [114, 262],
          bar: [[60, 18], [140, 18]],
        },
      },
      {
        id: "mid", label: "Raise", labelZh: "抬腿",
        joints: {
          head: [100, 48], neck: [100, 66], lShoulder: [82, 74], rShoulder: [118, 74],
          lElbow: [74, 110], rElbow: [126, 110], lWrist: [70, 20], rWrist: [130, 20],
          lHip: [90, 146], rHip: [110, 146], lKnee: [82, 182], rKnee: [118, 182],
          lAnkle: [76, 214], rAnkle: [124, 214],
          bar: [[60, 18], [140, 18]],
        },
      },
      {
        id: "end", label: "Top", labelZh: "顶点",
        joints: {
          head: [100, 48], neck: [100, 66], lShoulder: [82, 74], rShoulder: [118, 74],
          lElbow: [74, 110], rElbow: [126, 110], lWrist: [70, 20], rWrist: [130, 20],
          lHip: [90, 146], rHip: [110, 146], lKnee: [72, 168], rKnee: [128, 168],
          lAnkle: [64, 196], rAnkle: [136, 196],
          bar: [[60, 18], [140, 18]],
        },
      },
    ],
  },

  // ===== RUSSIAN TWISTS =====
  {
    exerciseId: "russian-twists",
    loopDuration: 3000,
    viewBox: "30 40 140 260",
    poses: [
      {
        id: "start", label: "Center", labelZh: "中间",
        joints: {
          head: [100, 70], neck: [100, 88], lShoulder: [84, 96], rShoulder: [116, 96],
          lElbow: [66, 120], rElbow: [134, 120], lWrist: [60, 106], rWrist: [140, 106],
          lHip: [90, 166], rHip: [110, 166], lKnee: [82, 218], rKnee: [118, 218],
          lAnkle: [76, 260], rAnkle: [124, 260],
        },
      },
      {
        id: "mid", label: "Twist Right", labelZh: "右转",
        joints: {
          head: [110, 70], neck: [110, 88], lShoulder: [94, 96], rShoulder: [126, 96],
          lElbow: [76, 120], rElbow: [144, 120], lWrist: [70, 106], rWrist: [150, 106],
          lHip: [90, 166], rHip: [110, 166], lKnee: [82, 218], rKnee: [118, 218],
          lAnkle: [76, 260], rAnkle: [124, 260],
        },
      },
      {
        id: "end", label: "Twist Left", labelZh: "左转",
        joints: {
          head: [90, 70], neck: [90, 88], lShoulder: [74, 96], rShoulder: [106, 96],
          lElbow: [56, 120], rElbow: [124, 120], lWrist: [50, 106], rWrist: [130, 106],
          lHip: [90, 166], rHip: [110, 166], lKnee: [82, 218], rKnee: [118, 218],
          lAnkle: [76, 260], rAnkle: [124, 260],
        },
      },
    ],
  },

  // ===== BIRD DOGS =====
  {
    exerciseId: "bird-dogs",
    loopDuration: 4000,
    viewBox: "30 20 140 260",
    poses: [
      {
        id: "start", label: "Tabletop", labelZh: "桌面",
        joints: {
          head: [100, 46], neck: [100, 64], lShoulder: [78, 72], rShoulder: [122, 72],
          lElbow: [64, 72], rElbow: [136, 72], lWrist: [56, 92], rWrist: [144, 92],
          lHip: [84, 160], rHip: [116, 160], lKnee: [74, 196], rKnee: [126, 196],
          lAnkle: [64, 214], rAnkle: [136, 214],
        },
      },
      {
        id: "mid", label: "Extend", labelZh: "伸展",
        joints: {
          head: [100, 44], neck: [100, 62], lShoulder: [78, 70], rShoulder: [136, 60],
          lElbow: [64, 70], rElbow: [150, 48], lWrist: [56, 90], rWrist: [158, 38],
          lHip: [84, 158], rHip: [116, 158], lKnee: [64, 196], rKnee: [126, 194],
          lAnkle: [52, 230], rAnkle: [136, 212],
        },
      },
      {
        id: "end", label: "Full Extend", labelZh: "完全伸展",
        joints: {
          head: [100, 42], neck: [100, 60], lShoulder: [78, 68], rShoulder: [148, 52],
          lElbow: [64, 68], rElbow: [162, 40], lWrist: [56, 88], rWrist: [170, 30],
          lHip: [84, 156], rHip: [116, 156], lKnee: [56, 196], rKnee: [126, 192],
          lAnkle: [44, 240], rAnkle: [136, 210],
        },
      },
    ],
  },

  // ===== GLUTE BRIDGES =====
  {
    exerciseId: "glute-bridges",
    loopDuration: 4000,
    viewBox: "30 60 140 220",
    poses: [
      {
        id: "start", label: "Floor", labelZh: "地面",
        joints: {
          head: [100, 112], neck: [100, 126], lShoulder: [84, 132], rShoulder: [116, 132],
          lElbow: [66, 140], rElbow: [134, 140], lWrist: [58, 144], rWrist: [142, 144],
          lHip: [82, 184], rHip: [118, 184], lKnee: [70, 240], rKnee: [130, 240],
          lAnkle: [68, 280], rAnkle: [132, 280],
        },
      },
      {
        id: "mid", label: "Lifting", labelZh: "抬起",
        joints: {
          head: [100, 110], neck: [100, 124], lShoulder: [84, 130], rShoulder: [116, 130],
          lElbow: [66, 138], rElbow: [134, 138], lWrist: [58, 142], rWrist: [142, 142],
          lHip: [84, 150], rHip: [116, 150], lKnee: [72, 226], rKnee: [128, 226],
          lAnkle: [68, 280], rAnkle: [132, 280],
        },
      },
      {
        id: "end", label: "Bridge", labelZh: "桥式",
        joints: {
          head: [100, 108], neck: [100, 122], lShoulder: [84, 128], rShoulder: [116, 128],
          lElbow: [66, 136], rElbow: [134, 136], lWrist: [58, 140], rWrist: [142, 140],
          lHip: [86, 128], rHip: [114, 128], lKnee: [72, 216], rKnee: [128, 216],
          lAnkle: [68, 280], rAnkle: [132, 280],
        },
      },
    ],
  },
];

// Helper to get pose data for an exercise
export function getExercisePoses(exerciseId: string): ExercisePoseData | undefined {
  return exercisePoses.find((ep) => ep.exerciseId === exerciseId);
}
