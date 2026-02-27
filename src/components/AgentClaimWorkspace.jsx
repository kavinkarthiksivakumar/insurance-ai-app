import React, { useState, useEffect } from 'react';
import {
    FileText, Image, Download, Shield, CheckCircle, XCircle, AlertTriangle,
    User, Phone, Mail, CreditCard, ChevronDown, ChevronUp, Loader,
    Eye, FileSearch, ShieldCheck, ShieldAlert, ShieldOff, Edit3, Check, X
} from 'lucide-react';
import { getDocuments, getDocumentUrl } from '../api/documentsApi';
import { triggerFraudAnalysis, getFraudAnalysis } from '../api/fraudApi';
import { verifyDescription, updateClaimStatus } from '../api/claimsApi';

// ─── ClaimVision AI Result Card ────────────────────────────────────────
const ClaimVisionResult = ({ result }) => {
    if (!result || result.analyzed === false) return null;

    const statusConfig = {
        GENUINE: {
            icon: <ShieldCheck size={28} className="text-green-500" />,
            bg: 'from-green-50 to-emerald-50',
            border: 'border-green-300',
            badge: 'bg-green-100 text-green-800',
            label: 'GENUINE',
            bar: 'bg-green-500',
        },
        SUSPICIOUS: {
            icon: <ShieldAlert size={28} className="text-amber-500" />,
            bg: 'from-amber-50 to-yellow-50',
            border: 'border-amber-300',
            badge: 'bg-amber-100 text-amber-800',
            label: 'SUSPICIOUS',
            bar: 'bg-amber-500',
        },
        FRAUD: {
            icon: <ShieldOff size={28} className="text-red-500" />,
            bg: 'from-red-50 to-rose-50',
            border: 'border-red-300',
            badge: 'bg-red-100 text-red-800',
            label: 'FRAUD DETECTED',
            bar: 'bg-red-500',
        },
    };

    const cfg = statusConfig[result.imageStatus] || statusConfig.SUSPICIOUS;
    const score = result.fraudScore ?? 0;

    return (
        <div className={`rounded-2xl border-2 ${cfg.border} bg-gradient-to-br ${cfg.bg} p-6 shadow-lg`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">{cfg.icon}</div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">ClaimVision AI™ Verdict</p>
                        <p className="text-2xl font-extrabold text-gray-900">{cfg.label}</p>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${cfg.badge}`}>
                    Score: {score}%
                </span>
            </div>

            {/* Fraud score bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Fraud Risk Score</span>
                    <span>{score}% / 100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`${cfg.bar} h-3 rounded-full transition-all duration-700`}
                        style={{ width: `${score}%` }}
                    />
                </div>
            </div>

            {/* Confidence */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Model Confidence</p>
                    <p className="text-lg font-bold text-gray-800">{result.confidence ?? '—'}%</p>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Image Status</p>
                    <p className="text-lg font-bold text-gray-800">{result.imageStatus || '—'}</p>
                </div>
            </div>

            {/* Remarks */}
            {result.remarks && (
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AI Remarks</p>
                    <p className="text-gray-700 text-sm leading-relaxed">{result.remarks}</p>
                </div>
            )}
        </div>
    );
};

// ─── File Collection Center ─────────────────────────────────────────────
const FileCollectionCenter = ({ claimId, documents }) => {
    const getIcon = (fileType) => {
        if (fileType?.startsWith('image/')) return <Image size={24} className="text-blue-500" />;
        return <FileText size={24} className="text-gray-500" />;
    };

    const getTypeBadge = (fileType) => {
        if (fileType?.startsWith('image/')) return 'bg-blue-100 text-blue-700';
        if (fileType === 'application/pdf') return 'bg-red-100 text-red-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                        <FileSearch size={22} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">📁 File Collection Center</h3>
                        <p className="text-xs text-gray-500">All documents submitted with this claim</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-semibold">
                    {documents?.length || 0} files
                </span>
            </div>

            {documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <a
                            key={doc.id || doc.documentName}
                            href={getDocumentUrl(doc.fileUrl?.split('/').pop() || doc.fileName)}
                            target="_blank"
                            rel="noreferrer"
                            className="group block bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 p-4 shadow-sm hover:shadow-md"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    {getIcon(doc.fileType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-700">
                                        {doc.documentName || doc.originalName || 'Document'}
                                    </p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(doc.fileType)}`}>
                                        {doc.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                </div>
                                <Download size={14} className="text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-1" />
                            </div>
                        </a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <FileText size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No documents uploaded for this claim</p>
                </div>
            )}
        </div>
    );
};

