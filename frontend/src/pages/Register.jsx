import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/App";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      return;
    }
    setLoading(true);
    const success = await register(email, password, name);
    setLoading(false);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12 bg-white dark:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto w-full"
        >
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-8 font-mono"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center">
              <span className="font-mono text-white font-bold text-lg">E2</span>
            </div>
            <span className="font-mono font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              SlabDesign
            </span>
          </div>

          <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Start designing slabs to Eurocode 2
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-xs uppercase tracking-widest">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                data-testid="register-name-input"
                className="font-mono border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-sm h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@example.com"
                required
                data-testid="register-email-input"
                className="font-mono border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-sm h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase tracking-widest">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  data-testid="register-password-input"
                  className="font-mono border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-sm h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm h-12"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-center text-white"
        >
          <h2 className="font-mono text-3xl font-bold mb-6">
            Professional Slab Design
          </h2>
          <ul className="text-left space-y-4 max-w-sm mx-auto">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-blue-100">One-way, two-way, and flat slab design</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-blue-100">Automatic ULS and SLS checks</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-blue-100">Detailed PDF calculation reports</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm">✓</span>
              </div>
              <span className="text-blue-100">Save and manage multiple projects</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
