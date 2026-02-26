import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
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
  bio: '',
  image_url: '',
  qualifications: [],
  order: 0,
};

export default function AdminTeam() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [qualInput, setQualInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchMembers = () => {
    setLoading(true);
    publicApi.getTeam()
      .then(res => setMembers(res.data))
      .catch(() => toast.error('Failed to load team members'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.position || !formData.bio) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      qualifications: qualInput.split(',').map(q => q.trim()).filter(Boolean),
      order: parseInt(formData.order) || 0,
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateTeamMember(editingId, submitData);
        toast.success('Team member updated');
      } else {
        await adminApi.createTeamMember(submitData);
        toast.success('Team member added');
      }
      setDialogOpen(false);
      setFormData(initialForm);
      setQualInput('');
      setEditingId(null);
      fetchMembers();
    } catch {
      toast.error('Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      position: member.position,
      bio: member.bio,
      image_url: member.image_url || '',
      qualifications: member.qualifications || [],
      order: member.order || 0,
    });
    setQualInput(member.qualifications?.join(', ') || '');
    setEditingId(member.id);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await adminApi.deleteTeamMember(editingId);
      toast.success('Team member removed');
      setDeleteDialog(false);
      setEditingId(null);
      fetchMembers();
    } catch {
      toast.error('Failed to delete team member');
    }
  };

  const openNewDialog = () => {
    setFormData(initialForm);
    setQualInput('');
    setEditingId(null);
    setDialogOpen(true);
  };

  return (
    <div data-testid="admin-team">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-500 mt-1">Manage your team profiles</p>
        </div>
        <Button 
          onClick={openNewDialog}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
          data-testid="add-member-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No team members yet</p>
          <Button onClick={openNewDialog} variant="outline">
            Add Your First Team Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 overflow-hidden"
              data-testid={`member-item-${member.id}`}
            >
              <div className="aspect-square bg-slate-100 relative">
                {member.image_url ? (
                  <img 
                    src={member.image_url} 
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl font-bold text-slate-300">{member.name.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-slate-900 text-white text-xs px-2 py-1">
                  #{member.order || 0}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-sm text-slate-500 uppercase tracking-widest mb-2">{member.position}</p>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{member.bio}</p>
                {member.qualifications?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {member.qualifications.slice(0, 3).map((qual, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5">{qual}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(member)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingId(member.id);
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Engr. John Doe"
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
                  placeholder="Senior Engineer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Display Order</Label>
                <Input
                  name="order"
                  type="number"
                  value={formData.order}
                  onChange={handleChange}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Bio *</Label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Brief biography..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Qualifications</Label>
              <Input
                value={qualInput}
                onChange={(e) => setQualInput(e.target.value)}
                placeholder="B.Sc, M.Eng, COREN, NSE"
                className="mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">Separate with commas</p>
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
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to remove this team member? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
