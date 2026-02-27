import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUserFromApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * On every app load / page refresh:
     * If a JWT token is found in localStorage, call GET /api/auth/me to
     * restore the user session. This is the key to "device persistence" —
     * users stay logged in across browser refreshes.
     */
    useEffect(() => {
        const restoreSession = async () => {
            const userData = await getCurrentUserFromApi();
            if (userData) {
                setUser({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    policyNumber: userData.policyNumber || null,
                });
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

    /**
     * login(email, password)
     * Calls POST /api/auth/login on the Spring Boot backend.
     * On success stores the JWT and returns the user object.
     * On failure throws an error with the server message.
     */
    const login = async (email, password) => {
        try {
            const data = await apiLogin(email, password);
            // data = { accessToken, tokenType, role, email, name, policyNumber }
            const userData = {
                name: data.name,
                email: data.email,
                role: data.role,
                policyNumber: data.policyNumber || null,
            };
            setUser(userData);
            return { success: true, user: userData };
        } catch (err) {
            const data = err.response?.data;
            const message =
                (typeof data === 'string' ? data : null) ||
                data?.message ||
                data?.error ||
                err.message ||
                'Login failed. Please check your credentials.';
            return { success: false, message };
        }
    };

    /**
     * register(name, email, password, role, phoneNumber, aadharNumber)
     * Calls POST /api/auth/register on the Spring Boot backend.
     * On success returns { success: true }.
     * On failure returns { success: false, message }.
     */
    const register = async (name, email, password, role, phoneNumber, aadharNumber) => {
        try {
            await apiRegister(name, email, password, role || 'CUSTOMER', phoneNumber, aadharNumber);
            return { success: true };
        } catch (err) {
            const data = err.response?.data;
            const message =
                (typeof data === 'string' ? data : null) ||
                data?.message ||
                data?.error ||
                err.message ||
                'Registration failed. Please try again.';
            return { success: false, message };
        }
    };

    /**
     * logout()
     * Removes the JWT from localStorage and clears the in-memory user state.
     */
    const logout = () => {
        apiLogout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
