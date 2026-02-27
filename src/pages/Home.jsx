import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, Clock, CheckCircle, Phone, Mail, Users, Award, TrendingUp, Lock, Calendar, MapPin, X } from 'lucide-react';

const Home = () => {
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({
        name: '',
        email: '',
        phone: '',
        branch: '',
        date: '',
        time: '',
        purpose: ''
    });

    const branches = [
        { id: 1, name: 'Mumbai Central', address: 'Andheri East, Mumbai - 400069' },
        { id: 2, name: 'Delhi NCR', address: 'Connaught Place, New Delhi - 110001' },
        { id: 3, name: 'Bangalore Tech Park', address: 'Whitefield, Bangalore - 560066' },
        { id: 4, name: 'Chennai T-Nagar', address: 'T-Nagar, Chennai - 600017' },
        { id: 5, name: 'Pune Koregaon Park', address: 'Koregaon Park, Pune - 411001' },
        { id: 6, name: 'Hyderabad Banjara Hills', address: 'Banjara Hills, Hyderabad - 500034' },
        { id: 7, name: 'Kolkata Park Street', address: 'Park Street, Kolkata - 700016' },
        { id: 8, name: 'Ahmedabad S.G. Highway', address: 'S.G. Highway, Ahmedabad - 380015' }
    ];

    const handleAppointmentChange = (e) => {
        const { name, value } = e.target;
        setAppointmentForm({ ...appointmentForm, [name]: value });
    };

    const handleAppointmentSubmit = (e) => {
        e.preventDefault();
        alert(`Appointment request sent!\n\nBranch: ${branches.find(b => b.id === parseInt(appointmentForm.branch))?.name}\nDate: ${appointmentForm.date}\nTime: ${appointmentForm.time}\n\nOur team will confirm your appointment shortly via email/phone.`);
        setShowAppointmentModal(false);
        setAppointmentForm({
            name: '',
            email: '',
            phone: '',
            branch: '',
            date: '',
            time: '',
            purpose: ''
        });
    };

    const stats = [
        { number: '50,000+', label: 'Claims Processed', icon: FileText },
        { number: '98%', label: 'Customer Satisfaction', icon: Award },
        { number: '24hrs', label: 'Average Processing Time', icon: Clock },
        { number: '₹500Cr+', label: 'Claims Settled', icon: TrendingUp }
    ];

    const claimTypes = [
        {
            title: 'Motor Claims',
            description: 'Keeping two keys of your vehicle is quite sensible if that is why we have endeavored to come up with a convenient and simple claims process which ensures quick claim processing minus the hassle.',
            icon: '🚗',
            features: ['24/7 Support', 'Cashless Repair', 'Fast Approval']
        },
        {
            title: 'Commercial Claims',
            description: 'Unforeseen circumstances can strike at any time and cause your business to suffer heavy losses. With this in mind, we offer the most efficient and timely assistance for your commercial claims.',
            icon: '🏢',
            features: ['Business Coverage', 'Loss Protection', 'Quick Settlement']
        },
        {
            title: 'Health Claims',
            description: 'Health insurance claim services providing comprehensive medical coverage and hospitalization support with transparent processes and quick reimbursements.',
            icon: '⚕️',
            features: ['Cashless Treatment', 'Network Hospitals', 'Quick Approval']
        },
        {
            title: 'Travel Claims',
            description: 'Travel insurance claims for trip cancellations, lost baggage, medical emergencies abroad, and other travel-related incidents with global assistance.',
            icon: '✈️',
            features: ['Global Coverage', 'Emergency Support', '24/7 Assistance']
        },
        {
            title: 'Home Claims',
            description: 'Comprehensive home insurance claim support for property damage, theft, natural disasters, and other residential incidents with quick processing.',
            icon: '🏠',
            features: ['Property Protection', 'Natural Disaster Cover', 'Theft Coverage']
        },
        {
            title: 'Life Claims',
            description: 'Life insurance claim assistance providing financial security to your loved ones with transparent processes and compassionate support during difficult times.',
            icon: '❤️',
            features: ['Family Protection', 'Death Benefit', 'Rider Benefits']
        }
    ];

    const claimProcess = [
        {
            step: '01',
            title: 'Register Account',
            description: 'Create your secure account with basic details and policy information',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            step: '02',
            title: 'Submit Claim',
            description: 'Fill out comprehensive claim form with incident details and documentation',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            step: '03',
            title: 'Verification',
            description: 'Our team reviews and verifies submitted documents and information',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            step: '04',
            title: 'Processing',
            description: 'Claim is processed and assigned to specialized claims handler',
            color: 'bg-violet-50 text-violet-600'
        },
        {
            step: '05',
            title: 'Settlement',
            description: 'Approved claims are settled directly to your account within 24-48 hours',
            color: 'bg-blue-50 text-blue-600'
        }
    ];

    const features = [
        {
            icon: Clock,
            title: 'Fast Processing',
            description: 'Industry-leading claim approval and settlement within 24-48 hours for most claims types.'
        },
        {
            icon: Lock,
            title: 'Secure & Compliant',
            description: 'Enterprise-grade security with IRDAI compliance and data protection standards.'
        },
        {
            icon: Users,
            title: 'Expert Support',
            description: 'Dedicated claims specialists available to guide you through every step of the process.'
        },
        {
            icon: CheckCircle,
            title: 'Transparent Process',
            description: 'Real-time claim tracking with complete visibility and regular status updates.'
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Professional Header/Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-3">
                            <img src="/logo.svg" alt="Insure Flow Logo" className="h-10 w-10" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Insure Flow</h1>
                                <p className="text-xs text-gray-500">Claims Management Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <a href="#about" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors hidden md:block">
                                About Us
                            </a>
                            <a href="#claims" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors hidden md:block">
                                Claim Types
                            </a>
                            <a href="#contact" className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors hidden md:block">
                                Contact
                            </a>
                            <Link
                                to="/login"
                                className="text-blue-600 hover:text-blue-700 px-4 py-2 text-sm font-semibold transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-gray-50 via-blue-50 to-white overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
                                Trusted by 50,000+ Policyholders
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                By Your Side in
                                <span className="block text-blue-600">Turbulent Times</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Secure and reliable insurance claim management with transparent processes,
                                fast approvals, and dedicated support every step of the way.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/register"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl text-center"
                                >
                                    File a Claim Now
                                </Link>
                                <button
                                    onClick={() => setShowAppointmentModal(true)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl text-center flex items-center justify-center gap-2"
                                >
                                    <Calendar size={24} />
                                    Talk Now - Book Appointment
                                </button>
                            </div>
                        </div>
                        <div className="hidden lg:block">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl opacity-10 blur-2xl"></div>
                                <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                                    <div className="grid grid-cols-2 gap-6">
                                        {stats.map((stat, idx) => (
                                            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
                                                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                                <p className="text-3xl font-bold text-gray-900">{stat.number}</p>
                                                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section for Mobile */}
            <div className="lg:hidden bg-white py-12 border-y border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
                                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-gray-900">{stat.number}</p>
                                <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Insurance Plans Section - Star Health Style */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-3">Get Insurance plans for you and your loved ones</h2>
                        <p className="text-lg text-blue-600">Health plans crafted to help you avoid medical debt and lead a healthy lifestyle</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Individual Plan */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-blue-100">
                            <h3 className="text-2xl font-bold text-blue-600 mb-2">Health Insurance for Individuals</h3>
                            <p className="text-xs text-gray-600 mb-6">IRDAI UIN : SHAHUP25057V082425</p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Coverage for unexpected medical expenses</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Tax deduction benefits Coverage for pre- and post-hospitalisation costs</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Holistic product with holistic benefits - Comprehensive Insurance Policy</p>
                                </div>
                            </div>

                            <div className="bg-white/60 rounded-xl p-4 text-center">
                                <div className="text-6xl mb-2">👨‍💼</div>
                                <Link
                                    to="/register"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>

                        {/* Family Plan */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-blue-100">
                            <h3 className="text-2xl font-bold text-blue-600 mb-2">Health Insurance for Family</h3>
                            <p className="text-xs text-gray-600 mb-6">IRDAI UIN : SHAHUP22199V062122</p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Coverage for entire family</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Affordable premiums that don't break the bank Maternity and New Born coverage</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Well-being and financial safety ensured</p>
                                </div>
                            </div>

                            <div className="bg-white/60 rounded-xl p-4 text-center">
                                <div className="text-6xl mb-2">👨‍👩‍👧‍👦</div>
                                <Link
                                    to="/register"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>

                        {/* Senior Citizens Plan */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-blue-100">
                            <h3 className="text-2xl font-bold text-blue-600 mb-2">Health Insurance for Senior Citizens</h3>
                            <p className="text-xs text-gray-600 mb-6">IRDAI UIN : SHAHUP22199V062122</p>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Well-being and financial safety ensured</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Coverage for pre-existing diseases</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Stress-free retirement</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-gray-700">Wealth of benefits to make those golden years count - Senior Citizens Red Carpet Health Insurance Policy</p>
                                </div>
                            </div>

                            <div className="bg-white/60 rounded-xl p-4 text-center">
                                <div className="text-6xl mb-2">👴👵</div>
                                <Link
                                    to="/register"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Insure Flow?</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Industry-leading claim management with cutting-edge technology and customer-centric approach
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Claim Types Section */}
            <div id="claims" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Claim Assistance</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Comprehensive claim support across all major insurance categories with specialized handlers for each type
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {claimTypes.map((type, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 border border-gray-200 group hover:border-blue-200"
                            >
                                <div className="flex items-start mb-4">
                                    <div className="text-5xl mr-4 group-hover:scale-110 transition-transform">{type.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mt-2">{type.title}</h3>
                                </div>
                                <p className="text-gray-600 leading-relaxed mb-4 text-sm">{type.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {type.features.map((feature, idx) => (
                                        <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Claim Process Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple 5-Step Claim Process</h2>
                        <p className="text-lg text-gray-600">Streamlined process designed for efficiency and transparency</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {claimProcess.map((item, index) => (
                            <div key={index} className="relative">
                                {index < claimProcess.length - 1 && (
                                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2"></div>
                                )}
                                <div className="relative bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                                    <div className={`${item.color} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 font-bold text-xl`}>
                                        {item.step}
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2 text-center">{item.title}</h4>
                                    <p className="text-sm text-gray-600 text-center leading-relaxed">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div id="contact" className="py-16 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-3">Need Assistance?</h2>
                        <p className="text-blue-100">Our dedicated support team is available 24/7 to help you</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center hover:bg-white/20 transition-colors">
                            <Phone className="h-10 w-10 mx-auto mb-4" />
                            <h3 className="font-bold mb-2">Call Us</h3>
                            <p className="text-2xl font-bold">1800-266-5844</p>
                            <p className="text-blue-100 text-sm mt-1">24/7 Helpline</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 text-center hover:bg-white/20 transition-colors">
                            <Mail className="h-10 w-10 mx-auto mb-4" />
                            <h3 className="font-bold mb-2">Email Us</h3>
                            <p className="text-2xl font-bold">support@insureflow.com</p>
                            <p className="text-blue-100 text-sm mt-1">Quick Response</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-3 mb-4">
                                <img src="/logo.svg" alt="Insure Flow Logo" className="h-9 w-9" />
                                <div>
                                    <h3 className="text-white font-bold text-lg">Insure Flow</h3>
                                    <p className="text-xs text-gray-500">Claims Management Portal</p>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed max-w-md">
                                Leading insurance claim management platform providing secure, fast, and reliable claim processing services with industry-best turnaround times.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#claims" className="hover:text-white transition-colors">Claim Types</a></li>
                                <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                                <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">IRDAI Compliance</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Grievance Redressal</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center">
                        <p className="text-sm">© 2025 Insure Flow. All rights reserved. | Regulated by IRDAI</p>
                    </div>
                </div>
            </footer>

            {/* Appointment Booking Modal */}
            {showAppointmentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-8 w-8" />
                                    <div>
                                        <h2 className="text-2xl font-bold">Book Branch Appointment</h2>
                                        <p className="text-green-100 text-sm">Schedule a visit to discuss your insurance needs</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAppointmentModal(false)}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={appointmentForm.name}
                                        onChange={handleAppointmentChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={appointmentForm.email}
                                        onChange={handleAppointmentChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={appointmentForm.phone}
                                        onChange={handleAppointmentChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="+91 98765 43210"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Branch *</label>
                                    <select
                                        name="branch"
                                        value={appointmentForm.branch}
                                        onChange={handleAppointmentChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    >
                                        <option value="">Choose a branch</option>
                                        {branches.map((branch) => (
                                            <option key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={appointmentForm.date}
                                        onChange={handleAppointmentChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
                                    <select
                                        name="time"
                                        value={appointmentForm.time}
                                        onChange={handleAppointmentChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    >
                                        <option value="">Select time</option>
                                        <option value="09:00 AM">09:00 AM</option>
                                        <option value="10:00 AM">10:00 AM</option>
                                        <option value="11:00 AM">11:00 AM</option>
                                        <option value="12:00 PM">12:00 PM</option>
                                        <option value="02:00 PM">02:00 PM</option>
                                        <option value="03:00 PM">03:00 PM</option>
                                        <option value="04:00 PM">04:00 PM</option>
                                        <option value="05:00 PM">05:00 PM</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose of Visit *</label>
                                <textarea
                                    name="purpose"
                                    value={appointmentForm.purpose}
                                    onChange={handleAppointmentChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    rows="4"
                                    placeholder="Please describe the purpose of your visit (e.g., claim discussion, policy inquiry, new insurance)..."
                                    required
                                ></textarea>
                            </div>

                            {appointmentForm.branch && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-green-600 mt-1" />
                                        <div>
                                            <p className="font-semibold text-green-900">
                                                {branches.find(b => b.id === parseInt(appointmentForm.branch))?.name}
                                            </p>
                                            <p className="text-sm text-green-700">
                                                {branches.find(b => b.id === parseInt(appointmentForm.branch))?.address}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAppointmentModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                                >
                                    Confirm Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
