import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Plus, 
  FileText, 
  Calculator, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Trash2,
  Eye
} from 'lucide-react';
import { getProjects, deleteProject } from '../api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      const data = response.data || [];
      setProjects(data);
      
      setStats({
        total: data.length,
        passed: data.filter(p => p.status === 'PASS').length,
        failed: data.filter(p => p.status === 'FAIL').length
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="page-container" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Prestressed beam design projects</p>
        </div>
        <Link to="/design">
          <Button className="gap-2" data-testid="new-design-btn">
            <Plus className="w-4 h-4" />
            New Design
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-hover" data-testid="stat-total">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Designs
            </CardTitle>
            <Calculator className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-passed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Designs Passed
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-emerald-400">{stats.passed}</div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-failed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Designs Failed
            </CardTitle>
            <XCircle className="w-5 h-5 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-red-400">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/design" className="block">
          <Card className="card-hover cursor-pointer h-full">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">New Beam Design</h3>
                <p className="text-sm text-muted-foreground">Start a new calculation</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-hover">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-accent/10 rounded-lg">
              <FileText className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">EC2 Reference</h3>
              <p className="text-sm text-muted-foreground">Eurocode 2 provisions</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold">Magnel Diagram</h3>
              <p className="text-sm text-muted-foreground">Graphical design aid</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Calculator className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Loss Calculations</h3>
              <p className="text-sm text-muted-foreground">Prestress losses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card data-testid="recent-projects">
        <CardHeader>
          <CardTitle className="text-lg">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 loading-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No projects yet</p>
              <p className="text-sm mt-1">Create your first beam design to get started</p>
              <Link to="/design">
                <Button className="mt-4" variant="outline">
                  Create First Design
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Beam</th>
                    <th>Section</th>
                    <th>Span</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr key={project.id} data-testid={`project-row-${project.id}`}>
                      <td className="font-medium">{project.project_name}</td>
                      <td>{project.beam_name}</td>
                      <td className="capitalize">{project.section_type?.replace('_', ' ')}</td>
                      <td className="font-mono">{project.span?.toFixed(1)} m</td>
                      <td>
                        <span className={`status-indicator ${project.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link to={`/results/${project.id}`}>
                            <Button variant="ghost" size="sm" data-testid={`view-${project.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            data-testid={`delete-${project.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
