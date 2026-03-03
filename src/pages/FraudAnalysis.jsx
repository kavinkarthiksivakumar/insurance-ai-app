import React, { useState } from 'react';
import { Shield, Search, Upload, CheckCircle, AlertTriangle, XCircle, BarChart2, RefreshCw, Loader } from 'lucide-react';
import FraudVerificationPanel from '../components/FraudVerificationPanel';

/* ─── Quick Stats Bar ─────────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4`}>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        <div>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
    </div>
);

/* ─── History List Item ───────────────────────────────────────────────────── */
const HistoryItem = ({ item, onClick }) => {
    const verdictColor = {
        GENUINE: 'text-emerald-600 bg-emerald-50',
        SUSPICIOUS: 'text-amber-600 bg-amber-50',
        FRAUD: 'text-red-600 bg-red-50',
    }[item.verdict] || 'text-gray-600 bg-gray-50';

    return (
        <div
            onClick={() => onClick(item)}
            className="flex items-center justify-between px-5 py-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 cursor-pointer transition-all group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Upload size={14} className="text-gray-400 group-hover:text-indigo-500" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.fileName}</p>
                    <p className="text-[10px] text-gray-400">{item.timestamp}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${verdictColor}`}>
                    {item.verdict}
                </span>
                <span className="text-sm font-bold text-gray-600">{item.score}</span>
            </div>
        </div>
    );
};

/* ─── Main Page ───────────────────────────────────────────────────────────── */
const FraudAnalysis = () => {
    const [activeResult, setActiveResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const AI_SERVICE_URL = 'http://localhost:5000/api/fraud/verify';

    const analyzeFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, WEBP, etc.)');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const form = new FormData();
            form.append('image', file);
            const resp = await fetch(AI_SERVICE_URL, { method: 'POST', body: form });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
                throw new Error(err.detail || `Request failed (${resp.status})`);
            }
            const data = await resp.json();
            setActiveResult(data);

            // Add to history
            setHistory(prev => [{
                fileName: file.name,
                verdict: data.verdict,
                score: data.fraud_score,
                timestamp: new Date().toLocaleString(),
                result: data,
                id: Date.now(),
            }, ...prev.slice(0, 19)]);
        } catch (e) {
            setError(e.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    // Summary stats from history
    const totalAnalyzed = history.length;
    const fraudCount = history.filter(h => h.verdict === 'FRAUD').length;
    const suspiciousCount = history.filter(h => h.verdict === 'SUSPICIOUS').length;
    const genuineCount = history.filter(h => h.verdict === 'GENUINE').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 text-white px-8 py-8 shadow-xl">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Shield size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight">Fraud Analysis Agent</h1>
                            <p className="text-indigo-200 text-sm mt-0.5">
                                AI-powered claim document verification · 4-category structured scoring
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-5 text-xs">
                        {['Image Manipulation (0–40)', 'Metadata Tampering (0–25)', 'Deepfake Indicators (0–20)', 'Contextual Signals (0–15)'].map(cat => (
                            <span key={cat} className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full font-medium border border-white/20">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats Row */}
                {totalAnalyzed > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={<Search size={20} className="text-indigo-600" />}
                            label="Total Analyzed"
                            value={totalAnalyzed}
                            color="bg-indigo-50"
                        />
                        <StatCard
                            icon={<CheckCircle size={20} className="text-emerald-600" />}
                            label="Genuine"
                            value={genuineCount}
                            color="bg-emerald-50"
                        />
                        <StatCard
                            icon={<AlertTriangle size={20} className="text-amber-600" />}
                            label="Suspicious"
                            value={suspiciousCount}
                            color="bg-amber-50"
                        />
                        <StatCard
                            icon={<XCircle size={20} className="text-red-600" />}
                            label="Fraud"
                            value={fraudCount}
                            color="bg-red-50"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left: Upload + Result */}
                    <div className="lg:col-span-3 space-y-5">
                        {/* Drop Zone */}
                        {!activeResult && !loading && (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setDragging(false);
                                    analyzeFile(e.dataTransfer.files[0]);
                                }}
                                className={`relative border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all ${dragging
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
                                    }`}
                                onClick={() => document.getElementById('fraud-file-input').click()}
                            >
                                <input
                                    id="fraud-file-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => analyzeFile(e.target.files[0])}
                                />
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`p-5 rounded-2xl ${dragging ? 'bg-indigo-100' : 'bg-gray-100'} transition-colors`}>
                                        <Upload size={40} className={dragging ? 'text-indigo-600' : 'text-gray-400'} />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-700 mb-1">
                                            Upload claim document
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Drag & drop or click to browse · JPG, PNG, WEBP
                                        </p>
                                    </div>
                                    <div className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                                        Choose File
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading */}
                        {loading && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
                                <Loader size={48} className="animate-spin mx-auto text-indigo-600 mb-4" />
                                <p className="text-xl font-bold text-indigo-700 mb-1">Analyzing document…</p>
                                <p className="text-sm text-gray-400">
                                    Running 4-category fraud scoring engine
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {error && !loading && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
                                <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-red-800 mb-1">Analysis Failed</p>
                                    <p className="text-sm text-red-600">{error}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Make sure the AI service is running at localhost:5000
                                    </p>
                                    <button
                                        onClick={() => { setError(null); setActiveResult(null); }}
                                        className="mt-3 text-sm text-indigo-600 font-semibold underline"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Result */}
                        {activeResult && !loading && !error && (
                            <div className="space-y-3">
                                <button
                                    onClick={() => { setActiveResult(null); setError(null); }}
                                    className="flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                                >
                                    <RefreshCw size={14} />
                                    Analyze Another Document
                                </button>
                                <FraudVerificationPanel
                                    existingResult={activeResult}
                                    allowDirectUpload={false}
                                    title="Fraud Analysis Result"
                                />
                            </div>
                        )}

                        {/* Scoring legend */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <BarChart2 size={16} className="text-indigo-500" />
                                <h4 className="font-bold text-gray-800 text-sm">Scoring Reference</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { label: 'GENUINE', range: '0–29', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={14} /> },
                                    { label: 'SUSPICIOUS', range: '30–69', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle size={14} /> },
                                    { label: 'FRAUD', range: '70–100', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
                                ].map(v => (
                                    <div key={v.label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border font-semibold text-sm ${v.color}`}>
                                        {v.icon}
                                        <span>{v.label}</span>
                                        <span className="ml-auto text-xs opacity-70">{v.range}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: History */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-gray-800">Analysis History</h4>
                                {history.length > 0 && (
                                    <button
                                        onClick={() => setHistory([])}
                                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            {history.length === 0 ? (
                                <div className="text-center py-10 text-gray-300">
                                    <Search size={32} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm font-medium">No analyses yet</p>
                                    <p className="text-xs mt-1">Upload a document to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5">
                                    {history.map(item => (
                                        <HistoryItem
                                            key={item.id}
                                            item={item}
                                            onClick={(h) => setActiveResult(h.result)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info card */}
                        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                            <p className="text-xs font-bold text-indigo-700 mb-2">📌 About This Agent</p>
                            <ul className="text-[11px] text-indigo-600 space-y-1.5">
                                <li>• <strong>Image Manipulation (max 40):</strong> cloning, compression anomalies, pixel stats</li>
                                <li>• <strong>Metadata Tampering (max 25):</strong> EXIF, software signatures, timestamps</li>
                                <li>• <strong>Deepfake / AI (max 20):</strong> GAN artifacts, AI generation keywords</li>
                                <li>• <strong>Contextual Signals (max 15):</strong> format, resolution, file size</li>
                                <li className="pt-1 border-t border-indigo-200">• <code className="bg-indigo-100 px-1 rounded">fraud_score</code> = Σ all categories (0–100)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FraudAnalysis;
