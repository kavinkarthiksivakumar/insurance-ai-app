import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

// Country codes for 50+ countries
const COUNTRY_CODES = [
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫', maxLength: 9 },
    { code: '+355', country: 'Albania', flag: '🇦🇱', maxLength: 9 },
    { code: '+213', country: 'Algeria', flag: '🇩🇿', maxLength: 9 },
    { code: '+54', country: 'Argentina', flag: '🇦🇷', maxLength: 10 },
    { code: '+61', country: 'Australia', flag: '🇦🇺', maxLength: 9 },
    { code: '+43', country: 'Austria', flag: '🇦🇹', maxLength: 10 },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭', maxLength: 8 },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', maxLength: 10 },
    { code: '+32', country: 'Belgium', flag: '🇧🇪', maxLength: 9 },
    { code: '+55', country: 'Brazil', flag: '🇧🇷', maxLength: 11 },
    { code: '+1', country: 'Canada', flag: '🇨🇦', maxLength: 10 },
    { code: '+56', country: 'Chile', flag: '🇨🇱', maxLength: 9 },
    { code: '+86', country: 'China', flag: '🇨🇳', maxLength: 11 },
    { code: '+57', country: 'Colombia', flag: '🇨🇴', maxLength: 10 },
    { code: '+506', country: 'Costa Rica', flag: '🇨🇷', maxLength: 8 },
    { code: '+385', country: 'Croatia', flag: '🇭🇷', maxLength: 9 },
    { code: '+420', country: 'Czech Republic', flag: '🇨🇿', maxLength: 9 },
    { code: '+45', country: 'Denmark', flag: '🇩🇰', maxLength: 8 },
    { code: '+20', country: 'Egypt', flag: '🇪🇬', maxLength: 10 },
    { code: '+358', country: 'Finland', flag: '🇫🇮', maxLength: 10 },
    { code: '+33', country: 'France', flag: '🇫🇷', maxLength: 9 },
    { code: '+49', country: 'Germany', flag: '🇩🇪', maxLength: 11 },
    { code: '+30', country: 'Greece', flag: '🇬🇷', maxLength: 10 },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰', maxLength: 8 },
    { code: '+36', country: 'Hungary', flag: '🇭🇺', maxLength: 9 },
    { code: '+354', country: 'Iceland', flag: '🇮🇸', maxLength: 7 },
    { code: '+91', country: 'India', flag: '🇮🇳', maxLength: 10 },
    { code: '+62', country: 'Indonesia', flag: '🇮🇩', maxLength: 11 },
    { code: '+98', country: 'Iran', flag: '🇮🇷', maxLength: 10 },
    { code: '+964', country: 'Iraq', flag: '🇮🇶', maxLength: 10 },
    { code: '+353', country: 'Ireland', flag: '🇮🇪', maxLength: 9 },
    { code: '+972', country: 'Israel', flag: '🇮🇱', maxLength: 9 },
    { code: '+39', country: 'Italy', flag: '🇮🇹', maxLength: 10 },
    { code: '+81', country: 'Japan', flag: '🇯🇵', maxLength: 10 },
    { code: '+962', country: 'Jordan', flag: '🇯🇴', maxLength: 9 },
    { code: '+254', country: 'Kenya', flag: '🇰🇪', maxLength: 10 },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼', maxLength: 8 },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾', maxLength: 10 },
    { code: '+52', country: 'Mexico', flag: '🇲🇽', maxLength: 10 },
    { code: '+212', country: 'Morocco', flag: '🇲🇦', maxLength: 9 },
    { code: '+31', country: 'Netherlands', flag: '🇳🇱', maxLength: 9 },
    { code: '+64', country: 'New Zealand', flag: '🇳🇿', maxLength: 9 },
    { code: '+234', country: 'Nigeria', flag: '🇳🇬', maxLength: 10 },
    { code: '+47', country: 'Norway', flag: '🇳🇴', maxLength: 8 },
    { code: '+968', country: 'Oman', flag: '🇴🇲', maxLength: 8 },
    { code: '+92', country: 'Pakistan', flag: '🇵🇰', maxLength: 10 },
    { code: '+51', country: 'Peru', flag: '🇵🇪', maxLength: 9 },
    { code: '+63', country: 'Philippines', flag: '🇵🇭', maxLength: 10 },
    { code: '+48', country: 'Poland', flag: '🇵🇱', maxLength: 9 },
    { code: '+351', country: 'Portugal', flag: '🇵🇹', maxLength: 9 },
    { code: '+974', country: 'Qatar', flag: '🇶🇦', maxLength: 8 },
    { code: '+40', country: 'Romania', flag: '🇷🇴', maxLength: 10 },
    { code: '+7', country: 'Russia', flag: '🇷🇺', maxLength: 10 },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', maxLength: 9 },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', maxLength: 8 },
    { code: '+27', country: 'South Africa', flag: '🇿🇦', maxLength: 9 },
    { code: '+82', country: 'South Korea', flag: '🇰🇷', maxLength: 10 },
    { code: '+34', country: 'Spain', flag: '🇪🇸', maxLength: 9 },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', maxLength: 9 },
    { code: '+46', country: 'Sweden', flag: '🇸🇪', maxLength: 9 },
    { code: '+41', country: 'Switzerland', flag: '🇨🇭', maxLength: 9 },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼', maxLength: 9 },
    { code: '+66', country: 'Thailand', flag: '🇹🇭', maxLength: 9 },
    { code: '+90', country: 'Turkey', flag: '🇹🇷', maxLength: 10 },
    { code: '+971', country: 'UAE', flag: '🇦🇪', maxLength: 9 },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧', maxLength: 10 },
    { code: '+1', country: 'United States', flag: '🇺🇸', maxLength: 10 },
    { code: '+58', country: 'Venezuela', flag: '🇻🇪', maxLength: 10 },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳', maxLength: 10 },
];

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        countryCode: '+91', // Default to India
        phoneNumber: '',
        aadharNumber: ''
        // NOTE: No 'role' field — backend always assigns CUSTOMER for public registration
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPhone, setShowPhone] = useState(false);
    const [showAadhar, setShowAadhar] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for phone number: only allow digits up to country's max length
        if (name === 'phoneNumber') {
            const selectedCountry = COUNTRY_CODES.find(c => c.code === formData.countryCode);
            const maxLength = selectedCountry?.maxLength || 10;
            const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits
            if (digitsOnly.length <= maxLength) {
                setFormData({ ...formData, [name]: digitsOnly });
            }
        }
        // Special handling for Aadhar number: only allow digits up to 12 characters with spacing
        else if (name === 'aadharNumber') {
            const digitsOnly = value.replace(/\D/g, ''); // Remove non-digits and spaces
            if (digitsOnly.length <= 12) {
                setFormData({ ...formData, [name]: digitsOnly });
            }
        }
        else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Format Aadhar number with spaces every 4 digits (e.g., 1234 5678 9012)
    const formatAadhar = (value) => {
        if (!value) return '';
        const cleaned = value.replace(/\s/g, ''); // Remove existing spaces
        const match = cleaned.match(/.{1,4}/g); // Split into groups of 4
        return match ? match.join(' ') : cleaned;
    };

    // Password strength validation
    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        const checks = {
            minLength: password.length >= 8,
            hasUpper: /[A-Z]/.test(password),
            hasLower: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        // Calculate strength
        if (checks.minLength) strength++;
        if (checks.hasUpper) strength++;
        if (checks.hasLower) strength++;
        if (checks.hasNumber) strength++;
        if (checks.hasSpecial) strength++;

        if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500', checks };
        if (strength === 3) return { strength, label: 'Fair', color: 'bg-orange-500', checks };
        if (strength === 4) return { strength, label: 'Good', color: 'bg-yellow-500', checks };
        return { strength, label: 'Strong', color: 'bg-green-500', checks };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // Client-side password match check
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match. Please re-enter.');
            return;
        }

        // Validate password strength before sending to server
        if (passwordStrength.strength < 3) {
            setError('Password is too weak. Please follow the requirements below.');
            return;
        }

        setIsSubmitting(true);
        const fullPhoneNumber = `${formData.countryCode}${formData.phoneNumber}`;

        // Role is intentionally NOT sent — backend always assigns CUSTOMER
        const result = await register(
            formData.name,
            formData.email,
            formData.password,
            'CUSTOMER',       // explicit — no role injection from frontend
            fullPhoneNumber,
            formData.aadharNumber
        );

        setIsSubmitting(false);

        if (result.success) {
            setSuccessMessage('Account created successfully! Redirecting to login…');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            // Handle specific error types from backend
            const msg = result.message || '';
            if (msg.includes('409') || msg.toLowerCase().includes('already')) {
                setError('This email address is already registered. Please sign in or use a different email.');
            } else if (msg.includes('400') || msg.toLowerCase().includes('validation')) {
                setError('Please check all fields and try again. ' + msg);
            } else {
                setError(result.message || 'Registration failed. Please check your inputs and try again.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
            <div className="w-full max-w-md">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-center">
                        <div className="flex justify-center mb-3">
                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                <UserPlus className="text-white" size={32} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create Account</h2>
                        <p className="text-purple-100 text-sm mt-1">Join us to manage your insurance claims</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <div className="flex gap-2">
                                    {/* Country Code Selector */}
                                    <select
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={handleChange}
                                        className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition bg-white"
                                        style={{ width: '140px' }}
                                    >
                                        {COUNTRY_CODES.map((country) => (
                                            <option key={country.code + country.country} value={country.code}>
                                                {country.flag} {country.code}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Phone Number Input */}
                                    <div className="relative flex-1">
                                        <input
                                            type={showPhone ? "text" : "password"}
                                            name="phoneNumber"
                                            placeholder="••••••••••"
                                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                            value={formData.phoneNumber}
                                            onChange={handleChange}
                                            maxLength={COUNTRY_CODES.find(c => c.code === formData.countryCode)?.maxLength || 10}
                                            inputMode="numeric"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPhone(!showPhone)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPhone ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.country} - Max {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.maxLength} digits
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Card Number (12 digits)</label>
                                <div className="relative">
                                    <input
                                        type={showAadhar ? "text" : "password"}
                                        name="aadharNumber"
                                        placeholder={showAadhar ? "1234 5678 9012" : "•••• •••• ••••"}
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                        value={showAadhar ? formatAadhar(formData.aadharNumber) : formatAadhar(formData.aadharNumber).replace(/\d/g, '•')}
                                        onChange={handleChange}
                                        maxLength="14"
                                        inputMode="numeric"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAadhar(!showAadhar)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showAadhar ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password && (
                                    <div className="mt-3 space-y-2">
                                        {/* Strength Bar */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                    style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                                />
                                            </div>
                                            {passwordStrength.label && (
                                                <span className={`text-sm font-semibold ${passwordStrength.strength <= 2 ? 'text-red-600' :
                                                    passwordStrength.strength === 3 ? 'text-orange-600' :
                                                        passwordStrength.strength === 4 ? 'text-yellow-600' :
                                                            'text-green-600'
                                                    }`}>
                                                    {passwordStrength.label}
                                                </span>
                                            )}
                                        </div>

                                        {/* Requirements Checklist */}
                                        <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <p className="font-semibold text-gray-700 mb-2">Password Requirements:</p>
                                            <div className={`flex items-center gap-2 ${passwordStrength.checks?.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span>{passwordStrength.checks?.minLength ? '✓' : '○'}</span>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordStrength.checks?.hasUpper ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span>{passwordStrength.checks?.hasUpper ? '✓' : '○'}</span>
                                                <span>One uppercase letter (A-Z)</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordStrength.checks?.hasLower ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span>{passwordStrength.checks?.hasLower ? '✓' : '○'}</span>
                                                <span>One lowercase letter (a-z)</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordStrength.checks?.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span>{passwordStrength.checks?.hasNumber ? '✓' : '○'}</span>
                                                <span>One number (0-9)</span>
                                            </div>
                                            <div className={`flex items-center gap-2 ${passwordStrength.checks?.hasSpecial ? 'text-green-600' : 'text-gray-500'}`}>
                                                <span>{passwordStrength.checks?.hasSpecial ? '✓' : '○'}</span>
                                                <span>One special character (!@#$%^&*)</span>
                                            </div>
                                        </div>

                                        {/* Password Guidelines - Show when password is weak or fair */}
                                        {passwordStrength.strength < 4 && (
                                            <div className="text-xs bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                <p className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
                                                    💡 Tips for a Strong Password:
                                                </p>
                                                <ul className="space-y-1 text-blue-700">
                                                    <li>• Mix uppercase and lowercase letters (e.g., MyPassword123!)</li>
                                                    <li>• Include numbers in the middle, not just at the end</li>
                                                    <li>• Use special characters like @, #, $, %, &, *</li>
                                                    <li>• Avoid common words or personal information</li>
                                                    <li>• Make it at least 12 characters for extra security</li>
                                                    <li>• Example: Secure@Pass2024!</li>
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                                )}
                                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                    <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                                )}
                            </div>

                            {/* Role note — informational only, cannot be changed by user */}
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                                <span className="text-blue-600 text-sm">🛡️</span>
                                <p className="text-xs text-blue-700">
                                    <strong>Account type:</strong> Customer — you can submit and track insurance claims after registration.
                                </p>
                            </div>

                            {successMessage && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <span>✅</span> {successMessage}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {isSubmitting ? 'Creating Account…' : 'Create Account'}
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-gray-600 text-sm">
                                Already have an account?{' '}
                                <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 text-xs mt-6">
                    Your information is secure • We protect your data
                </p>
            </div>
        </div>
    );
};

export default Register;
