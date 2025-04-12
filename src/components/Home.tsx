import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import { LineChart as ChartLine, LineChart, TrendingUp, MessageSquareText, BookOpen, Users, ArrowRight, Mail, Github, Linkedin, Twitter } from 'lucide-react';
import StockChart from './StockChart';

// Separation of the main Home component from the routing component
const HomeContent = () => {
  const navigate = useNavigate();
  const [showPremiumPopup, setShowPremiumPopup] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const features = [
    {
      icon: <ChartLine className="w-6 h-6 text-emerald-500" />,
      title: "Advanced Trading Charts",
      description: "Access professional-grade charts from TradingView, Zerodha, and Grow",
      premium: true
    },
    {
      icon: <LineChart className="w-6 h-6 text-emerald-500" />,
      title: "Technical Indicators",
      description: "Over 100+ technical indicators to analyze market trends",
      premium: true
    },
    {
      icon: <MessageSquareText className="w-6 h-6 text-emerald-500" />,
      title: "AI Trading Assistant",
      description: "24/7 AI-powered chatbot for trading insights and recommendations",
      premium: true
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: "Expert Recommendations",
      description: "Daily stock picks and analysis from our research team",
      premium: true
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would validate credentials here
    if (email && password) {
      navigate('/stockcharts');
    }
  };

  const handleGoogleLogin = () => {
    // In a real application, you would handle Google authentication here
    navigate('/stockcharts');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-emerald-500 to-teal-600">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-white" />
              <span className="ml-2 text-2xl font-bold text-white">Vector Research</span>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => setShowLoginPopup(true)} className="text-white hover:text-emerald-100">Login</button>
              <button className="bg-white text-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Master the Market with Vector Research
              </h1>
              <p className="text-emerald-50 text-xl mb-8">
                Professional-grade trading tools, AI-powered insights, and expert recommendations to help you make informed investment decisions.
              </p>
              <button 
                onClick={() => setShowPremiumPopup(true)}
                className="bg-white text-emerald-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-50 transition-colors inline-flex items-center"
              >
                Start Trading Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
            <div className="md:w-1/2 mt-10 md:mt-0">
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1000" 
                alt="Stock market analysis dashboard" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Why Choose Vector Research?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                {feature.premium && (
                  <span className="inline-block mt-3 text-sm text-emerald-600 font-medium">
                    Premium Feature
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Empowering Traders Through Education</h2>
              <p className="text-gray-600 mb-6">
                At Vector Research, we believe in democratizing financial knowledge. Our platform combines cutting-edge technology with comprehensive educational resources to help both beginners and experienced traders succeed in the stock market.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <BookOpen className="w-6 h-6 text-emerald-500 mr-3" />
                  <span>Comprehensive learning resources for all levels</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-6 h-6 text-emerald-500 mr-3" />
                  <span>Community-driven insights and discussions</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <img 
                src="https://images.unsplash.com/photo-1591696205602-2f950c417cb9?auto=format&fit=crop&q=80&w=1000" 
                alt="Person analyzing stock market data" 
                className="rounded-lg shadow-xl w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Choose Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <p className="text-4xl font-bold mb-6">₹0/month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Basic stock information
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Limited market analysis
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Basic chatbot features
                </li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition-colors">
                Get Started
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-lg shadow-lg text-white">
              <h3 className="text-2xl font-bold mb-4">Premium</h3>
              <p className="text-emerald-50 mb-6">For serious traders</p>
              <p className="text-4xl font-bold mb-6">₹3.14L/month</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  All Free features
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  TradingView, Zerodha & Grow charts
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Advanced indicators
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Premium AI chatbot
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span>
                  Expert recommendations
                </li>
              </ul>
              <button 
                onClick={() => setShowPremiumPopup(true)}
                className="w-full bg-white text-emerald-600 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-500" />
                <span className="ml-2 text-2xl font-bold">Vector Research</span>
              </div>
              <p className="text-gray-400">
                Empowering traders with advanced tools and insights for better investment decisions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-6 h-6" />
                </a>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Subscribe to our newsletter</h4>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="bg-gray-800 text-white px-4 py-2 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button className="bg-emerald-500 px-4 py-2 rounded-r-lg hover:bg-emerald-600 transition-colors">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">© 2025 Vector Research. All rights reserved.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Premium Popup */}
      {showPremiumPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Upgrade to Premium</h3>
            <p className="text-gray-600 mb-6">
              Scan the QR code below or use Google Pay to complete your payment.
            </p>
            <div className="bg-gray-100 p-4 rounded-lg text-center mb-6">
              <p className="text-lg font-semibold">Amount: ₹3.14L/month</p>
              {/* QR code placeholder */}
              <div className="w-48 h-48 bg-gray-200 mx-auto my-4 flex items-center justify-center">
                <TrendingUp className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">Scan with any UPI app</p>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowPremiumPopup(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-6">Welcome Back</h3>
            
            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center mb-4"
            >
              <Mail className="w-5 h-5 mr-2" />
              Continue with Google
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Remember me</label>
                  </div>
                  <a href="#" className="text-sm text-emerald-600 hover:text-emerald-500">Forgot password?</a>
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="#" className="text-emerald-600 hover:text-emerald-500 font-medium">
                  Sign up
                </a>
              </p>
            </div>

            <button 
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Home component with routing
const Home = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeContent />} />
        <Route path="/stockcharts" element={<StockChart />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default Home;