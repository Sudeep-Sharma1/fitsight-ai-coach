
export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

export enum ExerciseName {
    SQUATS = 'squats',
    PUSHUPS = 'pushups',
    JUMPING_JACKS = 'jumping_jacks',
    BICEP_CURLS = 'bicep_curls',
    SHOULDER_PRESS = 'shoulder_press',
    LATERAL_RAISES = 'lateral_raises',
}

export interface Exercise {
    name: string;
    displayName: string;
    category: 'Bodyweight' | 'Dumbbells';
    metValue: number;
    instructions: string;
    initialState: string;
}

export type ExerciseDefinitions = {
    [key in ExerciseName]: Exercise;
};

export const EXERCISE_DEFINITIONS: ExerciseDefinitions = {
    [ExerciseName.SQUATS]: {
        name: ExerciseName.SQUATS,
        displayName: 'Squats',
        category: 'Bodyweight',
        metValue: 5.5,
        instructions: 'Keep your back straight and lower your hips until your thighs are parallel to the floor.',
        initialState: 'up',
    },
    [ExerciseName.PUSHUPS]: {
        name: ExerciseName.PUSHUPS,
        displayName: 'Push-ups',
        category: 'Bodyweight',
        metValue: 8.0,
        instructions: 'Keep your body in a straight line from head to heels. Lower until your chest nearly touches the floor.',
        initialState: 'up',
    },
    [ExerciseName.JUMPING_JACKS]: {
        name: ExerciseName.JUMPING_JACKS,
        displayName: 'Jumping Jacks',
        category: 'Bodyweight',
        metValue: 8.0,
        instructions: 'Jump while spreading your legs and bringing your arms overhead. Return to the starting position.',
        initialState: 'closed',
    },
    [ExerciseName.BICEP_CURLS]: {
        name: ExerciseName.BICEP_CURLS,
        displayName: 'Dumbbell Bicep Curls',
        category: 'Dumbbells',
        metValue: 5.0,
        instructions: 'Stand upright holding dumbbells at your sides. Keep your elbows glued to your ribs and curl the weights up to shoulder level, then lower slowly.',
        initialState: 'down',
    },
    [ExerciseName.SHOULDER_PRESS]: {
        name: ExerciseName.SHOULDER_PRESS,
        displayName: 'Dumbbell Shoulder Press',
        category: 'Dumbbells',
        metValue: 6.0,
        instructions: 'Hold dumbbells at shoulder height with elbows at 90 degrees. Press the weights straight overhead until arms are extended, then lower under control.',
        initialState: 'down',
    },
    [ExerciseName.LATERAL_RAISES]: {
        name: ExerciseName.LATERAL_RAISES,
        displayName: 'Dumbbell Lateral Raises',
        category: 'Dumbbells',
        metValue: 5.0,
        instructions: 'Hold dumbbells at your sides. Keeping a slight bend in your elbows, raise your arms out to the sides until parallel with the floor, then lower slowly.',
        initialState: 'down',
    }
};


export interface PoseResult {
    landmarks: Landmark[];
}

export interface FormFeedback {
    messages: string[];
    isCorrect: boolean;
}

export interface AnalysisResult {
    feedback: FormFeedback;
    stage: string;
    repCounted: boolean;
}

export interface SessionData {
    name: string;
    reps: number;
    duration: number;
    calories: number;
    date: Date;
    sets: number;
}