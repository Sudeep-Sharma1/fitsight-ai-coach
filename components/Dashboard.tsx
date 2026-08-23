
import React, { useState } from 'react';
import { Exercise, ExerciseName, SessionData, FormFeedback, EXERCISE_DEFINITIONS } from '../types';
import { ProgressChart } from './ProgressChart';
import { PlayIcon, PauseIcon, InfoIcon, SoundOnIcon, SoundOffIcon, DumbbellIcon } from './Icons';
import { audioService } from '../services/audioService';

interface DashboardProps {
    selectedExercise: Exercise;
    reps: number;
    calories: number;
    timer: number;
    isStarted: boolean;
    formFeedback: FormFeedback;
    motivationalTip: string;
    sessionHistory: SessionData[];
    onStartStop: () => void;
    onExerciseChange: (name: ExerciseName) => void;
    currentSet: number;
    targetSets: number;
    targetReps: number;
    onTargetRepsChange: (reps: number) => void;
    onTargetSetsChange: (sets: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    selectedExercise,
    reps,
    calories,
    timer,
    isStarted,
    formFeedback,
    motivationalTip,
    sessionHistory,
    onStartStop,
    onExerciseChange,
    currentSet,
    targetSets,
    targetReps,
    onTargetRepsChange,
    onTargetSetsChange
}) => {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const [activeTab, setActiveTab] = useState<'feedback' | 'progress' | 'guide'>('feedback');
    const [isMuted, setIsMuted] = useState(audioService.getIsMuted());

    const handleToggleMute = () => {
        const muted = audioService.toggleMute();
        setIsMuted(muted);
    };

    const bodyweightExercises = Object.values(EXERCISE_DEFINITIONS).filter(ex => ex.category === 'Bodyweight');
    const dumbbellExercises = Object.values(EXERCISE_DEFINITIONS).filter(ex => ex.category === 'Dumbbells');

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-primary tracking-tight">FitSight</h1>
                    <p className="text-xs text-brand-gray-400">AI Personal Coach & Form Tracker</p>
                </div>
                <button
                    onClick={handleToggleMute}
                    title={isMuted ? "Unmute Audio" : "Mute Audio"}
                    className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-brand-gray-700 text-brand-gray-400' : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/40'}`}
                >
                    {isMuted ? <SoundOffIcon className="w-5 h-5" /> : <SoundOnIcon className="w-5 h-5" />}
                </button>
            </header>

            <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <StatCard label="Time" value={formatTime(timer)} />
                <StatCard label="Calories" value={`${calories.toFixed(1)} kcal`} />
                <StatCard label="Set" value={`${isStarted ? currentSet : '-' } / ${targetSets}`} />
                <StatCard label="Reps" value={`${isStarted ? reps : '-' } / ${targetReps}`} />
            </div>

            <div className="bg-brand-gray-700 rounded-xl p-4 mb-3 border border-brand-gray-600 shadow-md">
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="exercise-select" className="text-xs font-semibold text-brand-gray-300 uppercase tracking-wider">
                        Workout Mode
                    </label>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${selectedExercise.category === 'Dumbbells' ? 'bg-purple-900/60 text-purple-300 border border-purple-500/30' : 'bg-blue-900/60 text-blue-300 border border-blue-500/30'}`}>
                        {selectedExercise.category === 'Dumbbells' && <DumbbellIcon className="w-3.5 h-3.5" />}
                        {selectedExercise.category}
                    </span>
                </div>
                <select
                    id="exercise-select"
                    value={selectedExercise.name}
                    onChange={(e) => onExerciseChange(e.target.value as ExerciseName)}
                    disabled={isStarted}
                    className="w-full bg-brand-gray-600 border border-brand-gray-500 text-white rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 transition-all cursor-pointer"
                >
                    <optgroup label="🏋️‍♂️ Dumbbell Workouts">
                        {dumbbellExercises.map(ex => (
                            <option key={ex.name} value={ex.name}>{ex.displayName}</option>
                        ))}
                    </optgroup>
                    <optgroup label="🤸‍♂️ Bodyweight Workouts">
                        {bodyweightExercises.map(ex => (
                            <option key={ex.name} value={ex.name}>{ex.displayName}</option>
                        ))}
                    </optgroup>
                </select>
            </div>
            
            <div className="bg-brand-gray-700 rounded-xl p-3 mb-4 border border-brand-gray-600">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="sets-input" className="block text-xs font-medium text-brand-gray-300 mb-1 text-center">Target Sets</label>
                        <input id="sets-input" type="number" min="1" max="20" value={targetSets} onChange={e => onTargetSetsChange(Math.max(1, Number(e.target.value)))} disabled={isStarted} className="w-full bg-brand-gray-600 border border-brand-gray-500 text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-primary disabled:opacity-50 text-center font-bold text-lg"/>
                    </div>
                    <div>
                        <label htmlFor="reps-input" className="block text-xs font-medium text-brand-gray-300 mb-1 text-center">Reps / Set</label>
                        <input id="reps-input" type="number" min="1" max="100" value={targetReps} onChange={e => onTargetRepsChange(Math.max(1, Number(e.target.value)))} disabled={isStarted} className="w-full bg-brand-gray-600 border border-brand-gray-500 text-white rounded-lg p-2 focus:ring-2 focus:ring-brand-primary disabled:opacity-50 text-center font-bold text-lg"/>
                    </div>
                </div>
            </div>

            <button
                onClick={onStartStop}
                className={`w-full text-xl font-bold py-3.5 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${isStarted ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-brand-primary hover:bg-emerald-400 text-brand-dark font-black'}`}
            >
                {isStarted ? <PauseIcon /> : <PlayIcon />}
                <span className="ml-2">{isStarted ? 'Stop Session' : 'Start Workout'}</span>
            </button>
            
            <div className="flex-grow bg-brand-gray-700 rounded-xl mt-4 p-4 flex flex-col border border-brand-gray-600 shadow-inner">
                <div className="flex border-b border-brand-gray-600 mb-3 text-xs">
                    <button onClick={() => setActiveTab('feedback')} className={`pb-2 px-3 font-semibold transition-all ${activeTab === 'feedback' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-gray-400 hover:text-white'}`}>Live Form</button>
                    <button onClick={() => setActiveTab('guide')} className={`pb-2 px-3 font-semibold transition-all ${activeTab === 'guide' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-gray-400 hover:text-white'}`}>Exercise Guide</button>
                    <button onClick={() => setActiveTab('progress')} className={`pb-2 px-3 font-semibold transition-all ${activeTab === 'progress' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-brand-gray-400 hover:text-white'}`}>History</button>
                </div>

                {activeTab === 'feedback' && (
                    <div className="flex-grow space-y-3">
                        <FeedbackCard title="Real-time Pose Analysis" feedback={formFeedback} />
                        {motivationalTip && (
                            <div className="p-3 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 rounded-xl text-blue-200 text-xs leading-relaxed flex items-start space-x-2 animate-fadeIn">
                                <span className="text-base">✨</span>
                                <div>
                                    <p className="font-semibold text-blue-100 mb-0.5">AI Coach Tip</p>
                                    <p>{motivationalTip}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'guide' && (
                    <div className="flex-grow text-xs space-y-3">
                        <div className="bg-brand-gray-800 p-3.5 rounded-xl border border-brand-gray-600">
                            <h4 className="font-bold text-white text-sm mb-1 text-brand-secondary">{selectedExercise.displayName}</h4>
                            <p className="text-brand-gray-200 leading-relaxed">{selectedExercise.instructions}</p>
                        </div>
                        <div className="bg-brand-gray-800/80 p-3 rounded-xl border border-brand-gray-700 text-brand-gray-300">
                            <p className="font-semibold text-white mb-1">⚡ Camera Tips:</p>
                            <ul className="list-disc list-inside space-y-1 text-brand-gray-300">
                                <li>Ensure full upper body and arms are clearly in frame.</li>
                                <li>For dumbbell workouts, keep weights visible.</li>
                                <li>Move with controlled tempo for accurate rep counts.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'progress' && (
                    <ProgressChart data={sessionHistory} />
                )}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-brand-gray-800/90 p-3 rounded-xl border border-brand-gray-600 shadow-sm">
        <p className="text-xs font-semibold text-brand-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-white mt-0.5">{value}</p>
    </div>
);

const FeedbackCard: React.FC<{ title: string; feedback: FormFeedback }> = ({ title, feedback }) => (
    <div className={`p-3.5 rounded-xl transition-all duration-300 border ${feedback.isCorrect ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'}`}>
        <h3 className="font-semibold text-white mb-1.5 flex items-center text-xs">
            <InfoIcon className="mr-1.5 w-4 h-4"/>
            {title}
        </h3>
        <ul className="list-disc list-inside text-xs space-y-1">
            {feedback.messages.map((msg, index) => (
                <li key={index} className={feedback.isCorrect ? 'text-emerald-200 font-medium' : 'text-rose-200 font-medium'}>
                    {msg}
                </li>
            ))}
        </ul>
    </div>
);