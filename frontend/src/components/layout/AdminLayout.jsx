import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, MessageSquare, FolderKanban, FileText, 
  Users, Quote, LogOut, Menu, X, ChevronRight, Home
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { Toaster } from '../ui/sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_struct-request/artifacts/3aj34l5d_logo.png";

const sidebarLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/blog', label: 'Blog Posts', icon: FileText },
  { href: '/admin/testimonials', label: 'Testimonials', icon: Quote },
  { href: '/admin/team', label: 'Team Members', icon: Users },
];

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !admin) {
      navigate('/admin/login');
    }
  }, [admin, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-layout">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-slate-200">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <img src={LOGO_URL} alt="SL&A Logo" className="h-10 w-auto" />
              <div>
                <p className="font-heading font-bold text-slate-900 text-xs leading-none">SL&A</p>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                  data-testid={`sidebar-${link.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <Home className="h-4 w-4" />
              View Website
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-500 hover:text-slate-900 w-full"
              data-testid="logout-btn"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
            data-testid="mobile-sidebar-btn"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-600">
              Welcome, <span className="font-semibold text-slate-900">{admin.name}</span>
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
};
