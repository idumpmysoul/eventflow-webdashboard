import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
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
        <div className="h-screen w-screen bg-background">
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background p-4">
            <div className="max-w-md w-full bg-card dark:bg-dark-card p-8 rounded-xl shadow-lg border border-border dark:border-dark-border">
                <div className="text-center mb-8">
                    <img src="/logo2.svg" alt="EventFlow Logo" className=" w-auto h-12 text-primary mx-auto mb-2" />
                    <h1 className="text-3xl font-bold text-foreground dark:text-dark-foreground">Organizer Dashboard</h1>
                    <p className="text-muted-foreground dark:text-dark-muted-foreground mt-2">Real-time Event Operations</p>
                </div>

                {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 rounded-lg">
                    <p className="font-medium text-center">{error}</p>
                </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground dark:text-dark-muted-foreground mb-2">
                    Email Address
                    </label>
                    <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-border dark:border-dark-border rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                    required
                    disabled={loading}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground dark:text-dark-muted-foreground mb-2">
                    Password
                    </label>
                    <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-border dark:border-dark-border rounded-lg bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                    required
                    disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-2.5 rounded-lg transition duration-200"
                >
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                </form>
            </div>
        </div>
        <ThemeToggleButton />
        </div>
    );
};

export default LoginPage;