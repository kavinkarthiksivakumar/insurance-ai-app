import api from './axiosConfig';

/**
 * Login with email + password.
 * Returns the full AuthResponse: { accessToken, tokenType, role, email, name, policyNumber }
 */
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.accessToken) {
    localStorage.setItem('token', response.data.accessToken);
  }
  return response.data;
};

/**
 * Register a new user account.
 * Backend auto-generates a policyNumber for CUSTOMER role.
 */
export const register = async (name, email, password, role = 'CUSTOMER', phoneNumber, aadharNumber) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
    phoneNumber,
    aadharNumber,
  });
  return response.data;
};

/**
 * Removes the stored JWT token (client-side logout).
 */
export const logout = () => {
  localStorage.removeItem('token');
};

/**
 * GET /api/auth/me — fetches the current user's profile using the stored JWT.
 * Used on app startup to restore the session without re-logging in.
 * Returns: { role, email, name, policyNumber } or null on failure.
 */
export const getCurrentUserFromApi = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const response = await api.get('/auth/me');
    return response.data;
  } catch {
    // Token is stale / expired — clear it
    localStorage.removeItem('token');
    return null;
  }
};
