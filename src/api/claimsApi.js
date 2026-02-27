// Real backend Claims API - calls Spring Boot at localhost:8081
import api from './axiosConfig';

// ─── Claim Types ──────────────────────────────────────────────
export const getClaimTypes = async () => {
    const response = await api.get('/claim-types');
    return response.data;
};

// ─── Get Claims ───────────────────────────────────────────────

/**
 * GET /api/claims/my  – returns an array of the current customer's claims
 */
export const getMyClaims = async () => {
    const response = await api.get('/claims/my');
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * GET /api/claims  – returns paginated { claims, totalItems, totalPages, currentPage }
 * Accepts optional filter/pagination params.
 */
export const getAllClaims = async (params = {}) => {
    const response = await api.get('/claims', { params });
    // Backend wraps in { claims: [...], totalItems, totalPages, currentPage }
    if (response.data && Array.isArray(response.data.claims)) {
        return response.data.claims;
    }
    // Fallback: if plain array (shouldn't happen normally)
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * GET /api/claims – same as above but returns the full paginated response object
 * Used by AgentClaimWorkspace which needs totalPages etc.
 */
export const getAllClaimsPaginated = async (params = {}) => {
    const response = await api.get('/claims', { params });
    if (response.data && Array.isArray(response.data.claims)) {
        return response.data;
    }
    // If backend returned a plain array, wrap it
    const arr = Array.isArray(response.data) ? response.data : [];
    return { claims: arr, totalItems: arr.length, totalPages: 1, currentPage: 0 };
};

export const getClaimById = async (id) => {
    const response = await api.get(`/claims/${id}`);
    return response.data;
};

export const getClaimDetails = async (id) => {
    const response = await api.get(`/claims/${id}/details`);
    return response.data;
};

// ─── Create / Mutate ──────────────────────────────────────────

export const createClaim = async (claimData) => {
    const response = await api.post('/claims', claimData);
    return response.data;
};

/**
 * Approve or reject a claim.
 * status must be 'APPROVED' or 'REJECTED'.
 */
export const updateClaimStatus = async (id, status, agentResponse = '') => {
    const endpoint = status.toUpperCase() === 'APPROVED'
        ? `/claims/${id}/approve`
        : `/claims/${id}/reject`;
    const response = await api.put(endpoint, { response: agentResponse });
    return response.data;
};

export const assignAgent = async (claimId, agentId) => {
    const response = await api.put(`/claims/${claimId}/assign/${agentId}`);
    return response.data;
};

export const deleteClaim = async (id) => {
    const response = await api.delete(`/claims/${id}`);
    return response.data;
};

export const verifyDescription = async (id) => {
    const response = await api.put(`/claims/${id}/verify-description`);
    return response.data;
};

// ─── Default export for backward-compat ─────────────────────
export default {
    getMyClaims,
    getAllClaims,
    getAllClaimsPaginated,
    getClaimById,
    getClaimDetails,
    createClaim,
    updateClaimStatus,
    assignAgent,
    getClaimTypes,
    deleteClaim,
    verifyDescription,
};
