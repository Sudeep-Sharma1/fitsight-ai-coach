import { Landmark, ExerciseName, FormFeedback, AnalysisResult } from '../types';
import { EXERCISE_THRESHOLDS, LANDMARK_INDICES as LI } from '../constants';

const calculateAngle = (p1: Landmark, p2: Landmark, p3: Landmark): number => {
    if (!p1 || !p2 || !p3) return 180;
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) {
        angle = 360 - angle;
    }
    return angle;
};

const getVisibility = (landmarks: Landmark[], indices: number[]): number => {
    if (!landmarks || landmarks.length === 0) return 0;
    let visibleCount = 0;
    indices.forEach(index => {
        const lm = landmarks[index];
        if (lm) {
            if (typeof lm.visibility === 'number') {
                if (lm.visibility >= 0.3) visibleCount++;
            } else if (typeof lm.x === 'number' && typeof lm.y === 'number') {
                visibleCount++;
            }
        }
    });
    return indices.length > 0 ? visibleCount / indices.length : 1;
};

const analyzeSquat = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;
    
    const requiredLandmarks = [LI.LEFT_HIP, LI.RIGHT_HIP, LI.LEFT_KNEE, LI.RIGHT_KNEE, LI.LEFT_ANKLE, LI.RIGHT_ANKLE];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Step back so your hips, knees, and feet are visible.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftHip = landmarks[LI.LEFT_HIP];
    const rightHip = landmarks[LI.RIGHT_HIP];
    const leftKnee = landmarks[LI.LEFT_KNEE];
    const rightKnee = landmarks[LI.RIGHT_KNEE];
    const leftAnkle = landmarks[LI.LEFT_ANKLE];
    const rightAnkle = landmarks[LI.RIGHT_ANKLE];
    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];

    const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    const leftHipAngle = (leftShoulder && leftHip && leftKnee) ? calculateAngle(leftShoulder, leftHip, leftKnee) : 180;
    const rightHipAngle = (rightShoulder && rightHip && rightKnee) ? calculateAngle(rightShoulder, rightHip, rightKnee) : 180;
    const avgHipAngle = (leftHipAngle + rightHipAngle) / 2;

    const thresholds = EXERCISE_THRESHOLDS.squats;

    if (currentStage === 'up') {
        if (avgKneeAngle < thresholds.down.knee_angle) {
            nextStage = 'down';
        }
    } else if (currentStage === 'down') {
        if (avgKneeAngle < 105) {
            feedback.messages.push("Great squat depth!");
        } else {
            feedback.messages.push("Squat a little deeper to parallel!");
        }

        if (avgHipAngle < 90) {
            feedback.messages.push("Keep your chest lifted!");
            feedback.isCorrect = false;
        }

        if (avgKneeAngle > thresholds.up.knee_angle) {
            nextStage = 'up';
            repCounted = true;
            feedback.messages.push("Rep counted! Great work!");
        }
    }

    if (feedback.messages.length === 0) feedback.messages.push("Stand tall and squat down smoothly.");

    return { feedback, stage: nextStage, repCounted };
};

const analyzePushup = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;
    
    const requiredLandmarks = [LI.LEFT_SHOULDER, LI.LEFT_ELBOW, LI.LEFT_WRIST, LI.LEFT_HIP];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Position yourself with arms and torso visible.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const leftElbow = landmarks[LI.LEFT_ELBOW];
    const leftWrist = landmarks[LI.LEFT_WRIST];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];
    const rightElbow = landmarks[LI.RIGHT_ELBOW];
    const rightWrist = landmarks[LI.RIGHT_WRIST];
    const hip = landmarks[LI.LEFT_HIP] || landmarks[LI.RIGHT_HIP];
    const knee = landmarks[LI.LEFT_KNEE] || landmarks[LI.RIGHT_KNEE];

    const leftElbowAngle = (leftShoulder && leftElbow && leftWrist) ? calculateAngle(leftShoulder, leftElbow, leftWrist) : 180;
    const rightElbowAngle = (rightShoulder && rightElbow && rightWrist) ? calculateAngle(rightShoulder, rightElbow, rightWrist) : 180;
    const elbowAngle = Math.min(leftElbowAngle, rightElbowAngle);
    
    const shoulder = leftShoulder || rightShoulder;
    const hipAngle = (shoulder && hip && knee) ? calculateAngle(shoulder, hip, knee) : 180;
    
    const thresholds = EXERCISE_THRESHOLDS.pushups;

    if (hipAngle < thresholds.down.hip_angle) {
        feedback.messages.push("Keep your back straight and core tight!");
        feedback.isCorrect = false;
    }

    if (currentStage === 'up') {
        if (elbowAngle < thresholds.down.elbow_angle) {
            nextStage = 'down';
        }
    } else if (currentStage === 'down') {
        if (elbowAngle > thresholds.up.elbow_angle) {
            nextStage = 'up';
            repCounted = true;
            feedback.messages.push("Rep counted!");
        } else {
            feedback.messages.push("Good push-up depth!");
        }
    }
    
    if (feedback.messages.length === 0) feedback.messages.push("Push up smoothly.");
    
    return { feedback, stage: nextStage, repCounted };
};

