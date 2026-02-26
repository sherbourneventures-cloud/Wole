import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_struct-request/artifacts/3aj34l5d_logo.png";

export default function AdminLoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.name) {
          toast.error('Please enter your name');
          setLoading(false);
          return;
        }
        await register(formData.email, formData.password, formData.name);
        toast.success('Registration successful!');
      } else {
        await login(formData.email, formData.password);
        toast.success('Login successful!');
      }
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" data-testid="admin-login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200 p-8">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <img src={LOGO_URL} alt="SL&A Logo" className="h-10 w-auto" />
              <div className="text-left">
                <p className="font-heading font-bold text-slate-900 text-sm leading-none">Segun Labiran</p>
                <p className="font-heading font-bold text-slate-900 text-sm leading-none">& Associates</p>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRegister ? 'Create Admin Account' : 'Admin Login'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {isRegister ? 'Set up your administrator account' : 'Sign in to manage your website'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            {isRegister && (
              <div>
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Admin Name"
                  className="h-12 rounded-sm border-slate-300"
                  data-testid="input-name"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@slaengineering.com"
                className="h-12 rounded-sm border-slate-300"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-12 rounded-sm border-slate-300"
                data-testid="input-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-sm h-12"
              data-testid="submit-btn"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
              {isRegister ? <UserPlus className="ml-2 h-4 w-4" /> : <LogIn className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              {isRegister ? 'Already have an account? Sign in' : 'First time? Create admin account'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
              ← Back to Website
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
