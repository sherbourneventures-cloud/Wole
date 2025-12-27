import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { getBudgetGoals, createBudgetGoal, updateBudgetGoal, deleteBudgetGoal, getCategories } from "@/lib/api";
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Target,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar as CalendarIcon,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { format, addMonths, addYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const BudgetGoals = () => {
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    type: "expense",
    category_id: "all",
    period: "monthly",
    start_date: startOfMonth(new Date()),
    end_date: endOfMonth(new Date()),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [goalsRes, catRes] = await Promise.all([
        getBudgetGoals(),
        getCategories()
      ]);
      setGoals(goalsRes.data);
      setCategories(catRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    const now = new Date();
    let start, end;
    
    if (period === 'monthly') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = startOfYear(now);
      end = endOfYear(now);
    }
    
    setFormData({...formData, period, start_date: start, end_date: end});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.target_amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        category_id: formData.category_id === "all" ? null : formData.category_id,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
      };

      if (editingGoal) {
        await updateBudgetGoal(editingGoal.id, payload);
        toast.success("Budget goal updated successfully");
      } else {
        await createBudgetGoal(payload);
        toast.success("Budget goal created successfully");
      }
      
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save budget goal");
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      type: goal.type,
      category_id: goal.category_id || "",
      period: goal.period,
      start_date: new Date(goal.start_date),
      end_date: new Date(goal.end_date),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget goal?")) return;
    
    try {
      await deleteBudgetGoal(id);
      toast.success("Budget goal deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete budget goal");
    }
  };

  const resetForm = () => {
    setEditingGoal(null);
    setFormData({
      name: "",
      target_amount: "",
      type: "expense",
      category_id: "",
      period: "monthly",
      start_date: startOfMonth(new Date()),
      end_date: endOfMonth(new Date()),
    });
  };

  const openNewDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const getGoalProgress = (goal) => {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(progress, 100);
  };

  const getGoalStatus = (goal) => {
    const progress = getGoalProgress(goal);
    
    if (goal.type === 'expense') {
      // For expense goals, staying under is good
      if (progress >= 100) return { status: 'danger', label: 'Over Budget' };
      if (progress >= 80) return { status: 'warning', label: 'Near Limit' };
      return { status: 'success', label: 'On Track' };
    } else {
      // For income/savings goals, reaching target is good
      if (progress >= 100) return { status: 'success', label: 'Goal Met!' };
      if (progress >= 50) return { status: 'warning', label: 'In Progress' };
      return { status: 'info', label: 'Getting Started' };
    }
  };

  const filteredCategories = categories.filter(c => 
    formData.type === 'savings' || c.type === formData.type
  );

  if (loading) {
    return (
      <div className="space-y-8" data-testid="budget-goals-loading">
        <div className="skeleton h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn" data-testid="budget-goals-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Budget Goals</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Set and track your financial targets
          </p>
        </div>
        <Button 
          onClick={openNewDialog} 
          className="gap-2 rounded-lg"
          data-testid="add-budget-goal-btn"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => {
            const progress = getGoalProgress(goal);
            const { status, label } = getGoalStatus(goal);
            
            return (
              <Card 
                key={goal.id}
                className="card-hover relative overflow-hidden"
                style={{ animationDelay: `${index * 0.05}s` }}
                data-testid={`budget-goal-${goal.id}`}
              >
                {/* Status indicator */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  status === 'success' ? 'bg-emerald-500' :
                  status === 'warning' ? 'bg-amber-500' :
                  status === 'danger' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        goal.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' :
                        goal.type === 'expense' ? 'bg-red-500/10 text-red-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {goal.type === 'income' ? <TrendingUp className="w-5 h-5" /> :
                         goal.type === 'expense' ? <TrendingDown className="w-5 h-5" /> :
                         <Wallet className="w-5 h-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        <p className="text-sm text-muted-foreground capitalize">
                          {goal.period} • {goal.type}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`goal-menu-${goal.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(goal)} data-testid={`edit-goal-${goal.id}`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(goal.id)} 
                          className="text-destructive"
                          data-testid={`delete-goal-${goal.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-2 ${
                        status === 'success' ? '[&>div]:bg-emerald-500' :
                        status === 'warning' ? '[&>div]:bg-amber-500' :
                        status === 'danger' ? '[&>div]:bg-red-500' :
                        '[&>div]:bg-blue-500'
                      }`}
                    />
                  </div>
                  
                  {/* Amounts */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground">Current</p>
                      <p className="text-2xl font-bold">{formatCurrency(goal.current_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Target</p>
                      <p className="text-lg font-medium">{formatCurrency(goal.target_amount)}</p>
                    </div>
                  </div>
                  
                  {/* Status badge */}
                  <div className={`flex items-center gap-2 text-sm font-medium ${
                    status === 'success' ? 'text-emerald-500' :
                    status === 'warning' ? 'text-amber-500' :
                    status === 'danger' ? 'text-red-500' :
                    'text-blue-500'
                  }`}>
                    {status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                     status === 'danger' ? <AlertCircle className="w-4 h-4" /> :
                     <Target className="w-4 h-4" />}
                    {label}
                  </div>
                  
                  {/* Date range */}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(goal.start_date), 'MMM d')} - {format(new Date(goal.end_date), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12">
          <div className="empty-state">
            <Target className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-xl font-medium">No budget goals yet</p>
            <p className="text-muted-foreground mb-6">Set your first financial target to start tracking progress</p>
            <Button onClick={openNewDialog} className="gap-2" data-testid="empty-add-goal-btn">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" data-testid="budget-goal-dialog">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Budget Goal' : 'Create Budget Goal'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your budget target' : 'Set a new financial target to track'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Goal Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Monthly Marketing Budget"
                data-testid="goal-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v, category_id: ""})}
                >
                  <SelectTrigger data-testid="goal-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Income Target
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-500" />
                        Expense Limit
                      </div>
                    </SelectItem>
                    <SelectItem value="savings">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-500" />
                        Savings Goal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Period</Label>
                <Select 
                  value={formData.period} 
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger data-testid="goal-period-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Target Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.target_amount}
                onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                placeholder="10000"
                data-testid="goal-amount-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(v) => setFormData({...formData, category_id: v})}
              >
                <SelectTrigger data-testid="goal-category-select">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="goal-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.start_date, "PP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({...formData, start_date: date || new Date()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="goal-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.end_date, "PP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({...formData, end_date: date || new Date()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="save-goal-btn">
                {editingGoal ? 'Update' : 'Create'} Goal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetGoals;
