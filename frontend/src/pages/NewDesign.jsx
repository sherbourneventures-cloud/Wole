import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Calculator, Layers, Grid3X3, Square, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "@/App";

const CONCRETE_GRADES = ["C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60"];
const STEEL_GRADES = ["B500A", "B500B", "B500C"];

const NewDesign = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState(null);

  const [formData, setFormData] = useState({
    project_name: "",
    slab_type: "one_way",
    span_x: 5000,
    span_y: 4000,
    slab_thickness: 200,
    concrete_grade: "C30/37",
    steel_grade: "B500B",
    cover: 25,
    dead_load: 1.5,
    imposed_load: 2.5,
    column_width: 400,
    column_depth: 400,
    drop_panel: false,
    drop_thickness: 100,
    drop_size: 2000
  });

  useEffect(() => {
    if (isEditing) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const project = response.data;
      setFormData(project.input_data);
      setResults(project.results);
    } catch (error) {
      toast.error("Failed to load project");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setResults(null); // Clear results when input changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.project_name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setCalculating(true);
    try {
      const payload = { input_data: formData };
      
      let response;
      if (isEditing) {
        response = await axios.put(`${API}/projects/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Project updated");
      } else {
        response = await axios.post(`${API}/projects`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Design calculated and saved");
      }
      
      setResults(response.data.results);
      
      if (!isEditing) {
        navigate(`/project/${response.data.id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Calculation failed");
    } finally {
      setCalculating(false);
    }
  };

  const slabTypes = [
    { value: "one_way", label: "One-Way Slab", icon: <Layers className="w-5 h-5" />, desc: "Simply supported, single span direction" },
    { value: "two_way", label: "Two-Way Slab", icon: <Grid3X3 className="w-5 h-5" />, desc: "Supported on all edges, Ly/Lx ≤ 2" },
    { value: "flat_slab", label: "Flat Slab", icon: <Square className="w-5 h-5" />, desc: "Column supported, no beams" }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="font-mono font-bold text-lg text-slate-900 dark:text-white">
                  {isEditing ? "Edit Design" : "New Slab Design"}
                </h1>
                <p className="font-mono text-xs text-slate-500">Eurocode 2 Compliant</p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={calculating}
              data-testid="calculate-btn"
              className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm"
            >
              {calculating ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculating...
                </span>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  {isEditing ? "Recalculate" : "Calculate & Save"}
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main Content - Split Screen */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)]">
          {/* Left Panel - Inputs */}
          <div className="w-full lg:w-2/5 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Project Name */}
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-widest">Project Name</Label>
                <Input
                  value={formData.project_name}
                  onChange={(e) => handleChange("project_name", e.target.value)}
                  placeholder="e.g., Office Block Level 3"
                  data-testid="project-name-input"
                  className="font-mono border-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-sm"
                />
              </div>

              {/* Slab Type Selection */}
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-widest">Slab Type</Label>
                <div className="grid grid-cols-1 gap-3">
                  {slabTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleChange("slab_type", type.value)}
                      data-testid={`slab-type-${type.value}`}
                      className={`flex items-center gap-4 p-4 border-2 rounded-sm transition-all ${
                        formData.slab_type === type.value
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                        formData.slab_type === type.value
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {type.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-mono font-semibold text-slate-900 dark:text-white">{type.label}</div>
                        <div className="text-xs text-slate-500">{type.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs for organized inputs */}
              <Tabs defaultValue="geometry" className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-sm">
                  <TabsTrigger value="geometry" className="font-mono text-xs rounded-sm">Geometry</TabsTrigger>
                  <TabsTrigger value="materials" className="font-mono text-xs rounded-sm">Materials</TabsTrigger>
                  <TabsTrigger value="loads" className="font-mono text-xs rounded-sm">Loads</TabsTrigger>
                </TabsList>

                <TabsContent value="geometry" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest flex items-center gap-1">
                        Span X (mm)
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                          <TooltipContent><p>Primary span direction</p></TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        type="number"
                        value={formData.span_x}
                        onChange={(e) => handleChange("span_x", parseFloat(e.target.value))}
                        data-testid="span-x-input"
                        className="font-mono border-2 rounded-sm"
                      />
                    </div>
                    {(formData.slab_type === "two_way" || formData.slab_type === "flat_slab") && (
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-widest">Span Y (mm)</Label>
                        <Input
                          type="number"
                          value={formData.span_y}
                          onChange={(e) => handleChange("span_y", parseFloat(e.target.value))}
                          data-testid="span-y-input"
                          className="font-mono border-2 rounded-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest">Thickness (mm)</Label>
                      <Input
                        type="number"
                        value={formData.slab_thickness}
                        onChange={(e) => handleChange("slab_thickness", parseFloat(e.target.value))}
                        data-testid="thickness-input"
                        className="font-mono border-2 rounded-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest">Cover (mm)</Label>
                      <Input
                        type="number"
                        value={formData.cover}
                        onChange={(e) => handleChange("cover", parseFloat(e.target.value))}
                        data-testid="cover-input"
                        className="font-mono border-2 rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Flat slab specific inputs */}
                  {formData.slab_type === "flat_slab" && (
                    <>
                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Label className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-3 block">
                          Column Dimensions
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-mono text-xs">Width (mm)</Label>
                            <Input
                              type="number"
                              value={formData.column_width}
                              onChange={(e) => handleChange("column_width", parseFloat(e.target.value))}
                              data-testid="column-width-input"
                              className="font-mono border-2 rounded-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-xs">Depth (mm)</Label>
                            <Input
                              type="number"
                              value={formData.column_depth}
                              onChange={(e) => handleChange("column_depth", parseFloat(e.target.value))}
                              data-testid="column-depth-input"
                              className="font-mono border-2 rounded-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3">
                        <div>
                          <Label className="font-mono text-sm">Drop Panel</Label>
                          <p className="text-xs text-slate-500">Include drop panel at columns</p>
                        </div>
                        <Switch
                          checked={formData.drop_panel}
                          onCheckedChange={(checked) => handleChange("drop_panel", checked)}
                          data-testid="drop-panel-switch"
                        />
                      </div>

                      {formData.drop_panel && (
                        <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-blue-600">
                          <div className="space-y-2">
                            <Label className="font-mono text-xs">Drop Thickness (mm)</Label>
                            <Input
                              type="number"
                              value={formData.drop_thickness}
                              onChange={(e) => handleChange("drop_thickness", parseFloat(e.target.value))}
                              data-testid="drop-thickness-input"
                              className="font-mono border-2 rounded-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-mono text-xs">Drop Size (mm)</Label>
                            <Input
                              type="number"
                              value={formData.drop_size}
                              onChange={(e) => handleChange("drop_size", parseFloat(e.target.value))}
                              data-testid="drop-size-input"
                              className="font-mono border-2 rounded-sm"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="materials" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Concrete Grade</Label>
                    <Select value={formData.concrete_grade} onValueChange={(v) => handleChange("concrete_grade", v)}>
                      <SelectTrigger data-testid="concrete-grade-select" className="font-mono border-2 rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONCRETE_GRADES.map(grade => (
                          <SelectItem key={grade} value={grade} className="font-mono">{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Steel Grade</Label>
                    <Select value={formData.steel_grade} onValueChange={(v) => handleChange("steel_grade", v)}>
                      <SelectTrigger data-testid="steel-grade-select" className="font-mono border-2 rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STEEL_GRADES.map(grade => (
                          <SelectItem key={grade} value={grade} className="font-mono">{grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Material Properties Display */}
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-sm">
                    <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-3">
                      Material Properties (EC2)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">f<sub>ck</sub></span>
                        <span className="font-mono">{formData.concrete_grade.split("/")[0].slice(1)} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">f<sub>yk</sub></span>
                        <span className="font-mono">500 MPa</span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="loads" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest flex items-center gap-1">
                      Dead Load (kN/m²)
                      <Tooltip>
                        <TooltipTrigger><Info className="w-3 h-3 text-slate-400" /></TooltipTrigger>
                        <TooltipContent><p>Excluding self-weight (auto-calculated)</p></TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.dead_load}
                      onChange={(e) => handleChange("dead_load", parseFloat(e.target.value))}
                      data-testid="dead-load-input"
                      className="font-mono border-2 rounded-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Imposed Load (kN/m²)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.imposed_load}
                      onChange={(e) => handleChange("imposed_load", parseFloat(e.target.value))}
                      data-testid="imposed-load-input"
                      className="font-mono border-2 rounded-sm"
                    />
                  </div>

                  {/* Load Summary */}
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-sm">
                    <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-3">
                      Load Combination (EC0)
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Self-weight (est.)</span>
                        <span className="font-mono">{(25 * formData.slab_thickness / 1000).toFixed(2)} kN/m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">G<sub>k</sub> (total)</span>
                        <span className="font-mono">{(formData.dead_load + 25 * formData.slab_thickness / 1000).toFixed(2)} kN/m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Q<sub>k</sub></span>
                        <span className="font-mono">{formData.imposed_load} kN/m²</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">n<sub>Ed</sub> = 1.35G + 1.5Q</span>
                        <span className="font-mono text-blue-600">
                          {(1.35 * (formData.dead_load + 25 * formData.slab_thickness / 1000) + 1.5 * formData.imposed_load).toFixed(2)} kN/m²
                        </span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </form>
          </div>

          {/* Right Panel - Visualization / Results Preview */}
          <div className="w-full lg:w-3/5 p-6 bg-slate-100 dark:bg-slate-900 overflow-y-auto grid-pattern">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {results ? (
                <ResultsPreview results={results} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-sm flex items-center justify-center mb-6">
                    <Calculator className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="font-mono font-bold text-lg text-slate-700 dark:text-slate-300 mb-2">
                    Ready to Calculate
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md">
                    Fill in the design parameters and click "Calculate & Save" to run the EC2 design checks
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Results Preview Component
const ResultsPreview = ({ results }) => {
  const getStatusColor = (pass) => pass ? "text-green-600" : "text-red-600";
  const getBarColor = (util) => {
    if (util <= 70) return "bg-green-500";
    if (util <= 90) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono font-bold text-lg">{results.calculation_type}</h3>
          <span className={`font-mono font-bold text-lg ${results.summary?.all_checks_pass ? "text-green-600" : "text-red-600"}`}>
            {results.summary?.all_checks_pass ? "ALL PASS" : results.summary?.critical_check}
          </span>
        </div>
        
        {/* Quick Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.bending && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-sm">
              <div className="font-mono text-xs text-slate-500 uppercase">M_Ed</div>
              <div className="font-mono text-xl font-bold">{results.bending.M_Ed}</div>
              <div className="font-mono text-xs text-slate-500">kNm/m</div>
            </div>
          )}
          {results.reinforcement?.As_provided && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-sm">
              <div className="font-mono text-xs text-slate-500 uppercase">As,prov</div>
              <div className="font-mono text-xl font-bold">{results.reinforcement.As_provided}</div>
              <div className="font-mono text-xs text-slate-500">mm²/m</div>
            </div>
          )}
          {results.reinforcement?.bar_diameter && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-sm">
              <div className="font-mono text-xs text-slate-500 uppercase">Bars</div>
              <div className="font-mono text-xl font-bold text-blue-600">
                T{results.reinforcement.bar_diameter} @ {results.reinforcement.bar_spacing}
              </div>
              <div className="font-mono text-xs text-slate-500">spacing mm</div>
            </div>
          )}
          {results.deflection && (
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-sm">
              <div className="font-mono text-xs text-slate-500 uppercase">L/d</div>
              <div className="font-mono text-xl font-bold">{results.deflection.L_d_actual}</div>
              <div className="font-mono text-xs text-slate-500">≤ {results.deflection.L_d_allowable}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Utilization Bars */}
      <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
        <h4 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">Design Utilization</h4>
        <div className="space-y-4">
          {results.reinforcement?.utilisation && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-sm">Reinforcement</span>
                <span className="font-mono text-sm">{results.reinforcement.utilisation}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(results.reinforcement.utilisation)} transition-all duration-500`}
                  style={{ width: `${Math.min(results.reinforcement.utilisation, 100)}%` }}
                />
              </div>
            </div>
          )}
          {results.shear?.utilisation && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-sm">Shear</span>
                <span className={`font-mono text-sm ${getStatusColor(results.shear.shear_ok)}`}>
                  {results.shear.utilisation}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(results.shear.utilisation)} transition-all duration-500`}
                  style={{ width: `${Math.min(results.shear.utilisation, 100)}%` }}
                />
              </div>
            </div>
          )}
          {results.punching_shear?.utilisation && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-sm">Punching Shear</span>
                <span className={`font-mono text-sm ${getStatusColor(results.punching_shear.punching_ok)}`}>
                  {results.punching_shear.utilisation}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(results.punching_shear.utilisation)} transition-all duration-500`}
                  style={{ width: `${Math.min(results.punching_shear.utilisation, 100)}%` }}
                />
              </div>
            </div>
          )}
          {results.deflection?.utilisation && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-sm">Deflection</span>
                <span className={`font-mono text-sm ${getStatusColor(results.deflection.deflection_ok)}`}>
                  {results.deflection.utilisation}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(results.deflection.utilisation)} transition-all duration-500`}
                  style={{ width: `${Math.min(results.deflection.utilisation, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* EC2 References */}
      <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
        <h4 className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-4">Code References</h4>
        <div className="flex flex-wrap gap-2">
          <span className="ec-ref">EC2 6.1 - Bending</span>
          <span className="ec-ref">EC2 6.2 - Shear</span>
          {results.punching_shear && <span className="ec-ref">EC2 6.4 - Punching</span>}
          <span className="ec-ref">EC2 7.4 - Deflection</span>
          {results.crack_control && <span className="ec-ref">EC2 7.3 - Cracking</span>}
          <span className="ec-ref">EC2 9.2.1 - Min. Reinforcement</span>
        </div>
      </Card>
    </div>
  );
};

export default NewDesign;
