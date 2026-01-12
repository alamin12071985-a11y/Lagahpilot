import React, { useState } from 'react';
import { Terminal, ArrowRight, Mail, Lock, Loader2, Github, Twitter, User as UserIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

interface LoginProps {
  onRegister: () => void; // Used for switching view only
  isRegistering?: boolean;
}

const Login: React.FC<LoginProps> = ({ onRegister, isRegistering = false }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(isRegistering);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match!");
        }
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        // Profile update logic could go here
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      // AuthContext in App.tsx will handle redirection automatically
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to authenticate.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-200/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px]"></div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 relative z-10 border border-white/50">
            <div className="text-center mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-accent text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                    <Terminal size={28} />
                </div>
                <h2 className="text-3xl font-bold text-dark-DEFAULT">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="text-gray-500 mt-2 text-sm">
                    {isSignUp ? 'Join Laga Host & deploy bots in seconds' : 'Manage your bot fleet'}
                </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3 animate-fade-in">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">First Name</label>
                        <div className="relative group">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-sm" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Last Name</label>
                        <div className="relative group">
                            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-sm" />
                        </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium" />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium" />
                    </div>
                </div>

                {isSignUp && (
                    <div className="space-y-1.5 animate-fade-in">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Confirm Password</label>
                        <div className="relative group">
                            <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium" />
                        </div>
                    </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-cta-DEFAULT hover:bg-cta-hover text-cta-text font-bold py-4 rounded-xl shadow-lg shadow-cta-DEFAULT/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isSignUp ? 'Get Started' : 'Sign In'} <ArrowRight size={20} /></>}
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-brand-500 font-bold hover:underline">
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
        </div>
        <div className="mt-8 text-center">
             <button onClick={() => window.location.reload()} className="text-gray-400 text-xs hover:text-gray-600">Back to Landing Page</button>
        </div>
    </div>
  );
};

export default Login;