// ─── Main AgentClaimWorkspace ───────────────────────────────────────────
const AgentClaimWorkspace = ({ claim, claimDetails, user, onApprove, onReject, onClose }) => {
    const [documents, setDocuments] = useState(claimDetails?.documents || []);
    const [fraudResult, setFraudResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiRan, setAiRan] = useState(false);
    const [agentResponse, setAgentResponse] = useState('');
    const [correctionNote, setCorrectionNote] = useState('');
    const [descVerified, setDescVerified] = useState(claimDetails?.descriptionVerified || false);
    const [verifying, setVerifying] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Load existing fraud result + documents on mount
    useEffect(() => {
        const loadExisting = async () => {
            try {
                const existing = await getFraudAnalysis(claim.id);
                if (existing?.analyzed !== false) setFraudResult(existing);
            } catch { /* no existing result */ }
        };
        loadExisting();

        if (!documents.length && claim.id) {
            import('../api/documentsApi').then(({ getDocuments }) => {
                getDocuments(claim.id).then(docs => setDocuments(docs || [])).catch(() => { });
            });
        }
    }, [claim.id]);

    const handleRunClaimVision = async () => {
        setAiLoading(true);
        try {
            const result = await triggerFraudAnalysis(claim.id);
            setFraudResult(result);
            setAiRan(true);
        } catch (err) {
            alert('ClaimVision AI analysis failed: ' + err.message);
        } finally {
            setAiLoading(false);
        }
    };

    const handleVerifyDescription = async () => {
        setVerifying(true);
        try {
            await verifyDescription(claimDetails?.id || claim.id);
            setDescVerified(true);
        } catch (err) {
            alert('Verification failed: ' + err.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleDecision = async (decision) => {
        if (!agentResponse.trim()) {
            alert('Please write a response to the customer before ' + decision.toLowerCase() + 'ing.');
            return;
        }
        setActionLoading(true);
        try {
            if (decision === 'APPROVE') await onApprove(claim.id, agentResponse.trim());
            else await onReject(claim.id, agentResponse.trim());
            onClose();
        } catch (err) {
            alert('Action failed: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const isPending = claim.status !== 'APPROVED' && claim.status !== 'REJECTED';

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 overflow-y-auto">
            <div className="min-h-screen px-4 py-8 flex justify-center">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-fit">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-t-3xl">
                        <div className="flex items-center gap-3 text-white">
                            <Shield size={28} />
                            <div>
                                <h2 className="text-xl font-bold">Agent Review Workspace</h2>
                                <p className="text-blue-200 text-sm">Policy: {claim.policyNumber} · Claim #{claim.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${claim.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                    claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                }`}>
                                {claim.status}
                            </span>
                            <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* ── Customer + Claim Details ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <User size={18} className="text-blue-600" /> Customer Information
                                </h4>
                                <div className="space-y-2 text-sm">
                                    {[
                                        { icon: <User size={14} />, label: 'Name', val: claimDetails?.customerName },
                                        { icon: <Mail size={14} />, label: 'Email', val: claimDetails?.customerEmail },
                                        { icon: <Phone size={14} />, label: 'Phone', val: claimDetails?.customerPhone },
                                        { icon: <CreditCard size={14} />, label: 'Aadhar', val: claimDetails?.customerAadhar || 'N/A' },
                                        { icon: <FileText size={14} />, label: 'Policy', val: claimDetails?.customerPolicyNumber },
                                    ].map(({ icon, label, val }) => (
                                        <div key={label} className="flex items-center gap-2 text-gray-700">
                                            <span className="text-gray-400">{icon}</span>
                                            <span className="text-gray-500 w-16 flex-shrink-0">{label}:</span>
                                            <span className="font-medium truncate">{val || '—'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Claim Details */}
                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                    <FileText size={18} className="text-blue-600" /> Claim Details
                                </h4>
                                <div className="space-y-2 text-sm mb-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Type:</span>
                                        <span className="font-semibold">{claimDetails?.claimTypeName || '—'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Amount:</span>
                                        <span className="font-bold text-xl text-gray-900">₹{claim.amount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Submitted:</span>
                                        <span>{new Date(claim.submissionDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Description + Verify */}
                                <div className="bg-white rounded-xl p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase">Description</span>
                                        {descVerified ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                                <ShieldCheck size={12} /> Verified
                                            </span>
                                        ) : (
                                            <button
                                                onClick={handleVerifyDescription}
                                                disabled={verifying}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full disabled:opacity-50 transition-colors"
                                            >
                                                <ShieldCheck size={12} />
                                                {verifying ? 'Verifying…' : 'Verify'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-sm line-clamp-4">{claimDetails?.description || 'No description provided'}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── File Collection Center ── */}
                        <FileCollectionCenter claimId={claim.id} documents={documents} />

                        {/* ── ClaimVision AI Panel ── */}
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-6 shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-600 rounded-xl">
                                        <Eye size={22} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-extrabold text-gray-900">🔬 ClaimVision AI™</h3>
                                        <p className="text-xs text-gray-500">CNN + Vision Transformer fraud detector · 98.3% accuracy</p>
                                    </div>
                                </div>
                                {isPending && (
                                    <button
                                        onClick={handleRunClaimVision}
                                        disabled={aiLoading}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-colors"
                                    >
                                        {aiLoading ? (
                                            <><Loader size={16} className="animate-spin" /> Analyzing…</>
                                        ) : (
                                            <><Eye size={16} /> {aiRan ? 'Re-Analyze' : 'Run Analysis'}</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {aiLoading && (
                                <div className="text-center py-8">
                                    <Loader size={40} className="animate-spin mx-auto text-indigo-600 mb-3" />
                                    <p className="font-semibold text-indigo-700">ClaimVision AI is analyzing documents…</p>
                                    <p className="text-sm text-gray-500 mt-1">CNN + ViT model processing images</p>
                                </div>
                            )}

                            {!aiLoading && fraudResult && <ClaimVisionResult result={fraudResult} />}

                            {!aiLoading && !fraudResult && (
                                <div className="text-center py-8 text-gray-400">
                                    <Shield size={40} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No AI analysis yet</p>
                                    <p className="text-sm">Click "Run Analysis" to cross-check documents with ClaimVision AI™</p>
                                </div>
                            )}
                        </div>

                        {/* ── Manual Correction Note ── */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-5">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                                <Edit3 size={18} className="text-gray-500" /> Manual Correction Notes (Internal)
                            </h4>
                            <textarea
                                value={correctionNote}
                                onChange={(e) => setCorrectionNote(e.target.value)}
                                placeholder="Note any document discrepancies, corrections, or observations here (internal use only — not sent to customer)…"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none bg-gray-50"
                                rows="3"
                            />
                        </div>

                        {/* ── Agent Response + Decision ── */}
                        {claim.status === 'APPROVED' || claim.status === 'REJECTED' ? (
                            <div className={`rounded-2xl border-2 p-5 ${claim.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`font-bold text-lg mb-2 ${claim.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'}`}>
                                    {claim.status === 'APPROVED' ? '✓ Claim Approved' : '✗ Claim Rejected'}
                                </p>
                                {claimDetails?.agentResponse && (
                                    <p className="text-gray-700 text-sm">{claimDetails.agentResponse}</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-3">
                                    <Mail size={18} className="text-blue-600" /> Agent Decision
                                </h4>
                                <label className="block text-sm font-medium text-gray-600 mb-2">
                                    Response to Customer <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={agentResponse}
                                    onChange={(e) => setAgentResponse(e.target.value)}
                                    placeholder="Write your decision feedback here. This message will be sent to the customer…"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none mb-4"
                                    rows="4"
                                />
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => handleDecision('REJECT')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-md"
                                    >
                                        <XCircle size={18} /> Reject Claim
                                    </button>
                                    <button
                                        onClick={() => handleDecision('APPROVE')}
                                        disabled={actionLoading}
                                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors shadow-md"
                                    >
                                        <CheckCircle size={18} /> Approve Claim
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentClaimWorkspace;
