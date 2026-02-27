import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Shield, Info } from 'lucide-react';

const FraudAnalysisCard = ({ fraudResult, compact = false }) => {
    if (!fraudResult || !fraudResult.fraudScore) {
        return null;
    }

    const { imageStatus, fraudScore, confidence, remarks, details } = fraudResult;

    // Determine color scheme based on status
    const getStatusColor = () => {
        switch (imageStatus) {
            case 'GENUINE':
                return {
                    bg: 'bg-green-50',
                    border: 'border-green-200',
                    text: 'text-green-800',
                    icon: <CheckCircle className="text-green-600" size={24} />
                };
            case 'SUSPICIOUS':
                return {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    text: 'text-yellow-800',
                    icon: <AlertTriangle className="text-yellow-600" size={24} />
                };
            case 'FRAUD':
                return {
                    bg: 'bg-red-50',
                    border: 'border-red-200',
                    text: 'text-red-800',
                    icon: <XCircle className="text-red-600" size={24} />
                };
            default:
                return {
                    bg: 'bg-gray-50',
                    border: 'border-gray-200',
                    text: 'text-gray-800',
                    icon: <Info className="text-gray-600" size={24} />
                };
        }
    };

    const colors = getStatusColor();

    // Calculate progress bar color
    const getScoreBarColor = () => {
        if (fraudScore < 30) return 'bg-green-500';
        if (fraudScore < 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (compact) {
        // Compact view for list/table display
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${colors.bg} ${colors.border}`}>
                <span className="text-lg">{colors.icon}</span>
                <div>
                    <span className={`font-semibold text-sm ${colors.text}`}>{imageStatus}</span>
                    <span className="text-xs text-gray-600 ml-2">Score: {fraudScore}</span>
                </div>
            </div>
        );
    }

    // Full detailed view
    return (
        <div className={`rounded-lg border-2 p-5 ${colors.bg} ${colors.border}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Shield className="text-blue-600" size={28} />
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">AI Fraud Analysis</h3>
                        <p className="text-sm text-gray-600">Automated image verification</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {colors.icon}
                    <span className={`font-bold text-lg ${colors.text}`}>{imageStatus}</span>
                </div>
            </div>

            {/* Fraud Score */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Fraud Probability</span>
                    <span className="text-2xl font-bold text-gray-900">{fraudScore}<span className="text-sm text-gray-500">/100</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-500 ${getScoreBarColor()}`}
                        style={{ width: `${fraudScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Confidence Level */}
            <div className="mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Confidence Level</span>
                    <span className="text-sm font-semibold text-gray-800">{confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${confidence}%` }}
                    ></div>
                </div>
            </div>

            {/* Remarks */}
            <div className={`p-4 rounded-lg ${colors.bg} border ${colors.border}`}>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Analysis Summary</h4>
                <p className="text-sm text-gray-700">{remarks || 'No detailed remarks available'}</p>
            </div>

            {/* Additional Details (collapsible or always shown) */}
            {details && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Technical Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {details.imageQuality && (
                            <div>
                                <span className="text-gray-500">Image Quality:</span>
                                <span className="ml-2 font-medium text-gray-700">{details.imageQuality}</span>
                            </div>
                        )}
                        {details.detectionMethod && (
                            <div>
                                <span className="text-gray-500">Method:</span>
                                <span className="ml-2 font-medium text-gray-700">{details.detectionMethod}</span>
                            </div>
                        )}
                        {details.metadataFlags && details.metadataFlags.length > 0 && (
                            <div className="col-span-2">
                                <span className="text-gray-500">Flags:</span>
                                <div className="mt-1 space-y-1">
                                    {details.metadataFlags.map((flag, idx) => (
                                        <div key={idx} className="text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs">
                                            ⚠️ {flag}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Recommendation Badge */}
            <div className="mt-4">
                {fraudScore < 30 && (
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                        <CheckCircle size={16} />
                        <span className="font-medium">Recommendation: Low risk, proceed with standard review</span>
                    </div>
                )}
                {fraudScore >= 30 && fraudScore < 70 && (
                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Recommendation: Medium risk, require additional verification</span>
                    </div>
                )}
                {fraudScore >= 70 && (
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                        <XCircle size={16} />
                        <span className="font-medium">Recommendation: High risk, thorough investigation required</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FraudAnalysisCard;
