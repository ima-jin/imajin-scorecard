'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Scorecard, Question } from '@/db/schema';

interface QuestionOption {
  value: string;
  label: string;
  points: number;
}

export default function QuestionEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<{ did: string } | null>(null);
  const userDidRef = useRef<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Scorecard metadata editing
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);

  // New question form
  const [text, setText] = useState('');
  const [type, setType] = useState<'yes_no' | 'multiple_choice' | 'open_text'>('yes_no');
  const [isRequired, setIsRequired] = useState(true);
  const [isQualifying, setIsQualifying] = useState(false);
  const [options, setOptions] = useState<QuestionOption[]>([
    { value: 'yes', label: 'Yes', points: 1 },
    { value: 'no', label: 'No', points: 0 },
  ]);

  // Inline editing state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editType, setEditType] = useState<'yes_no' | 'multiple_choice' | 'open_text'>('yes_no');
  const [editIsRequired, setEditIsRequired] = useState(true);
  const [editIsQualifying, setEditIsQualifying] = useState(false);
  const [editOptions, setEditOptions] = useState<QuestionOption[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (!data) {
          router.push('/');
          return null;
        }
        setUser(data);
        userDidRef.current = data.did;
        return fetch(`/api/scorecards/${id}`);
      })
      .then(r => {
        if (!r) return null;
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((sc: Scorecard & { questions?: Question[] }) => {
        if (!sc) return;
        if (sc.creatorDid !== userDidRef.current) {
          router.push('/dashboard');
          return;
        }
        setScorecard(sc);
        setEditTitle(sc.title || '');
        setEditDescription(sc.description || '');
        setEditSlug((sc as any).slug || '');
        if (sc.questions) setQuestions(sc.questions);
        setLoading(false);
      })
      .catch(() => router.push('/dashboard'));
  }, [id, router]);

  useEffect(() => {
    if (user && scorecard && scorecard.creatorDid !== user.did) {
      router.push('/dashboard');
    }
  }, [user, scorecard, router]);

  useEffect(() => {
    if (type === 'yes_no') {
      setOptions([
        { value: 'yes', label: 'Yes', points: 1 },
        { value: 'no', label: 'No', points: 0 },
      ]);
    } else if (type === 'multiple_choice') {
      setOptions([
        { value: 'a', label: 'Option A', points: 1 },
        { value: 'b', label: 'Option B', points: 0 },
      ]);
    } else {
      setOptions([]);
    }
  }, [type]);

  const addOption = () => {
    const label = `Option ${String.fromCharCode(65 + options.length)}`;
    setOptions(prev => [...prev, { value: label.toLowerCase().replace(/\s/g, '_'), label, points: 0 }]);
  };

  const removeOption = (i: number) => {
    setOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateOption = (i: number, field: keyof QuestionOption, val: string | number) => {
    setOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  };

  const startEdit = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditText(q.text);
    setEditType(q.type as 'yes_no' | 'multiple_choice' | 'open_text');
    setEditIsRequired(q.isRequired);
    setEditIsQualifying(q.isQualifying);
    setEditOptions((q.options as QuestionOption[]) ?? []);
  };

  const cancelEdit = () => {
    setEditingQuestionId(null);
    setEditText('');
    setEditType('yes_no');
    setEditIsRequired(true);
    setEditIsQualifying(false);
    setEditOptions([]);
  };

  const updateEditOption = (i: number, field: keyof QuestionOption, val: string | number) => {
    setEditOptions(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: val } : o));
  };

  const addEditOption = () => {
    const label = `Option ${String.fromCharCode(65 + editOptions.length)}`;
    setEditOptions(prev => [...prev, { value: label.toLowerCase().replace(/\s/g, '_'), label, points: 0 }]);
  };

  const removeEditOption = (i: number) => {
    setEditOptions(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSaveEdit = async (questionId: string) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    const res = await fetch(`/api/scorecards/${id}/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: editText,
        type: editType,
        isRequired: editIsRequired,
        isQualifying: editIsQualifying,
        options: editOptions,
      }),
    });
    setSavingEdit(false);
    if (res.ok) {
      const updated = await res.json();
      setQuestions(prev => prev.map(q => q.id === questionId ? updated : q));
      cancelEdit();
    } else {
      alert('Failed to save changes.');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/scorecards/${id}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        type,
        sortOrder: questions.length,
        isRequired,
        isQualifying,
        options,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const q = await res.json();
      setQuestions(prev => [...prev, q]);
      setText('');
      setType('yes_no');
      setIsRequired(true);
      setIsQualifying(false);
      setOptions([
        { value: 'yes', label: 'Yes', points: 1 },
        { value: 'no', label: 'No', points: 0 },
      ]);
    } else {
      alert('Failed to add question.');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/api/scorecards/${id}/questions/${questionId}`, { method: 'DELETE' });
    if (res.ok) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } else {
      alert('Failed to delete.');
    }
  };

  const moveQuestion = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    setQuestions(reordered);
    const questionIds = reordered.map(q => q.id);
    await fetch(`/api/scorecards/${id}/questions/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionIds }),
    });
  };

  const handlePublish = async () => {
    if (questions.length === 0) {
      alert('Add at least one question before publishing.');
      return;
    }
    setPublishing(true);
    const res = await fetch(`/api/scorecards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    setPublishing(false);
    if (res.ok) {
      router.push(`/create/results/${id}`);
    } else {
      alert('Failed to publish.');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse h-8 w-48 bg-gray-800 rounded" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Scorecard Metadata */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Scorecard Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input
                value={editTitle}
                onChange={e => { setEditTitle(e.target.value); setMetaSaved(false); }}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={editDescription}
                onChange={e => { setEditDescription(e.target.value); setMetaSaved(false); }}
                rows={2}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Custom URL slug <span className="text-gray-600">(optional)</span></label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2 bg-gray-800 border border-r-0 border-gray-700 rounded-l-lg text-sm text-gray-500">{typeof window !== 'undefined' ? window.location.origin : ''}/scorecard/</span>
                <input
                  value={editSlug}
                  onChange={e => { setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setMetaSaved(false); }}
                  placeholder={id}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-r-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setSavingMeta(true);
                  const body: any = { title: editTitle, description: editDescription };
                  if (editSlug) body.slug = editSlug;
                  const res = await fetch(`/api/scorecards/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });
                  setSavingMeta(false);
                  if (res.ok) {
                    setMetaSaved(true);
                    const updated = await res.json();
                    setScorecard(updated);
                  }
                }}
                disabled={savingMeta}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm disabled:opacity-50 transition-colors"
              >
                {savingMeta ? 'Saving…' : metaSaved ? '✓ Saved' : 'Save Details'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Questions</h1>
            <p className="text-gray-400 text-sm mt-1">{editTitle || scorecard?.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/create/results/${id}`}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
            >
              Next: Configure Results →
            </Link>
            {scorecard?.status !== 'published' && (
              <button
                onClick={handlePublish}
                disabled={publishing || questions.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg text-sm disabled:opacity-50"
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            )}
          </div>
        </div>

        {/* Existing Questions */}
        {questions.length > 0 && (
          <div className="space-y-3 mb-8">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                {editingQuestionId === q.id ? (
                  /* Edit form */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Question Text <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        placeholder="e.g. Do you currently have a documented marketing strategy?"
                        required
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                        <select
                          value={editType}
                          onChange={e => setEditType(e.target.value as typeof editType)}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="yes_no">Yes / No</option>
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="open_text">Open Text</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                          <input
                            type="checkbox"
                            checked={editIsRequired}
                            onChange={e => setEditIsRequired(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded"
                          />
                          <span className="text-sm text-gray-300">Required</span>
                        </label>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2.5 group relative">
                          <input
                            type="checkbox"
                            checked={editIsQualifying}
                            onChange={e => setEditIsQualifying(e.target.checked)}
                            className="w-4 h-4 accent-amber-500 rounded"
                          />
                          <span className="text-sm text-gray-300">Qualifying</span>
                          <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 bg-gray-800 text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-700">
                            Qualifying questions aren't scored — used for lead qualification
                          </span>
                        </label>
                      </div>
                    </div>

                    {editType !== 'open_text' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-300">Options</label>
                          {editType === 'multiple_choice' && (
                            <button type="button" onClick={addEditOption} className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                              + Add Option
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {editOptions.map((o, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                              <input
                                type="text"
                                value={o.label}
                                onChange={e => updateEditOption(idx, 'label', e.target.value)}
                                placeholder="Label"
                                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                              />
                              <input
                                type="text"
                                value={o.value}
                                onChange={e => updateEditOption(idx, 'value', e.target.value)}
                                placeholder="Value"
                                className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-amber-500"
                              />
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Pts</span>
                                <input
                                  type="number"
                                  value={o.points}
                                  onChange={e => updateEditOption(idx, 'points', parseInt(e.target.value) || 0)}
                                  className="w-14 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs text-center focus:border-amber-500"
                                />
                              </div>
                              {editType === 'multiple_choice' && editOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeEditOption(idx)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(q.id)}
                        disabled={savingEdit || !editText.trim()}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50"
                      >
                        {savingEdit ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-only card */
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                        <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">{q.type.replace('_', ' ')}</span>
                        {q.isQualifying && <span className="px-1.5 py-0.5 bg-blue-900 text-blue-400 text-xs rounded">qualifying</span>}
                        {!q.isRequired && <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">optional</span>}
                      </div>
                      <p className="text-white font-medium">{q.text}</p>
                      {q.options && (q.options as QuestionOption[]).length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(q.options as QuestionOption[]).map((o, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-950 border border-gray-800 rounded text-xs text-gray-400">
                              {o.label} ({o.points} pts)
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(q)}
                        className="p-1.5 text-gray-500 hover:text-amber-400"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveQuestion(i, 'up')}
                        disabled={i === 0}
                        className="p-1.5 text-gray-500 hover:text-gray-300 disabled:text-gray-700"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveQuestion(i, 'down')}
                        disabled={i === questions.length - 1}
                        className="p-1.5 text-gray-500 hover:text-gray-300 disabled:text-gray-700"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Question Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-4">Add Question</h2>
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Question Text <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="e.g. Do you currently have a documented marketing strategy?"
                required
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as typeof type)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="yes_no">Yes / No</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="open_text">Open Text</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={e => setIsRequired(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm text-gray-300">Required</span>
                </label>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2.5 group relative">
                  <input
                    type="checkbox"
                    checked={isQualifying}
                    onChange={e => setIsQualifying(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-sm text-gray-300">Qualifying</span>
                  <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-56 bg-gray-800 text-gray-300 text-xs rounded-lg px-3 py-2 border border-gray-700">
                    Qualifying questions aren't scored — used for lead qualification
                  </span>
                </label>
              </div>
            </div>

            {/* Options editor */}
            {type !== 'open_text' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300">Options</label>
                  {type === 'multiple_choice' && (
                    <button type="button" onClick={addOption} className="text-xs text-amber-400 hover:text-amber-300 font-medium">
                      + Add Option
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2">
                      <input
                        type="text"
                        value={o.label}
                        onChange={e => updateOption(i, 'label', e.target.value)}
                        placeholder="Label"
                        className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                      />
                      <input
                        type="text"
                        value={o.value}
                        onChange={e => updateOption(i, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:border-amber-500"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Pts</span>
                        <input
                          type="number"
                          value={o.points}
                          onChange={e => updateOption(i, 'points', parseInt(e.target.value) || 0)}
                          className="w-14 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs text-center focus:border-amber-500"
                        />
                      </div>
                      {type === 'multiple_choice' && options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(i)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={saving || !text.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add Question'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
