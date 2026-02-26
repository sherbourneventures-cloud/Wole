import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';
import { adminApi, publicApi } from '../../lib/api';
import { formatDate } from '../../lib/utils';

const initialForm = {
  title: '',
  excerpt: '',
  content: '',
  author: '',
  image_url: '',
  tags: [],
};

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [tagsInput, setTagsInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPosts = () => {
    setLoading(true);
    publicApi.getBlogPosts()
      .then(res => setPosts(res.data))
      .catch(() => toast.error('Failed to load blog posts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.content || !formData.author) {
      toast.error('Please fill in all required fields');
      return;
    }

    const submitData = {
      ...formData,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updateBlogPost(editingId, submitData);
        toast.success('Blog post updated successfully');
      } else {
        await adminApi.createBlogPost(submitData);
        toast.success('Blog post created successfully');
      }
      setDialogOpen(false);
      setFormData(initialForm);
      setTagsInput('');
      setEditingId(null);
      fetchPosts();
    } catch {
      toast.error('Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      image_url: post.image_url || '',
      tags: post.tags || [],
    });
    setTagsInput(post.tags?.join(', ') || '');
    setEditingId(post.id);
    setDialogOpen(true);
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await adminApi.togglePublish(id, !currentStatus);
      toast.success(currentStatus ? 'Post unpublished' : 'Post published');
      fetchPosts();
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;
    try {
      await adminApi.deleteBlogPost(editingId);
      toast.success('Blog post deleted');
      setDeleteDialog(false);
      setEditingId(null);
      fetchPosts();
    } catch {
      toast.error('Failed to delete blog post');
    }
  };

  const openNewDialog = () => {
    setFormData(initialForm);
    setTagsInput('');
    setEditingId(null);
    setDialogOpen(true);
  };

  return (
    <div data-testid="admin-blog">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-500 mt-1">Manage your blog content</p>
        </div>
        <Button 
          onClick={openNewDialog}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
          data-testid="add-post-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">No blog posts yet</p>
          <Button onClick={openNewDialog} variant="outline">
            Write Your First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 p-6 flex items-start gap-6"
              data-testid={`post-item-${post.id}`}
            >
              {post.image_url && (
                <div className="w-32 h-20 bg-slate-100 flex-shrink-0">
                  <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{post.title}</h3>
                  {!post.published && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5">Draft</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-2">
                  By {post.author} • {formatDate(post.created_at)}
                </p>
                <p className="text-slate-600 text-sm line-clamp-2">{post.excerpt}</p>
                {post.tags?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-1">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleTogglePublish(post.id, post.published)}
                  title={post.published ? 'Unpublish' : 'Publish'}
                >
                  {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingId(post.id);
                    setDeleteDialog(true);
                  }}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Blog Post' : 'New Blog Post'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Title *</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Blog post title"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Author *</Label>
                <Input
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Author name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tags</Label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Excerpt *</Label>
              <Textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                placeholder="Brief summary of the post..."
                rows={2}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Content *</Label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Full blog post content..."
                rows={10}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? 'Saving...' : editingId ? 'Update Post' : 'Publish Post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this blog post? This action cannot be undone.
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