const analyzeJumpingJack = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;

    const requiredLandmarks = [LI.LEFT_SHOULDER, LI.RIGHT_SHOULDER, LI.LEFT_WRIST, LI.RIGHT_WRIST];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Ensure your full body is in frame.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];
    const leftWrist = landmarks[LI.LEFT_WRIST];
    const rightWrist = landmarks[LI.RIGHT_WRIST];
    const leftAnkle = landmarks[LI.LEFT_ANKLE];
    const rightAnkle = landmarks[LI.RIGHT_ANKLE];

    const shoulderWidth = Math.max(0.1, Math.abs(leftShoulder.x - rightShoulder.x));
    const ankleDistance = (leftAnkle && rightAnkle) ? Math.abs(leftAnkle.x - rightAnkle.x) : shoulderWidth;
    const hipDistanceRatio = ankleDistance / shoulderWidth;
    const handsUp = leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;

    const thresholds = EXERCISE_THRESHOLDS.jumping_jacks;
    
    if (currentStage === 'closed') {
        if (handsUp && hipDistanceRatio > thresholds.open.hip_distance_ratio) {
            nextStage = 'open';
        }
    } else if (currentStage === 'open') {
        if (!handsUp && hipDistanceRatio < thresholds.closed.hip_distance_ratio) {
            nextStage = 'closed';
            repCounted = true;
            feedback.messages.push("Rep counted! Keep jumping!");
        } else {
            feedback.messages.push("Arms up, feet wide!");
        }
    }
    
    if (feedback.messages.length === 0) feedback.messages.push("Great rhythm!");

    return { feedback, stage: nextStage, repCounted };
};

const analyzeBicepCurl = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;

    const requiredLandmarks = [
        LI.LEFT_SHOULDER, LI.RIGHT_SHOULDER,
        LI.LEFT_ELBOW, LI.RIGHT_ELBOW,
        LI.LEFT_WRIST, LI.RIGHT_WRIST
    ];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Ensure your shoulders, elbows, and wrists are visible.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];
    const leftElbow = landmarks[LI.LEFT_ELBOW];
    const rightElbow = landmarks[LI.RIGHT_ELBOW];
    const leftWrist = landmarks[LI.LEFT_WRIST];
    const rightWrist = landmarks[LI.RIGHT_WRIST];
    const leftHip = landmarks[LI.LEFT_HIP];
    const rightHip = landmarks[LI.RIGHT_HIP];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    
    // Check if at least one arm is curling (supports unilateral or bilateral curls)
    const activeElbowAngle = Math.min(leftElbowAngle, rightElbowAngle);

    // Height checks: In a curl, wrist must move vertically UP above elbow, then back DOWN below elbow
    const leftWristRaised = leftWrist.y < leftElbow.y;
    const rightWristRaised = rightWrist.y < rightElbow.y;
    const isWristCurledUp = leftWristRaised || rightWristRaised;

    const leftWristLowered = leftWrist.y > leftElbow.y;
    const rightWristLowered = rightWrist.y > rightElbow.y;
    const isWristLoweredDown = leftWristLowered || rightWristLowered;

    // Check if elbows swing forward excessively
    if (leftHip && rightHip) {
        const leftTorsoAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
        const rightTorsoAngle = calculateAngle(rightHip, rightShoulder, rightElbow);
        if (Math.max(leftTorsoAngle, rightTorsoAngle) > 55) {
            feedback.messages.push("Keep your elbows locked near your ribs!");
            feedback.isCorrect = false;
        }
    }

    const thresholds = EXERCISE_THRESHOLDS.bicep_curls;

    if (currentStage === 'down') {
        // Must bend elbow < 75 deg AND lift wrist above elbow level
        if (activeElbowAngle < thresholds.up.elbow_angle && isWristCurledUp) {
            nextStage = 'up';
        }
    } else if (currentStage === 'up') {
        // Must extend elbow > 130 deg AND lower wrist below elbow level
        if (activeElbowAngle > thresholds.down.elbow_angle && isWristLoweredDown) {
            nextStage = 'down';
            repCounted = true;
            feedback.messages.push("Rep counted! Squeeze at the top!");
        } else {
            feedback.messages.push("Lower the dumbbells all the way down.");
        }
    }

    if (feedback.messages.length === 0) feedback.messages.push("Curl dumbbells up toward shoulders.");

    return { feedback, stage: nextStage, repCounted };
};

