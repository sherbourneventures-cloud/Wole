import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Quote } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { adminApi, publicApi } from '../../lib/api';

const initialForm = {
  name: '',
  position: '',
  company: '',
  content: '',
  image_url: '',
};

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTestimonials = () => {
    setLoading(true);
    publicApi.getTestimonials()
      .then(res => setTestimonials(res.data))
      .catch(() => toast.error('Failed to load testimonials'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.company || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateTestimonial(editingId, formData);
        toast.success('Testimonial updated');
      } else {
        await adminApi.createTestimonial(formData);
        toast.success('Testimonial added');
      }
      setDialogOpen(false);
      setFormData(initialForm);
      setEditingId(null);
      fetchTestimonials();
    } catch {
      toast.error('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      name: testimonial.name,
      position: testimonial.position,
      company: testimonial.company,
      content: testimonial.content,
      image_url: testimonial.image_url || '',
    });
    setEditingId(testimonial.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await adminApi.deleteTestimonial(editingId);
      toast.success('Testimonial deleted');
      setDeleteDialog(false);
      setEditingId(null);
      fetchTestimonials();
    } catch {
      toast.error('Failed to delete testimonial');
    }
  };

  const openNewDialog = () => {
    setFormData(initialForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  return (
    <div data-testid="admin-testimonials">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Testimonials</h1>
          <p className="text-slate-500 mt-1">Manage client testimonials</p>
        </div>
        <Button 
          onClick={openNewDialog}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
          data-testid="add-testimonial-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200">
          <Quote className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No testimonials yet</p>
          <Button onClick={openNewDialog} variant="outline">
            Add Your First Testimonial
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 p-6 relative"
              data-testid={`testimonial-item-${testimonial.id}`}
            >
              <Quote className="h-8 w-8 text-slate-200 absolute top-4 right-4" />
              <p className="text-slate-600 leading-relaxed mb-6 pr-8">"{testimonial.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                  {testimonial.image_url ? (
                    <img src={testimonial.image_url} alt={testimonial.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-600 font-bold">{testimonial.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.position}, {testimonial.company}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(testimonial)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingId(testimonial.id);
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Testimonial' : 'Add Testimonial'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Client Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Position *</Label>
                <Input
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="CEO"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Company *</Label>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company Name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Testimonial *</Label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="What did the client say..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Photo URL</Label>
              <Input
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Testimonial'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Testimonial</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this testimonial? This action cannot be undone.
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
