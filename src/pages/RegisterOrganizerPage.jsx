import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';

const RegisterOrganizerPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.registerAsOrganizer({ name, email, password, phoneNumber });
      const user = response?.user || (response?.data && response.data.user);
      if (user) {
        setSuccess('Organizer berhasil didaftarkan!');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        throw new Error('Respon server tidak valid');
      }
    } catch (err) {
      if (err.message) {
        setError(err.message);
      } else if (err.response?.message) {
        setError(err.response.message);
      } else if (err.response?.error) {
        setError(err.response.error);
      } else {
        setError('Registrasi gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 dark:bg-indigo-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 dark:bg-purple-600/20 rounded-full blur-[100px]" />
      
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md shadow-2xl z-10 transition-colors duration-300">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="EventFlow Logo" className="h-10 w-10" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-400 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Register Organizer</h1>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm text-center">{success}</div>
        )}
        
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-gray-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all" 
              placeholder="John Doe" 
              required 
              disabled={loading} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white disabled:text-black dark:disabled:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-black dark:placeholder:text-slate-600 transition-all"
                placeholder="organizer@eventflow.com" 
                required 
                disabled={loading} 
              />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all" 
                placeholder="password123" 
                required 
                disabled={loading} 
              />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-2">Phone Number</label>
              <input 
                type="text" 
                value={phoneNumber} 
                onChange={e => setPhoneNumber(e.target.value)} 
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-slate-600 transition-all" 
                placeholder="081234567890" 
                disabled={loading} 
              />
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-indigo-600 dark:bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register as Organizer'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <span className="text-slate-700 dark:text-slate-400 text-sm">Already have an account?</span>
          <button 
            className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold underline text-sm" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </div>
      
      {/* Theme toggle floating button - fixed at viewport corner */}
      <ThemeToggleButton />
    </div>
  );
};

export default RegisterOrganizerPage;