const analyzeShoulderPress = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;

    const requiredLandmarks = [
        LI.LEFT_SHOULDER, LI.RIGHT_SHOULDER,
        LI.LEFT_ELBOW, LI.RIGHT_ELBOW,
        LI.LEFT_WRIST, LI.RIGHT_WRIST
    ];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Ensure shoulders, arms, and overhead space are visible.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];
    const leftElbow = landmarks[LI.LEFT_ELBOW];
    const rightElbow = landmarks[LI.RIGHT_ELBOW];
    const leftWrist = landmarks[LI.LEFT_WRIST];
    const rightWrist = landmarks[LI.RIGHT_WRIST];

    const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // In shoulder press, wrists must be significantly above head
    const handsHighOverhead = leftWrist.y < (leftShoulder.y - 0.12) && rightWrist.y < (rightShoulder.y - 0.12);
    const handsAtShoulders = leftWrist.y >= (leftShoulder.y - 0.05) || rightWrist.y >= (rightShoulder.y - 0.05);

    const thresholds = EXERCISE_THRESHOLDS.shoulder_press;

    if (currentStage === 'down') {
        if (avgElbowAngle > thresholds.up.elbow_angle && handsHighOverhead) {
            nextStage = 'up';
        }
    } else if (currentStage === 'up') {
        if (avgElbowAngle < thresholds.down.elbow_angle && handsAtShoulders) {
            nextStage = 'down';
            repCounted = true;
            feedback.messages.push("Rep counted! Strong overhead press!");
        } else {
            feedback.messages.push("Lower dumbbells back to shoulder level.");
        }
    }

    if (feedback.messages.length === 0) feedback.messages.push("Press dumbbells overhead.");

    return { feedback, stage: nextStage, repCounted };
};

const analyzeLateralRaise = (landmarks: Landmark[], currentStage: string): AnalysisResult => {
    const feedback: FormFeedback = { messages: [], isCorrect: true };
    let repCounted = false;
    let nextStage = currentStage;

    const requiredLandmarks = [
        LI.LEFT_SHOULDER, LI.RIGHT_SHOULDER,
        LI.LEFT_ELBOW, LI.RIGHT_ELBOW
    ];
    if (getVisibility(landmarks, requiredLandmarks) < 0.4) {
        feedback.messages.push("Ensure your shoulders and arms are visible.");
        feedback.isCorrect = false;
        return { feedback, stage: currentStage, repCounted };
    }

    const leftShoulder = landmarks[LI.LEFT_SHOULDER];
    const rightShoulder = landmarks[LI.RIGHT_SHOULDER];
    const leftElbow = landmarks[LI.LEFT_ELBOW];
    const rightElbow = landmarks[LI.RIGHT_ELBOW];
    const leftHip = landmarks[LI.LEFT_HIP];
    const rightHip = landmarks[LI.RIGHT_HIP];

    const leftArmAngle = leftHip ? calculateAngle(leftHip, leftShoulder, leftElbow) : 90;
    const rightArmAngle = rightHip ? calculateAngle(rightHip, rightShoulder, rightElbow) : 90;
    const maxArmAngle = Math.max(leftArmAngle, rightArmAngle);

    const thresholds = EXERCISE_THRESHOLDS.lateral_raises;

    if (currentStage === 'down') {
        if (maxArmAngle > thresholds.up.arm_angle) {
            nextStage = 'up';
        }
    } else if (currentStage === 'up') {
        if (maxArmAngle > 115) {
            feedback.messages.push("Don't raise higher than shoulder level!");
            feedback.isCorrect = false;
        }

        if (maxArmAngle < thresholds.down.arm_angle) {
            nextStage = 'down';
            repCounted = true;
            feedback.messages.push("Rep counted! Controlled tempo!");
        } else {
            feedback.messages.push("Lower dumbbells slowly to sides.");
        }
    }

    if (feedback.messages.length === 0) feedback.messages.push("Raise arms to shoulder height.");

    return { feedback, stage: nextStage, repCounted };
};

export const analyzePose = (
    exercise: ExerciseName,
    landmarks: Landmark[],
    currentStage: string
): AnalysisResult => {
    switch (exercise) {
        case ExerciseName.SQUATS:
            return analyzeSquat(landmarks, currentStage);
        case ExerciseName.PUSHUPS:
            return analyzePushup(landmarks, currentStage);
        case ExerciseName.JUMPING_JACKS:
            return analyzeJumpingJack(landmarks, currentStage);
        case ExerciseName.BICEP_CURLS:
            return analyzeBicepCurl(landmarks, currentStage);
        case ExerciseName.SHOULDER_PRESS:
            return analyzeShoulderPress(landmarks, currentStage);
        case ExerciseName.LATERAL_RAISES:
            return analyzeLateralRaise(landmarks, currentStage);
        default:
            return {
                feedback: { messages: ["Exercise not recognized."], isCorrect: false },
                stage: 'start',
                repCounted: false
            };
    }
};
