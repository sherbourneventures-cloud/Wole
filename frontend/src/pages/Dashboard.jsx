import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileText, Trash2, Eye, Download, LogOut, Layers, Grid3X3, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "@/App";

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API}/projects/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projects.filter(p => p.id !== deleteId));
      toast.success("Project deleted");
    } catch (error) {
      toast.error("Failed to delete project");
    } finally {
      setDeleteId(null);
    }
  };

  const handleDownloadPDF = async (projectId, projectName) => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${projectName.replace(/\s+/g, "_")}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const getSlabIcon = (type) => {
    switch (type) {
      case "one_way": return <Layers className="w-5 h-5" />;
      case "two_way": return <Grid3X3 className="w-5 h-5" />;
      case "flat_slab": return <Square className="w-5 h-5" />;
      default: return <Layers className="w-5 h-5" />;
    }
  };

  const getSlabTypeName = (type) => {
    switch (type) {
      case "one_way": return "One-Way Slab";
      case "two_way": return "Two-Way Slab";
      case "flat_slab": return "Flat Slab";
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
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
            <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="logout-btn"
              className="font-mono text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
                My Projects
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Manage your slab design calculations
              </p>
            </div>
            <Link to="/design/new">
              <Button 
                data-testid="new-design-btn"
                className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> New Design
              </Button>
            </Link>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : projects.length === 0 ? (
            <Card className="border border-slate-200 dark:border-slate-700 rounded-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-mono font-bold text-lg text-slate-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Create your first slab design to get started
              </p>
              <Link to="/design/new">
                <Button 
                  data-testid="empty-new-design-btn"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create Design
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card 
                    className="border border-slate-200 dark:border-slate-700 rounded-sm p-6 hover:border-blue-600 transition-all duration-200 bg-white dark:bg-slate-800"
                    data-testid={`project-card-${project.id}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-sm flex items-center justify-center text-blue-600">
                          {getSlabIcon(project.slab_type)}
                        </div>
                        <div>
                          <h3 className="font-mono font-bold text-slate-900 dark:text-white line-clamp-1">
                            {project.project_name}
                          </h3>
                          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {getSlabTypeName(project.slab_type)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Span</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {project.input_data?.span_x} mm
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Thickness</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          {project.input_data?.slab_thickness} mm
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Status</span>
                        <span className={`font-mono font-semibold ${project.results?.summary?.all_checks_pass ? "text-green-600" : "text-red-600"}`}>
                          {project.results?.summary?.all_checks_pass ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                      <Link to={`/project/${project.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full font-mono text-xs rounded-sm"
                          data-testid={`view-project-${project.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(project.id, project.project_name)}
                        className="font-mono text-xs rounded-sm"
                        data-testid={`download-pdf-${project.id}`}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(project.id)}
                        className="font-mono text-xs rounded-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`delete-project-${project.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <p className="font-mono text-xs text-slate-400 mt-3">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The project and all its calculations will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono rounded-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 font-mono rounded-sm"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
