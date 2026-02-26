import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, FolderKanban, MapPin, Calendar, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { adminApi, publicApi } from '../../lib/api';
import { categoryLabels } from '../../lib/utils';

const initialForm = {
  title: '',
  category: '',
  description: '',
  location: '',
  year: '',
  client: '',
  image_url: '',
  featured: false,
};

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    publicApi.getProjects()
      .then(res => setProjects(res.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.description || !formData.location || !formData.year) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateProject(editingId, formData);
        toast.success('Project updated successfully');
      } else {
        await adminApi.createProject(formData);
        toast.success('Project created successfully');
      }
      setDialogOpen(false);
      setFormData(initialForm);
      setEditingId(null);
      fetchProjects();
    } catch {
      toast.error('Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      title: project.title,
      category: project.category,
      description: project.description,
      location: project.location,
      year: project.year,
      client: project.client || '',
      image_url: project.image_url || '',
      featured: project.featured,
    });
    setEditingId(project.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await adminApi.deleteProject(editingId);
      toast.success('Project deleted');
      setDeleteDialog(false);
      setEditingId(null);
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const openNewDialog = () => {
    setFormData(initialForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  return (
    <div data-testid="admin-projects">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1">Manage your portfolio projects</p>
        </div>
        <Button 
          onClick={openNewDialog}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
          data-testid="add-project-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-[4/3] bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200">
          <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No projects yet</p>
          <Button onClick={openNewDialog} variant="outline">
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 overflow-hidden group"
              data-testid={`project-item-${project.id}`}
            >
              <div className="aspect-[16/10] bg-slate-100 relative">
                {project.image_url ? (
                  <img 
                    src={project.image_url} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FolderKanban className="h-12 w-12 text-slate-300" />
                  </div>
                )}
                {project.featured && (
                  <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
              </div>
              <div className="p-4">
                <span className="text-xs text-slate-500 uppercase tracking-widest">
                  {categoryLabels[project.category] || project.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{project.title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {project.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {project.year}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(project)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingId(project.id);
                      setDeleteDialog(true);
                    }}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title *</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Project title"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="structural">Structural Engineering</SelectItem>
                    <SelectItem value="geotechnical">Geotechnical Engineering</SelectItem>
                    <SelectItem value="project_management">Project Management</SelectItem>
                    <SelectItem value="construction_supervision">Construction Supervision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Year *</Label>
                <Input
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2024"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Location *</Label>
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Lagos, Nigeria"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Client</Label>
                <Input
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="Client name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description *</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Project description..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Image URL</Label>
              <Input
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch 
                checked={formData.featured} 
                onCheckedChange={(c) => setFormData({...formData, featured: c})}
              />
              <Label>Featured Project</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
