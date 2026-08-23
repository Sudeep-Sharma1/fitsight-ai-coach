
export const COLORS = {
    CORRECT: '#14F195', // brand-primary
    INCORRECT: '#F43F5E', // red-500
    SKELETON: '#00C2FF', // brand-secondary
    TEXT: '#F9FAFB'
};

export const EXERCISE_THRESHOLDS = {
    squats: {
        up: {
            knee_angle: 150,
            hip_angle: 145,
        },
        down: {
            knee_angle: 120, // Realistic parallel/semi-squat depth for webcam
            hip_angle: 130,
        }
    },
    pushups: {
        up: {
            elbow_angle: 145,
            hip_angle: 135,
        },
        down: {
            elbow_angle: 105,
            hip_angle: 130,
        }
    },
    jumping_jacks: {
        closed: {
            left_shoulder_angle: 35,
            right_shoulder_angle: 35,
            hip_distance_ratio: 0.35
        },
        open: {
            left_shoulder_angle: 130,
            right_shoulder_angle: 130,
            hip_distance_ratio: 0.55
        }
    },
    bicep_curls: {
        down: {
            elbow_angle: 130, // Arms extended down
        },
        up: {
            elbow_angle: 75, // Dumbbells curled up
        }
    },
    shoulder_press: {
        down: {
            elbow_angle: 110, // Dumbbells at shoulder level
        },
        up: {
            elbow_angle: 145, // Arms pressed overhead
        }
    },
    lateral_raises: {
        down: {
            arm_angle: 30, // Arms at sides
        },
        up: {
            arm_angle: 70, // Arms raised toward parallel
        }
    }
};

export const LANDMARK_INDICES = {
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
};
