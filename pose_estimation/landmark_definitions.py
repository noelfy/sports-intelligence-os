"""
MediaPipe Pose landmark indices and connection definitions.

MediaPipe Pose provides 33 landmarks. This module defines named constants
for each landmark index and the connection pairs used for skeleton rendering.
"""

# --- Head/Face (indices 0-10) ---
NOSE = 0
LEFT_EYE_INNER = 1
LEFT_EYE = 2
LEFT_EYE_OUTER = 3
RIGHT_EYE_INNER = 4
RIGHT_EYE = 5
RIGHT_EYE_OUTER = 6
LEFT_EAR = 7
RIGHT_EAR = 8
MOUTH_LEFT = 9
MOUTH_RIGHT = 10

# --- Upper Body (indices 11-22) ---
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_ELBOW = 13
RIGHT_ELBOW = 14
LEFT_WRIST = 15
RIGHT_WRIST = 16
LEFT_PINKY = 17
RIGHT_PINKY = 18
LEFT_INDEX = 19
RIGHT_INDEX = 20
LEFT_THUMB = 21
RIGHT_THUMB = 22

# --- Lower Body (indices 23-32) ---
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28
LEFT_HEEL = 29
RIGHT_HEEL = 30
LEFT_FOOT_INDEX = 31
RIGHT_FOOT_INDEX = 32

# Total number of landmarks
LANDMARK_COUNT = 33

# Human-readable landmark names (index -> name)
LANDMARK_NAMES: dict[int, str] = {
    0: "nose",
    1: "left_eye_inner",
    2: "left_eye",
    3: "left_eye_outer",
    4: "right_eye_inner",
    5: "right_eye",
    6: "right_eye_outer",
    7: "left_ear",
    8: "right_ear",
    9: "mouth_left",
    10: "mouth_right",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    17: "left_pinky",
    18: "right_pinky",
    19: "left_index",
    20: "right_index",
    21: "left_thumb",
    22: "right_thumb",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    29: "left_heel",
    30: "right_heel",
    31: "left_foot_index",
    32: "right_foot_index",
}

# Connections for skeleton drawing: pairs of (start_landmark, end_landmark)
POSE_CONNECTIONS: list[tuple[int, int]] = [
    # Torso
    (LEFT_SHOULDER, RIGHT_SHOULDER),
    (LEFT_SHOULDER, LEFT_HIP),
    (RIGHT_SHOULDER, RIGHT_HIP),
    (LEFT_HIP, RIGHT_HIP),
    # Right arm
    (RIGHT_SHOULDER, RIGHT_ELBOW),
    (RIGHT_ELBOW, RIGHT_WRIST),
    (RIGHT_WRIST, RIGHT_INDEX),
    (RIGHT_WRIST, RIGHT_PINKY),
    (RIGHT_WRIST, RIGHT_THUMB),
    # Left arm
    (LEFT_SHOULDER, LEFT_ELBOW),
    (LEFT_ELBOW, LEFT_WRIST),
    (LEFT_WRIST, LEFT_INDEX),
    (LEFT_WRIST, LEFT_PINKY),
    (LEFT_WRIST, LEFT_THUMB),
    # Right leg
    (RIGHT_HIP, RIGHT_KNEE),
    (RIGHT_KNEE, RIGHT_ANKLE),
    (RIGHT_ANKLE, RIGHT_HEEL),
    (RIGHT_HEEL, RIGHT_FOOT_INDEX),
    # Left leg
    (LEFT_HIP, LEFT_KNEE),
    (LEFT_KNEE, LEFT_ANKLE),
    (LEFT_ANKLE, LEFT_HEEL),
    (LEFT_HEEL, LEFT_FOOT_INDEX),
    # Face
    (NOSE, LEFT_EYE_INNER),
    (LEFT_EYE_INNER, LEFT_EYE),
    (LEFT_EYE, LEFT_EYE_OUTER),
    (NOSE, RIGHT_EYE_INNER),
    (RIGHT_EYE_INNER, RIGHT_EYE),
    (RIGHT_EYE, RIGHT_EYE_OUTER),
    (LEFT_EYE_OUTER, LEFT_EAR),
    (RIGHT_EYE_OUTER, RIGHT_EAR),
    (MOUTH_LEFT, MOUTH_RIGHT),
]

# Key joints used for sports analysis (subset of landmarks)
SPORTS_KEY_JOINTS = {
    "right_shoulder": RIGHT_SHOULDER,
    "left_shoulder": LEFT_SHOULDER,
    "right_elbow": RIGHT_ELBOW,
    "left_elbow": LEFT_ELBOW,
    "right_wrist": RIGHT_WRIST,
    "left_wrist": LEFT_WRIST,
    "right_hip": RIGHT_HIP,
    "left_hip": LEFT_HIP,
    "right_knee": RIGHT_KNEE,
    "left_knee": LEFT_KNEE,
    "right_ankle": RIGHT_ANKLE,
    "left_ankle": LEFT_ANKLE,
}
