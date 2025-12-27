import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { Plus, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, Tags } from "lucide-react";

const COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", 
  "#EC4899", "#6366F1", "#14B8A6", "#84CC16", "#64748B"
];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    type: "expense",
    color: "#10B981",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast.success("Category updated successfully");
      } else {
        await createCategory(formData);
        toast.success("Category created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      loadCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save category");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category? Transactions using this category will still exist.")) return;
    
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      loadCategories();
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "expense",
      color: "#10B981",
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  if (loading) {
    return (
      <div className="space-y-8" data-testid="categories-loading">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="categories-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Organize your transactions with custom categories
          </p>
        </div>
        <Button 
          onClick={openNewDialog} 
          className="gap-2 rounded-lg"
          data-testid="add-category-btn"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setActiveTab('all')}
          data-testid="filter-all"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Tags className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">All Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'income' ? 'ring-2 ring-emerald-500' : ''}`}
          onClick={() => setActiveTab('income')}
          data-testid="filter-income"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Income Categories</p>
              <p className="text-2xl font-bold">{incomeCategories.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'expense' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setActiveTab('expense')}
          data-testid="filter-expense"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expense Categories</p>
              <p className="text-2xl font-bold">{expenseCategories.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <Card data-testid="categories-list">
        <CardHeader>
          <CardTitle>
            {activeTab === 'all' ? 'All Categories' : activeTab === 'income' ? 'Income Categories' : 'Expense Categories'}
          </CardTitle>
          <CardDescription>
            {filteredCategories.length} categor{filteredCategories.length !== 1 ? 'ies' : 'y'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category, index) => (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/30 transition-colors"
                  style={{ animationDelay: `${index * 0.02}s` }}
                  data-testid={`category-${category.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.type === 'income' ? (
                        <TrendingUp className="w-5 h-5" style={{ color: category.color }} />
                      ) : (
                        <TrendingDown className="w-5 h-5" style={{ color: category.color }} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{category.type}</p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`category-menu-${category.id}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)} data-testid={`edit-category-${category.id}`}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(category.id)} 
                        className="text-destructive"
                        data-testid={`delete-category-${category.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <Tags className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm">Create your first category to organize transactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]" data-testid="category-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update the category details' : 'Create a new category for organizing transactions'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter category name"
                data-testid="category-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v) => setFormData({...formData, type: v})}
              >
                <SelectTrigger data-testid="category-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Income
                    </div>
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      Expense
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-lg transition-all ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({...formData, color})}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-category-btn">
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
