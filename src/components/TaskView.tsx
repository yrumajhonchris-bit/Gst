import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin, RefreshCw, Star } from 'lucide-react';
import { formatPhp, getTaskProgress } from '../lib/ghaEngine';
import { GhaAppState, HotelTask } from '../types/gha';
import { SafeImage } from './GhaLogo';

interface TaskViewProps {
  state: GhaAppState;
  onOpenTaskDetails: (task: HotelTask) => void;
  onResetBatch: () => void;
}

export function TaskView({ state, onOpenTaskDetails, onResetBatch }: TaskViewProps) {
  const [filter, setFilter] = useState<'ongoing' | 'completed'>('ongoing');
  const progress = getTaskProgress(state);

  const ongoingTasks = state.tasks.filter((task) => task.status === 'ongoing');
  const completedTasks = state.tasks.filter((task) => task.status === 'completed');
  const visibleTasks = filter === 'ongoing' ? ongoingTasks : completedTasks;

  return (
    <div className="space-y-5">
      {/* Progress Header */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-lg font-display font-bold text-[#0B2545]">
              Daily Hospitality Quality Audits
            </h1>
            <p className="text-xs text-slate-500">
              Rate each partner property to earn {formatPhp(state.tasks[0]?.rewardPhp ?? 10)} per completed audit.
            </p>
          </div>
          <span className="text-lg font-display font-bold text-[#1570EF] tabular-nums shrink-0">
            Progress {progress.percent}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1570EF] to-[#C8922A] transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </section>

      {/* Ongoing / Completed Segmented Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/80 rounded-2xl max-w-lg">
        <button
          type="button"
          onClick={() => setFilter('ongoing')}
          className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            filter === 'ongoing'
              ? 'bg-[#0B2545] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span className="tabular-nums">Ongoing ({ongoingTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
            filter === 'completed'
              ? 'bg-[#0B2545] text-white shadow-xs'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="tabular-nums">Completed ({completedTasks.length})</span>
        </button>
      </div>

      {/* Task List */}
      {visibleTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h2 className="font-display font-bold text-base text-[#0B2545]">
            {filter === 'ongoing' ? 'All Daily Audits Completed!' : 'No Completed Audits Yet'}
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            {filter === 'ongoing'
              ? 'Great job! Refresh a new batch of 5 luxury hotel properties to continue earning.'
              : 'Select an Ongoing hotel task and submit a 5-star review to earn PHP.'}
          </p>
          {filter === 'ongoing' && (
            <button
              type="button"
              onClick={onResetBatch}
              className="h-11 px-5 rounded-xl bg-[#1570EF] hover:bg-[#125EC9] text-white text-sm font-semibold inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Load New Daily Batch</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleTasks.map((task) => (
            <article
              key={task.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="font-display font-bold text-sm sm:text-base text-[#0B2545]">
                    {task.hotelName}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {task.location} · {task.category}
                    </span>
                  </p>
                </div>
                <span className="text-sm font-bold text-[#C8922A] tabular-nums shrink-0">
                  +{formatPhp(task.rewardPhp)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <SafeImage
                  src={task.image}
                  alt={task.hotelName}
                  className="w-28 h-20 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    {task.status === 'completed' ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{task.rating}/5 Rated</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-[#1570EF]">Ongoing</span>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenTaskDetails(task)}
                      className="h-9 px-4 rounded-xl bg-[#1570EF] hover:bg-[#125EC9] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                    >
                      {task.status === 'completed' ? 'View Audit' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskDetailsViewProps {
  task: HotelTask;
  onBack: () => void;
  onSubmitReview: (taskId: string, rating: number, note: string) => { ok: boolean; message: string };
}

export function TaskDetailsView({ task, onBack, onSubmitReview }: TaskDetailsViewProps) {
  const [rating, setRating] = useState<number>(task.rating ?? 0);
  const [note, setNote] = useState<string>(task.reviewNote ?? '');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const quickNotes = [
    'Clean suites, attentive concierge, and verified photo presentation.',
    'Strong dining ambience and smooth check-in standards.',
    'Resort pool deck and coastal views match GST luxury criteria.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onSubmitReview(task.id, rating, note);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setTimeout(() => onBack(), 850);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <SafeImage
          src={task.image}
          alt={task.hotelName}
          className="w-full h-56 sm:h-64 object-cover"
        />
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#1570EF]">
                {task.location} · {task.category}
              </p>
              <h1 className="text-xl font-display font-bold text-[#0B2545] mt-1">
                Task Title: {task.hotelName}
              </h1>
            </div>
            <span className="text-base font-bold text-[#C8922A] tabular-nums shrink-0">
              +{formatPhp(task.rewardPhp)}
            </span>
          </div>

          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Task Description:</strong> {task.description}
          </p>

          {feedback && (
            <div
              role="alert"
              className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                feedback.ok
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <p className="text-sm font-semibold text-[#1570EF] mb-2">
                Please click on the rating
              </p>
              <div className="flex items-center gap-2" role="group" aria-label="Hotel Star Rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={task.status === 'completed'}
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 flex items-center justify-center hover:border-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-sm font-semibold text-slate-700 ml-2 tabular-nums">
                    {rating}/5 Stars
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="audit-note" className="block text-xs font-medium text-slate-600 mb-1.5">
                Quality Audit Comment (Optional)
              </label>
              <textarea
                id="audit-note"
                rows={3}
                disabled={task.status === 'completed'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a concise hospitality quality observation..."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:outline-none focus:border-[#1570EF]"
              />
              {task.status === 'ongoing' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {quickNotes.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setNote(q)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="h-12 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Back to Tasks
              </button>
              {task.status === 'ongoing' && (
                <button
                  type="submit"
                  className="flex-1 h-12 rounded-xl bg-[#C8922A] hover:bg-[#B5811F] text-white font-semibold text-sm"
                >
                  Submit Audit (+{formatPhp(task.rewardPhp)})
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
