
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WebcamView } from './components/WebcamView';
import { Dashboard } from './components/Dashboard';
import { PoseResult, EXERCISE_DEFINITIONS, Exercise, ExerciseName, SessionData, FormFeedback } from './types';
import { analyzePose } from './services/exerciseService';
import { getMotivationalTip } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
    const [selectedExercise, setSelectedExercise] = useState<Exercise>(EXERCISE_DEFINITIONS.squats);
    const [reps, setReps] = useState(0);
    const [calories, setCalories] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    
    // Load persisted user weight or default to 70kg
    const [userWeight, setUserWeight] = useState<number>(() => {
        const saved = localStorage.getItem('fitsight_user_weight');
        return saved ? Number(saved) : 70;
    });

    const [formFeedback, setFormFeedback] = useState<FormFeedback>({ messages: [], isCorrect: true });
    const [motivationalTip, setMotivationalTip] = useState<string>('');
    
    // Load persisted session history from localStorage
    const [sessionHistory, setSessionHistory] = useState<SessionData[]>(() => {
        const saved = localStorage.getItem('fitsight_session_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((item: any) => ({ ...item, date: new Date(item.date) }));
            } catch (e) {
                console.error("Failed to parse saved session history", e);
            }
        }
        return [];
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState<boolean>(() => {
        return !localStorage.getItem('fitsight_user_weight');
    });

    // Sets and rest state
    const [targetReps, setTargetReps] = useState(10);
    const [targetSets, setTargetSets] = useState(3);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [restTimer, setRestTimer] = useState(60);

    const exerciseStateRef = useRef<string>('up');
    const timerIntervalRef = useRef<number | null>(null);
    const restTimerIntervalRef = useRef<number | null>(null);

    // Save session history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('fitsight_session_history', JSON.stringify(sessionHistory));
        } catch (e) {
            console.error("Failed to save session history to localStorage", e);
        }
    }, [sessionHistory]);

    const handleStartStop = useCallback(() => {
        setIsStarted(prev => !prev);
    }, []);
    
    const handleExerciseChange = useCallback((exerciseName: ExerciseName) => {
        if (!isStarted) {
            const newExercise = EXERCISE_DEFINITIONS[exerciseName];
            setSelectedExercise(newExercise);
            exerciseStateRef.current = newExercise.initialState;
        }
    }, [isStarted]);

    const resetState = useCallback(() => {
        setReps(0);
        setCalories(0);
        setTimer(0);
        setCurrentSet(1);
        setIsResting(false);
        setFormFeedback({ messages: ['Get in position.'], isCorrect: true });
        exerciseStateRef.current = EXERCISE_DEFINITIONS[selectedExercise.name as ExerciseName].initialState;
    }, [selectedExercise]);

    // Main workout timer effect
    useEffect(() => {
        if (isStarted && !isResting) {
            timerIntervalRef.current = window.setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isStarted, isResting]);

    // Effect for session start/stop and history logging
    useEffect(() => {
        if (isStarted) {
            resetState();
        } else {
            if (timer > 0 || reps > 0) {
                const completedSets = currentSet > targetSets ? targetSets : currentSet;
                setSessionHistory(prev => [
                    ...prev,
                    {
                        name: selectedExercise.displayName,
                        reps,
                        calories: parseFloat(calories.toFixed(2)),
                        duration: timer,
                        date: new Date(),
                        sets: completedSets
                    }
                ]);
                audioService.playFinishSound();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStarted]);
    
    // Rest timer effect
    useEffect(() => {
        if (isResting) {
            audioService.playRestSound();
            setRestTimer(60);
            restTimerIntervalRef.current = window.setInterval(() => {
                setRestTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(restTimerIntervalRef.current!);
                        setIsResting(false);
                        setCurrentSet(s => s + 1);
                        setReps(0);
                        exerciseStateRef.current = EXERCISE_DEFINITIONS[selectedExercise.name as ExerciseName].initialState;
                        audioService.playRestSound(); // Notify user rest is over
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (restTimerIntervalRef.current) clearInterval(restTimerIntervalRef.current);
        };
    }, [isResting, selectedExercise.name]);

    useEffect(() => {
        if (isStarted && timer > 0) {
            const timeInHours = timer / 3600;
            const cals = selectedExercise.metValue * userWeight * timeInHours;
            setCalories(cals);
        }
    }, [timer, isStarted, selectedExercise.metValue, userWeight]);

    const lastRepTimeRef = useRef<number>(0);
    const [currentStageDisplay, setCurrentStageDisplay] = useState<string>(() => EXERCISE_DEFINITIONS.squats.initialState);

    const handlePoseResult = (result: PoseResult) => {
        if (!isStarted || !result.landmarks.length || isResting) return;

        const { feedback, stage, repCounted } = analyzePose(selectedExercise.name as ExerciseName, result.landmarks, exerciseStateRef.current);
        
        setFormFeedback(feedback);
        exerciseStateRef.current = stage;
        setCurrentStageDisplay(stage);

        const now = Date.now();
        // Enforce minimum 1.2s between repetitions to eliminate camera noise / frame jitter
        if (repCounted && (now - lastRepTimeRef.current > 1200)) {
            lastRepTimeRef.current = now;
            audioService.playRepSound();

            setReps(prevReps => {
                const nextReps = prevReps + 1;
                if (nextReps >= targetReps) {
                    if (currentSet >= targetSets) {
                        // Completed all target sets -> end workout cleanly
                        setIsStarted(false);
                    } else {
                        // Completed current set -> enter rest period
                        setIsResting(true);
                    }
                    return targetReps;
                }
                return nextReps;
            });
        }
    };
    
    useEffect(() => {
        resetState();
        setCurrentStageDisplay(EXERCISE_DEFINITIONS[selectedExercise.name as ExerciseName].initialState);
    }, [selectedExercise, resetState]);

    useEffect(() => {
        if (formFeedback.messages.length > 0 && !formFeedback.isCorrect) {
            const fetchTip = async () => {
                const tip = await getMotivationalTip(selectedExercise.name as ExerciseName, formFeedback.messages[0]);
                setMotivationalTip(tip);
            };
            const debounceTimeout = setTimeout(fetchTip, 1000);
            return () => clearTimeout(debounceTimeout);
        } else {
            setMotivationalTip('');
        }
    }, [formFeedback, selectedExercise.name]);

    const handleWeightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('fitsight_user_weight', String(userWeight));
        setIsWeightModalOpen(false);
    };
    
    if (isWeightModalOpen) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
                <div className="bg-brand-gray-700 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-brand-gray-600">
                    <div className="w-16 h-16 bg-brand-primary/20 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
                        ⚡
                    </div>
                    <h2 className="text-2xl font-black mb-2 text-brand-primary">Welcome to FitSight</h2>
                    <p className="mb-6 text-brand-gray-200 text-sm leading-relaxed">
                        Please enter your weight in kilograms for personalized, accurate calorie tracking.
                    </p>
                    <form onSubmit={handleWeightSubmit}>
                        <div className="relative mb-6">
                            <input
                                type="number"
                                value={userWeight}
                                onChange={(e) => setUserWeight(Math.max(20, Math.min(300, parseInt(e.target.value, 10) || 70)))}
                                className="bg-brand-gray-600 border border-brand-gray-500 text-white p-3.5 rounded-xl w-full text-center text-3xl font-black focus:ring-2 focus:ring-brand-primary outline-none"
                                min="20"
                                max="300"
                            />
                            <span className="absolute right-4 top-4 text-brand-gray-400 font-bold text-sm">KG</span>
                        </div>
                        <button type="submit" className="w-full bg-brand-primary text-brand-dark font-black py-3.5 px-6 rounded-xl hover:bg-emerald-400 transition-all duration-300 shadow-lg text-lg">
                            Let's Get Started
                        </button>
                    </form>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-brand-dark flex flex-col lg:flex-row font-sans">
            <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8">
                <div className="w-full max-w-4xl aspect-video relative bg-brand-gray-700 rounded-lg shadow-2xl overflow-hidden">
                    <WebcamView
                        onPoseResult={handlePoseResult}
                        onLoadingChange={setIsLoading}
                        formFeedback={formFeedback}
                        isResting={isResting}
                        restTimer={restTimer}
                        isStarted={isStarted}
                        currentStage={currentStageDisplay}
                        exerciseDisplayName={selectedExercise.displayName}
                    />
                     {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-20">
                            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-white mt-4 text-lg">Initializing AI & Webcam...</p>
                        </div>
                    )}
                </div>
            </main>
            <aside className="w-full lg:w-96 bg-brand-gray-800 p-4 lg:p-6 flex flex-col space-y-6">
                <Dashboard
                    selectedExercise={selectedExercise}
                    reps={reps}
                    calories={calories}
                    timer={timer}
                    isStarted={isStarted}
                    formFeedback={formFeedback}
                    motivationalTip={motivationalTip}
                    sessionHistory={sessionHistory}
                    onStartStop={handleStartStop}
                    onExerciseChange={handleExerciseChange}
                    currentSet={currentSet}
                    targetSets={targetSets}
                    targetReps={targetReps}
                    onTargetRepsChange={setTargetReps}
                    onTargetSetsChange={setTargetSets}
                />
            </aside>
        </div>
    );
};

export default App;