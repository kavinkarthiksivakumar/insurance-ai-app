// Real backend Documents API - calls Spring Boot at localhost:8081
import api from './axiosConfig';

const BACKEND_BASE = 'http://localhost:8081';

/**
 * Upload a file for a given claim.
 * POST /api/claims/{claimId}/documents   (multipart/form-data)
 */
export const uploadDocument = async (claimId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/claims/${claimId}/documents`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Get all documents for a given claim.
 * GET /api/claims/{claimId}/documents
 */
export const getDocuments = async (claimId) => {
    const response = await api.get(`/claims/${claimId}/documents`);
    return Array.isArray(response.data) ? response.data : [];
};

/**
 * Build the URL to directly download/preview a document stored on the backend.
 * GET /api/documents/{fileName}
 */
export const getDocumentUrl = (fileName) => {
    if (!fileName) return null;
    return `${BACKEND_BASE}/api/documents/${encodeURIComponent(fileName)}`;
};

export default {
    uploadDocument,
    getDocuments,
    getDocumentUrl,
};
