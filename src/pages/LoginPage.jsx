import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { MapIcon } from '@heroicons/react/24/outline';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.loginUser(email, password);
            const { user, token } = response.data || response;

            if (!user || !token) {
                throw new Error('Invalid response from server');
            }

            login(user, token);
            navigate('/events');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
            {/* Abstract Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 dark:bg-indigo-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 dark:bg-purple-600/20 rounded-full blur-[100px]" />

            <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl z-10 transition-colors duration-300 text-slate-900 dark:text-white">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className="p-2 w-fit h-10 bg-transparent rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" />
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-400 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">EventFlow</h1>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600"
                            placeholder="organizer@eventflow.com"
                            required
                            disabled={loading}
                            style={{color: '#111827'}}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            style={{color: '#111827'}}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Authenticating...' : 'Access Dashboard'}
                    </button>
                </form>

                {/* Register as Organizer Link */}
                <div className="mt-6 text-center">
                    <span className="text-slate-700 dark:text-slate-400 text-sm">Don't have an account?</span>
                    <button
                        type="button"
                        className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold underline text-sm"
                        onClick={() => navigate('/register-organizer')}
                    >
                        Register as Organizer
                    </button>
                </div>
            </div>
            
            {/* Theme toggle floating button - fixed at viewport corner */}
            <ThemeToggleButton />
        </div>
    );
};

export default LoginPage;