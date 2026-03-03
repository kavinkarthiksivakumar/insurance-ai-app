import React, { useState, useRef } from 'react';
import {
    Shield, ShieldCheck, ShieldAlert, ShieldOff,
    Upload, Loader, CheckCircle, AlertTriangle, XCircle,
    BarChart2, Eye, RefreshCw
} from 'lucide-react';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const verdictConfig = {
    GENUINE: {
        icon: <ShieldCheck size={32} className="text-emerald-500" />,
        label: 'GENUINE',
        bg: 'from-emerald-50 to-green-50',
        border: 'border-emerald-300',
        badge: 'bg-emerald-100 text-emerald-800',
        bar: 'bg-emerald-500',
        actionBg: 'bg-emerald-600',
        glow: 'shadow-emerald-100',
    },
    SUSPICIOUS: {
        icon: <ShieldAlert size={32} className="text-amber-500" />,
        label: 'SUSPICIOUS',
        bg: 'from-amber-50 to-yellow-50',
        border: 'border-amber-300',
        badge: 'bg-amber-100 text-amber-800',
        bar: 'bg-amber-500',
        actionBg: 'bg-amber-600',
        glow: 'shadow-amber-100',
    },
    FRAUD: {
        icon: <ShieldOff size={32} className="text-red-500" />,
        label: 'FRAUD DETECTED',
        bg: 'from-red-50 to-rose-50',
        border: 'border-red-400',
        badge: 'bg-red-100 text-red-800',
        bar: 'bg-red-500',
        actionBg: 'bg-red-600',
        glow: 'shadow-red-100',
    },
};

const categoryMeta = {
    image_manipulation: {
        label: 'Image Manipulation',
        max: 40,
        desc: 'Cloning, copy-paste, lighting & compression',
        icon: '🖼️',
    },
    metadata_tampering: {
        label: 'Metadata Tampering',
        max: 25,
        desc: 'EXIF data, software signatures, timestamps',
        icon: '📋',
    },
    deepfake_indicators: {
        label: 'Deepfake / AI Generation',
        max: 20,
        desc: 'Pixel smoothness, GAN artifacts, AI tools',
        icon: '🤖',
    },
    contextual_signals: {
        label: 'Contextual Signals',
        max: 15,
        desc: 'Document format, dimensions, file size',
        icon: '📁',
    },
};

