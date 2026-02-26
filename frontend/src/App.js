import React from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from './components/ui/sonner';
import { cn } from './lib/utils';
import { 
  LayoutDashboard, 
  PenTool,
  Info
} from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import BeamDesign from './pages/BeamDesign';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/design', label: 'Beam Design', icon: PenTool },
  ];
  
  return (
    <nav className="glass sticky top-0 z-50" data-testid="main-navigation">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="text-lg font-bold font-heading tracking-tight">
              BeamForge
            </span>
          </Link>
          
          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Right side */}
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden md:block">
              Eurocode 2 Compliant
            </span>
            <div className="w-px h-6 bg-border hidden md:block" />
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              title="About BeamForge"
              data-testid="about-btn"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <div className="App min-h-screen blueprint-grid">
      <BrowserRouter>
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/design" element={<BeamDesign />} />
            <Route path="/results/:id" element={<BeamDesign />} />
          </Routes>
        </main>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
