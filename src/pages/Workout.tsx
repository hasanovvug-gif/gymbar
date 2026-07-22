import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { WORKOUT_DAYS } from '../data/workoutData';
import { formatTime, cn } from '../lib/utils';
import { Check, Clock, SkipForward, ChevronRight, ChevronLeft, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Workout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeWorkout, updateExerciseLog, finishWorkout, cancelWorkout, addAiMessage, setAiAssistantOpen } = useWorkoutStore();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [globalTime, setGlobalTime] = useState(0);
  const [restTime, setRestTime] = useState<number | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [tempWeight, setTempWeight] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!activeWorkout) {
      navigate('/');
      return;
    }

    const interval = setInterval(() => {
      setGlobalTime(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeWorkout, navigate]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restTime !== null && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev && prev <= 1) {
            setIsResting(false);
            if (audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  if (!activeWorkout) return null;

  const day = WORKOUT_DAYS.find((d) => d.id === activeWorkout.dayId);
  if (!day) return null;

  const exercise = day.exercises[currentIndex];
  const log = activeWorkout.logs[exercise.id] || {
    exerciseId: exercise.id,
    weight: exercise.defaultWeight,
    setsCompleted: 0,
    skipped: false,
  };

  const progress = (currentIndex / day.exercises.length) * 100;

  const handleSetComplete = () => {
    const newSets = log.setsCompleted + 1;
    updateExerciseLog(exercise.id, { setsCompleted: newSets });
    
    if (newSets < exercise.sets) {
      setRestTime(60);
      setIsResting(true);
    } else {
      if (currentIndex < day.exercises.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setRestTime(90);
        setIsResting(true);
      }
    }
  };

  const handleSkip = () => {
    updateExerciseLog(exercise.id, { skipped: true });
    
    // Proactive AI Message
    addAiMessage({ 
      role: 'model', 
      text: t('ai_skipped_exercise', { exercise: t(exercise.name) })
    });
    setAiAssistantOpen(true);

    if (currentIndex < day.exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleFinish = () => {
    let totalVolume = 0;
    day.exercises.forEach((ex) => {
      const exLog = activeWorkout.logs[ex.id];
      if (exLog && !exLog.skipped) {
        const weight = parseFloat(exLog.weight) || 0;
        const reps = parseInt(ex.reps.split('-')[1] || ex.reps.split('-')[0]) || 0;
        totalVolume += weight * exLog.setsCompleted * reps;
      }
    });
    finishWorkout(globalTime, totalVolume);
    navigate('/summary');
  };

  const handleWeightSave = () => {
    const newWeight = tempWeight || log.weight;
    updateExerciseLog(exercise.id, { weight: newWeight });
    setShowWeightInput(false);

    // Proactive AI Message if weight dropped significantly
    const oldWeightNum = parseFloat(log.weight);
    const newWeightNum = parseFloat(newWeight);
    if (oldWeightNum > 0 && newWeightNum < oldWeightNum * 0.8) {
      addAiMessage({ 
        role: 'model', 
        text: t('ai_weight_dropped', { exercise: t(exercise.name), oldWeight: oldWeightNum, newWeight: newWeightNum })
      });
      setAiAssistantOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => cancelWorkout()}
            className="text-xs text-slate-500 hover:text-red-500 uppercase tracking-wider font-bold"
          >
            {t('cancel')}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white shadow-sm px-3 py-1.5 rounded-full border border-slate-200">
          <Clock className="w-4 h-4 text-blue-600" />
          <span className="font-mono text-sm font-medium text-slate-700">{formatTime(globalTime)}</span>
        </div>
      </header>

      <div className="mb-8">
        <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
          <span>{t('exercise_x_of_y', { current: currentIndex + 1, total: day.exercises.length })}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl" />
          
          <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-2 relative z-10">{t(exercise.name)}</h2>
          <p className="text-slate-500 mb-6 relative z-10">
            {exercise.sets} {t('sets_count')} × {exercise.reps} {exercise.isTimeBased ? '' : t('reps_count')}
          </p>

          <div className="mb-8 relative z-10">
            <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">{t('working_weight')}</label>
            {showWeightInput ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-mono text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder={log.weight}
                  autoFocus
                />
                <button 
                  onClick={handleWeightSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl font-bold transition-colors shadow-sm"
                >
                  OK
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setTempWeight(log.weight);
                  setShowWeightInput(true);
                }}
                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:border-slate-300 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Dumbbell className="w-5 h-5 text-blue-600" />
                  <span className="text-xl font-mono text-slate-900 font-medium">{log.weight} {exercise.isTimeBased || log.weight === '0' ? '' : t('kg')}</span>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{t('change')}</span>
              </button>
            )}
          </div>

          <div className="space-y-3 relative z-10">
            {Array.from({ length: exercise.sets }).map((_, idx) => {
              const isCompleted = idx < log.setsCompleted;
              const isCurrent = idx === log.setsCompleted;
              
              return (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                    isCompleted ? "bg-blue-50 border-blue-200 text-blue-700" :
                    isCurrent ? "bg-white border-slate-300 shadow-sm text-slate-900" : "bg-slate-50 border-slate-200 text-slate-400"
                  )}
                >
                  <span className="font-medium">{t('set')} {idx + 1}</span>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <button 
                      onClick={handleSetComplete}
                      className="bg-blue-600 text-white text-sm font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      {t('completed')}
                    </button>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isResting && (
          <div className="mt-6 bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <p className="text-slate-500 text-sm mb-2 uppercase tracking-wider font-bold">{t('rest')}</p>
            <div className="text-4xl font-mono font-bold text-blue-600 mb-4">
              {formatTime(restTime || 0)}
            </div>
            <div className="flex gap-2 w-full">
              <button 
                onClick={() => setRestTime((prev) => (prev || 0) + 30)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                +30 {t('sec')}
              </button>
              <button 
                onClick={() => setIsResting(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {t('skip')}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 flex items-center justify-between gap-4">
        <button 
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors text-slate-700"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={handleSkip}
          className="flex-1 flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors font-medium"
        >
          <SkipForward className="w-5 h-5" />
          {t('skip')}
        </button>

        {currentIndex === day.exercises.length - 1 ? (
          <button 
            onClick={handleFinish}
            className="p-4 bg-blue-600 text-white shadow-sm rounded-2xl hover:bg-blue-700 transition-colors font-bold"
          >
            {t('finish')}
          </button>
        ) : (
          <button 
            onClick={() => setCurrentIndex(Math.min(day.exercises.length - 1, currentIndex + 1))}
            className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:bg-slate-50 transition-colors text-slate-700"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </footer>
    </div>
  );
}