const ActionBadge = ({ action }) => {
    const cfg = {
        APPROVE: { icon: <CheckCircle size={16} />, label: 'APPROVE', cls: 'bg-emerald-600 text-white' },
        REVIEW: { icon: <AlertTriangle size={16} />, label: 'MANUAL REVIEW', cls: 'bg-amber-500 text-white' },
        REJECT: { icon: <XCircle size={16} />, label: 'REJECT', cls: 'bg-red-600 text-white' },
    }[action] || { icon: null, label: action, cls: 'bg-gray-500 text-white' };

    return (
        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${cfg.cls}`}>
            {cfg.icon}
            Recommended: {cfg.label}
        </span>
    );
};

/* ─── Score breakdown bar ─────────────────────────────────────────────────── */
const BreakdownBar = ({ category, score, verdictBar }) => {
    const meta = categoryMeta[category];
    const pct = meta ? Math.round((score / meta.max) * 100) : 0;
    return (
        <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{meta?.icon || '📌'}</span>
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate mr-2">
                        {meta?.label || category}
                    </span>
                    <span className="text-xs font-bold text-gray-600 flex-shrink-0">
                        {score}<span className="text-gray-400 font-normal">/{meta?.max || '?'}</span>
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-700 ${verdictBar}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{meta?.desc}</p>
            </div>
        </div>
    );
};

/* ─── Result display ─────────────────────────────────────────────────────── */
const VerifyResult = ({ result }) => {
    const cfg = verdictConfig[result.verdict] || verdictConfig.SUSPICIOUS;
    const score = result.fraud_score ?? 0;
    const pct = score;
    const confidencePct = Math.round((result.confidence ?? 0) * 100);

    return (
        <div className={`rounded-2xl border-2 ${cfg.border} bg-gradient-to-br ${cfg.bg} p-5 shadow-lg ${cfg.glow}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">{cfg.icon}</div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Fraud Verdict
                        </p>
                        <p className="text-2xl font-extrabold text-gray-900">{cfg.label}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-extrabold text-gray-900">{score}
                        <span className="text-sm font-normal text-gray-400">/100</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Fraud Score</p>
                </div>
            </div>

            {/* Overall score bar */}
            <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Fraud Risk</span>
                    <span>{pct}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className={`h-4 rounded-full transition-all duration-700 ${cfg.bar}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0 — Genuine</span>
                    <span>100 — Definite Fraud</span>
                </div>
            </div>

            {/* 4 Category Breakdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart2 size={14} className="text-indigo-500" />
                    <p className="text-[10px] font-bold uppercase text-gray-500 tracking-widest">
                        Risk Breakdown
                    </p>
                </div>
                <div className="space-y-3">
                    {Object.entries(result.risk_breakdown || {}).map(([cat, val]) => (
                        <BreakdownBar key={cat} category={cat} score={val} verdictBar={cfg.bar} />
                    ))}
                </div>
            </div>

            {/* Confidence + Action */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                    <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Confidence</p>
                    <p className="text-xl font-bold text-gray-800">{confidencePct}<span className="text-sm font-normal text-gray-400">%</span></p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${confidencePct}%` }} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm flex flex-col items-center justify-center">
                    <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide">System Decision</p>
                    <ActionBadge action={result.recommended_action} />
                </div>
            </div>
        </div>
    );
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
const FraudVerificationPanel = ({
    /** Optional pre-loaded result from a previous analysis (from DB) */
    existingResult = null,
    /** Optional: if provided, the panel will call this and use the returned result (agent workspace mode) */
    onAnalyzeFile = null,
    /** Title shown in the panel header */
    title = 'Structured Fraud Verification',
    /** Whether direct upload to AI service is allowed */
    allowDirectUpload = true,
}) => {
    const [result, setResult] = useState(existingResult);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileName, setFileName] = useState(null);
    const fileRef = useRef(null);

    const AI_SERVICE_URL = 'http://localhost:5000/api/fraud/verify';

    const runAnalysis = async (file) => {
        setLoading(true);
        setError(null);
        setFileName(file.name);
        try {
            if (onAnalyzeFile) {
                // Delegate to parent (e.g. agent workspace that routes through Spring Boot)
                const res = await onAnalyzeFile(file);
                setResult(res);
            } else {
                // Direct call to Python AI service
                const form = new FormData();
                form.append('image', file);
                const resp = await fetch(AI_SERVICE_URL, { method: 'POST', body: form });
                if (!resp.ok) {
                    const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
                    throw new Error(err.detail || `Request failed (${resp.status})`);
                }
                const data = await resp.json();
                setResult(data);
            }
        } catch (e) {
            setError(e.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFileInput = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, etc.)');
            return;
        }
        runAnalysis(file);
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl border-2 border-indigo-200 p-5 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl shadow-md">
                        <Shield size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-gray-900">🔍 {title}</h3>
                        <p className="text-[10px] text-gray-500">
                            4-category weighted scoring · Strict JSON output
                        </p>
                    </div>
                </div>
                {result && !loading && (
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-indigo-300 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                        <RefreshCw size={12} />
                        Re-verify
                    </button>
                )}
            </div>

            {/* Upload Zone — shown when no result yet, or while loading */}
            {(allowDirectUpload && !result) && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFileInput(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                        ${dragOver
                            ? 'border-indigo-500 bg-indigo-100'
                            : 'border-indigo-300 bg-white hover:border-indigo-500 hover:bg-indigo-50'}
                    `}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileInput(e.target.files[0])}
                    />
                    <Upload size={36} className="mx-auto mb-3 text-indigo-400" />
                    <p className="font-semibold text-gray-700 mb-1">
                        Drop a claim document here
                    </p>
                    <p className="text-xs text-gray-400">
                        JPG, PNG, WEBP · Direct AI analysis
                    </p>
                </div>
            )}

            {/* Hidden file input for re-verify */}
            {result && (
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileInput(e.target.files[0])}
                />
            )}

            {/* Loading */}
            {loading && (
                <div className="text-center py-10">
                    <Loader size={40} className="animate-spin mx-auto text-indigo-600 mb-3" />
                    <p className="font-semibold text-indigo-700">Analyzing: {fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Running 4-category fraud scoring…
                    </p>
                </div>
            )}

            {/* Error */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-3 flex items-start gap-3">
                    <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-700 text-sm">Analysis Failed</p>
                        <p className="text-xs text-red-600 mt-0.5">{error}</p>
                        <button
                            onClick={() => { setError(null); setResult(null); }}
                            className="mt-2 text-xs text-indigo-600 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && !loading && !error && <VerifyResult result={result} />}

            {/* Caption */}
            {!loading && (
                <p className="text-center text-[10px] text-gray-300 mt-3">
                    Fraud Analysis Agent · fraud_score = Σ(image_manipulation + metadata_tampering + deepfake_indicators + contextual_signals)
                </p>
            )}
        </div>
    );
};

export default FraudVerificationPanel;
