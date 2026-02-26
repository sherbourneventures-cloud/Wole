import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Calculator, FileText, Shield, Layers, Grid3X3, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/App";

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Layers className="w-6 h-6" />,
      title: "ONE-WAY SLABS",
      description: "Complete design for simply supported and continuous one-way spanning slabs"
    },
    {
      icon: <Grid3X3 className="w-6 h-6" />,
      title: "TWO-WAY SLABS",
      description: "Full analysis with moment coefficients for two-way spanning slabs"
    },
    {
      icon: <Square className="w-6 h-6" />,
      title: "FLAT SLABS",
      description: "Column strip and middle strip design with punching shear checks"
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "EC2 COMPLIANT",
      description: "All calculations follow BS EN 1992-1-1 with UK National Annex"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "PDF REPORTS",
      description: "Generate detailed calculation reports with step-by-step workings"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "FULL CHECKS",
      description: "Bending, shear, deflection, crack width - all verified automatically"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-sm flex items-center justify-center">
              <span className="font-mono text-white font-bold text-lg">E2</span>
            </div>
            <span className="font-mono font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              SlabDesign
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button data-testid="nav-dashboard-btn" className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button data-testid="nav-login-btn" variant="ghost" className="font-mono uppercase tracking-wider text-sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button data-testid="nav-register-btn" className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 grid-pattern">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-block mb-6">
              <span className="font-mono text-xs uppercase tracking-widest bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-sm">
                Eurocode 2 Compliant
              </span>
            </div>
            <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
              Structural Slab Design
              <span className="text-blue-600"> Made Precise</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed max-w-2xl">
              Professional reinforced concrete slab design to BS EN 1992-1-1. 
              One-way, two-way, and flat slabs with comprehensive checks and detailed PDF reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to={isAuthenticated ? "/design/new" : "/register"}>
                <Button 
                  data-testid="hero-cta-btn"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider px-8 py-6 text-base rounded-sm"
                >
                  Start Designing <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button 
                  data-testid="hero-login-btn"
                  variant="outline" 
                  className="font-mono uppercase tracking-wider px-8 py-6 text-base rounded-sm border-2"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block absolute top-32 right-12 w-[500px]"
          >
            <div className="bg-slate-100 dark:bg-slate-800 rounded-sm p-6 border border-slate-200 dark:border-slate-700">
              <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">Design Output Preview</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">M_Ed</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">45.8 kNm/m</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">As,req</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">628 mm²/m</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Reinforcement</span>
                  <span className="font-mono font-bold text-blue-600">T12 @ 150</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Status</span>
                  <span className="font-mono font-bold text-green-600">ALL CHECKS PASS</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Complete Design Workflow
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need to design reinforced concrete slabs to Eurocode 2
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 hover:border-blue-600 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-sm flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-mono font-bold text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-mono text-3xl font-bold tracking-tight text-white mb-4">
            Ready to Design?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Create your first slab design in minutes. Save projects and generate PDF reports.
          </p>
          <Link to={isAuthenticated ? "/design/new" : "/register"}>
            <Button 
              data-testid="cta-btn"
              className="bg-white text-blue-600 hover:bg-blue-50 font-mono uppercase tracking-wider px-8 py-6 text-base rounded-sm"
            >
              Start Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center">
              <span className="font-mono text-white font-bold text-sm">E2</span>
            </div>
            <span className="font-mono text-sm text-white">SlabDesign</span>
          </div>
          <p className="font-mono text-xs">
            Calculations to BS EN 1992-1-1:2004 + UK National Annex
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
