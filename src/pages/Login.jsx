import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Called by both the form submit and the quick-login buttons
    const doLogin = async (e, pw) => {
        setError('');
        setIsLoading(true);
        const result = await login(e, pw);
        setIsLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Invalid credentials. Please try again.');
        }
    };

    const handleSubmit = async (evt) => {
        evt.preventDefault();
        await doLogin(email, password);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md px-6">
                {/* Back to Home */}
                <Link
                    to="/"
                    className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                {/* Login Card */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                <Shield className="text-white" size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                        <p className="text-blue-100 text-sm mt-1">Sign in to your account</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8">
                        <div className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Mail className="w-4 h-4" />
                                        <span>Email Address</span>
                                    </div>
                                </label>
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <div className="flex items-center space-x-2">
                                        <Lock className="w-4 h-4" />
                                        <span>Password</span>
                                    </div>
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Quick Login Buttons */}
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <p className="text-xs text-blue-600 font-semibold mb-2 text-center">Quick Login (Demo)</p>
                                <div className="flex gap-2">
                                    {[
                                        { label: '⚡ Customer', email: 'john@example.com', password: 'customer123', color: 'bg-green-100 hover:bg-green-200 text-green-800' },
                                        { label: '⚡ Agent', email: 'agent@example.com', password: 'agent123', color: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' },
                                        { label: '⚡ Admin', email: 'admin@example.com', password: 'admin123', color: 'bg-red-100 hover:bg-red-200 text-red-800' },
                                    ].map(({ label, email: e, password: p, color }) => (
                                        <button
                                            key={label}
                                            type="button"
                                            disabled={isLoading}
                                            onClick={async () => {
                                                setEmail(e);
                                                setPassword(p);
                                                setError('');
                                                // Auto-submit immediately — no second click needed
                                                await doLogin(e, p);
                                            }}
                                            className={`flex-1 text-xs font-semibold py-1.5 px-2 rounded-md transition-colors disabled:opacity-50 ${color}`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            {/* Register Link */}
                            <div className="text-center pt-4 border-t border-gray-200">
                                <p className="text-gray-600 text-sm">
                                    Don't have an account?{' '}
                                    <Link
                                        to="/register"
                                        className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                                    >
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    Secure login • Your data is protected
                </p>
            </div>
        </div>
    );
};

export default Login;
