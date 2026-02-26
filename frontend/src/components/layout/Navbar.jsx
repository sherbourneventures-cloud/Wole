import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_struct-request/artifacts/3aj34l5d_logo.png";

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200" data-testid="navbar">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="logo-link">
            <img 
              src={LOGO_URL} 
              alt="SL&A Logo" 
              className="h-12 w-auto"
            />
            <div className="hidden sm:block">
              <p className="font-heading font-bold text-slate-900 text-sm tracking-tight leading-none">Segun Labiran</p>
              <p className="font-heading font-bold text-slate-900 text-sm tracking-tight leading-none">& Associates</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "nav-link px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors",
                  location.pathname === link.href
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                )}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <a href="tel:+2348012345678" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
              <Phone className="h-4 w-4" />
              <span className="font-mono">+234 801 234 5678</span>
            </a>
            <Link to="/contact">
              <Button 
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-xs px-6"
                data-testid="get-quote-btn"
              >
                Get a Quote
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            data-testid="mobile-menu-btn"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200" data-testid="mobile-menu">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium uppercase tracking-widest transition-colors",
                    location.pathname === link.href
                      ? "text-slate-900 bg-slate-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="px-4 pt-4 border-t border-slate-200 mt-2">
                <Link to="/contact" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-sm font-semibold tracking-wide uppercase text-xs">
                    Get a Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
