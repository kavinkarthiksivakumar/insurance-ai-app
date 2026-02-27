// ClaimVision AI Fraud Detection API
// Routes through Spring Boot backend → Python AI Service (ClaimVision AI™)
import api from './axiosConfig';

/**
 * Trigger ClaimVision AI analysis via the Spring Boot backend.
 * POST /api/fraud/analyze/{claimId}
 * The backend fetches the uploaded image files and sends them to the Python AI service.
 */
export const triggerFraudAnalysis = async (claimId) => {
    const response = await api.post(`/fraud/analyze/${claimId}`);
    return { ...response.data, analyzed: true };
};

// Alias – the NewClaim page calls `analyzeClaim`, the AgentWorkspace calls `triggerFraudAnalysis`
export const analyzeClaim = triggerFraudAnalysis;

/**
 * Get stored fraud analysis result for a claim from the DB.
 * GET /api/fraud/claim/{claimId}
 */
export const getFraudResult = async (claimId) => {
    try {
        const response = await api.get(`/fraud/claim/${claimId}`);
        return response.data;
    } catch (err) {
        return { analyzed: false, message: 'No fraud analysis performed for this claim yet' };
    }
};

/**
 * Check whether the Python AI service is online.
 * GET /api/fraud/health
 */
export const checkAiServiceHealth = async () => {
    try {
        const response = await api.get('/fraud/health');
        const data = response.data;
        return {
            aiServiceAvailable: data.aiServiceAvailable ?? false,
            status: data.status || 'unknown',
            message: data.aiServiceAvailable ? 'Real AI service connected' : 'Using mock AI service (fallback mode)',
        };
    } catch {
        return {
            aiServiceAvailable: false,
            status: 'unavailable',
            message: 'Using mock AI service (fallback mode)',
        };
    }
};

// Alias for backward compatibility
export const getFraudAnalysis = getFraudResult;

export default {
    analyzeClaim,
    triggerFraudAnalysis,
    getFraudResult,
    getFraudAnalysis,
    checkAiServiceHealth,
};
