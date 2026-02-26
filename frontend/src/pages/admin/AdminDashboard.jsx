import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, FolderKanban, FileText, Users, Quote, ArrowRight, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminApi } from '../../lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { 
      label: 'New Inquiries', 
      value: stats?.inquiries?.new || 0, 
      total: stats?.inquiries?.total || 0,
      icon: MessageSquare, 
      href: '/admin/inquiries',
      color: 'bg-green-100 text-green-700'
    },
    { 
      label: 'Projects', 
      value: stats?.projects || 0, 
      icon: FolderKanban, 
      href: '/admin/projects',
      color: 'bg-blue-100 text-blue-700'
    },
    { 
      label: 'Blog Posts', 
      value: stats?.blog_posts || 0, 
      icon: FileText, 
      href: '/admin/blog',
      color: 'bg-purple-100 text-purple-700'
    },
    { 
      label: 'Testimonials', 
      value: stats?.testimonials || 0, 
      icon: Quote, 
      href: '/admin/testimonials',
      color: 'bg-orange-100 text-orange-700'
    },
    { 
      label: 'Team Members', 
      value: stats?.team_members || 0, 
      icon: Users, 
      href: '/admin/team',
      color: 'bg-slate-100 text-slate-700'
    },
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome to your admin panel</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={stat.href}>
                    <Card className="border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                              {stat.label}
                            </p>
                            <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                            {stat.total !== undefined && stat.total > stat.value && (
                              <p className="text-sm text-slate-500 mt-1">
                                of {stat.total} total
                              </p>
                            )}
                          </div>
                          <div className={`w-12 h-12 rounded-sm flex items-center justify-center ${stat.color}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Add Project', href: '/admin/projects', icon: FolderKanban },
                { label: 'Write Blog Post', href: '/admin/blog', icon: FileText },
                { label: 'Add Testimonial', href: '/admin/testimonials', icon: Quote },
                { label: 'Add Team Member', href: '/admin/team', icon: Users },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={action.label}
                    to={action.href}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <Icon className="h-5 w-5 text-slate-600" />
                    <span className="font-medium text-slate-900">{action.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tips */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Tips for Your Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-slate-600 text-sm">
                • Add at least 5-10 projects to showcase your portfolio effectively
              </p>
              <p className="text-slate-600 text-sm">
                • Regular blog posts help with SEO and establish thought leadership
              </p>
              <p className="text-slate-600 text-sm">
                • Client testimonials build trust - aim for 3-5 featured testimonials
              </p>
              <p className="text-slate-600 text-sm">
                • Keep team profiles updated with photos and qualifications
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
