import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Edit, Printer, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";
import { useAuth, API } from "@/App";

const ProjectView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await axios.get(`${API}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
    } catch (error) {
      toast.error("Failed to load project");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(`${API}/projects/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${project.project_name.replace(/\s+/g, "_")}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) return null;

  const results = project.results;
  const input = project.input_data;

  const StatusIcon = ({ pass }) => pass ? 
    <CheckCircle className="w-5 h-5 text-green-600" /> : 
    <XCircle className="w-5 h-5 text-red-600" />;

  const getSlabTypeName = (type) => {
    switch (type) {
      case "one_way": return "One-Way Spanning Slab";
      case "two_way": return "Two-Way Spanning Slab";
      case "flat_slab": return "Flat Slab";
      default: return type;
    }
  };

  return (
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
                {project.project_name}
              </h1>
              <p className="font-mono text-xs text-slate-500">{getSlabTypeName(project.slab_type)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/design/${id}`}>
              <Button variant="outline" data-testid="edit-project-btn" className="font-mono rounded-sm">
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            </Link>
            <Button 
              onClick={handleDownloadPDF}
              data-testid="download-pdf-btn"
              className="bg-blue-600 hover:bg-blue-700 text-white font-mono uppercase tracking-wider rounded-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Download PDF
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
          {/* Summary Banner */}
          <Card className={`p-6 mb-8 border-2 rounded-sm ${
            results.summary?.all_checks_pass 
              ? "border-green-500 bg-green-50 dark:bg-green-900/20" 
              : "border-red-500 bg-red-50 dark:bg-red-900/20"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {results.summary?.all_checks_pass ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                )}
                <div>
                  <h2 className="font-mono font-bold text-xl text-slate-900 dark:text-white">
                    {results.summary?.all_checks_pass ? "ALL DESIGN CHECKS PASS" : "DESIGN CHECK FAILED"}
                  </h2>
                  <p className="font-mono text-sm text-slate-600 dark:text-slate-400">
                    {results.summary?.all_checks_pass 
                      ? "Slab design complies with Eurocode 2 requirements"
                      : `Critical: ${results.summary?.critical_check}`
                    }
                  </p>
                </div>
              </div>
              <span className="ec-ref">{results.calculation_type}</span>
            </div>
          </Card>

          {/* Results Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 rounded-sm mb-6">
              <TabsTrigger value="summary" className="font-mono text-xs rounded-sm">Summary</TabsTrigger>
              <TabsTrigger value="geometry" className="font-mono text-xs rounded-sm">Geometry</TabsTrigger>
              <TabsTrigger value="bending" className="font-mono text-xs rounded-sm">Bending</TabsTrigger>
              <TabsTrigger value="reinforcement" className="font-mono text-xs rounded-sm">Reinforcement</TabsTrigger>
              <TabsTrigger value="checks" className="font-mono text-xs rounded-sm">Checks</TabsTrigger>
              <TabsTrigger value="diagram" className="font-mono text-xs rounded-sm">Diagram</TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Key Results Cards */}
                <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
                  <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">Design Moment</div>
                  <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                    {results.bending?.M_Ed || results.bending_x?.M_Ed || "-"}
                  </div>
                  <div className="font-mono text-sm text-slate-500">kNm/m</div>
                </Card>

                <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
                  <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">Reinforcement</div>
                  <div className="font-mono text-3xl font-bold text-blue-600">
                    {results.reinforcement?.bar_diameter 
                      ? `T${results.reinforcement.bar_diameter}@${results.reinforcement.bar_spacing}`
                      : results.reinforcement_x 
                        ? `T${results.reinforcement_x.bar_diameter}@${results.reinforcement_x.bar_spacing}`
                        : "-"
                    }
                  </div>
                  <div className="font-mono text-sm text-slate-500">mm centres</div>
                </Card>

                <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
                  <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">L/d Ratio</div>
                  <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                    {results.deflection?.L_d_actual || "-"}
                  </div>
                  <div className="font-mono text-sm text-slate-500">≤ {results.deflection?.L_d_allowable || "-"}</div>
                </Card>

                <Card className="p-6 border rounded-sm bg-white dark:bg-slate-800">
                  <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-2">Design Load</div>
                  <div className="font-mono text-3xl font-bold text-slate-900 dark:text-white">
                    {results.loads?.design_load || "-"}
                  </div>
                  <div className="font-mono text-sm text-slate-500">kN/m²</div>
                </Card>
              </div>
            </TabsContent>

            {/* Geometry Tab */}
            <TabsContent value="geometry">
              <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Parameter</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Value</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Span X</TableCell>
                      <TableCell className="font-mono">{results.geometry?.span || results.geometry?.span_x}</TableCell>
                      <TableCell>mm</TableCell>
                    </TableRow>
                    {results.geometry?.span_y && (
                      <TableRow>
                        <TableCell className="font-medium">Span Y</TableCell>
                        <TableCell className="font-mono">{results.geometry.span_y}</TableCell>
                        <TableCell>mm</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-medium">Thickness</TableCell>
                      <TableCell className="font-mono">{results.geometry?.thickness}</TableCell>
                      <TableCell>mm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Effective Depth (d)</TableCell>
                      <TableCell className="font-mono">{results.geometry?.effective_depth}</TableCell>
                      <TableCell>mm</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cover</TableCell>
                      <TableCell className="font-mono">{results.geometry?.cover}</TableCell>
                      <TableCell>mm</TableCell>
                    </TableRow>
                    {results.geometry?.aspect_ratio && (
                      <TableRow>
                        <TableCell className="font-medium">Aspect Ratio (Ly/Lx)</TableCell>
                        <TableCell className="font-mono">{results.geometry.aspect_ratio}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Bending Tab */}
            <TabsContent value="bending">
              <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-mono font-bold">Flexural Design (EC2 6.1)</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Parameter</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Value</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Unit</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.bending && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">Design Moment (M<sub>Ed</sub>)</TableCell>
                          <TableCell className="font-mono font-bold">{results.bending.M_Ed}</TableCell>
                          <TableCell>kNm/m</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">K factor</TableCell>
                          <TableCell className="font-mono">{results.bending.K}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">K balanced</TableCell>
                          <TableCell className="font-mono">{results.bending.K_bal}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Lever Arm (z)</TableCell>
                          <TableCell className="font-mono">{results.bending.z}</TableCell>
                          <TableCell>mm</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                      </>
                    )}
                    {results.bending_x && (
                      <>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell colSpan={4} className="font-mono font-bold">X-Direction</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Moment Coefficient (α<sub>sx</sub>)</TableCell>
                          <TableCell className="font-mono">{results.bending_x.alpha}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><span className="ec-ref">EC2 I.1</span></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">M<sub>Ed,x</sub></TableCell>
                          <TableCell className="font-mono font-bold">{results.bending_x.M_Ed}</TableCell>
                          <TableCell>kNm/m</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell colSpan={4} className="font-mono font-bold">Y-Direction</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Moment Coefficient (α<sub>sy</sub>)</TableCell>
                          <TableCell className="font-mono">{results.bending_y?.alpha}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell><span className="ec-ref">EC2 I.1</span></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">M<sub>Ed,y</sub></TableCell>
                          <TableCell className="font-mono font-bold">{results.bending_y?.M_Ed}</TableCell>
                          <TableCell>kNm/m</TableCell>
                          <TableCell><span className="ec-ref">EC2 6.1</span></TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Reinforcement Tab */}
            <TabsContent value="reinforcement">
              <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-mono font-bold">Reinforcement Design (EC2 9.2)</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Parameter</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Value</TableHead>
                      <TableHead className="font-mono uppercase text-xs bg-slate-100 dark:bg-slate-700">Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.reinforcement?.As_required && (
                      <>
                        <TableRow>
                          <TableCell className="font-medium">A<sub>s,req</sub></TableCell>
                          <TableCell className="font-mono">{results.reinforcement.As_required}</TableCell>
                          <TableCell>mm²/m</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">A<sub>s,min</sub></TableCell>
                          <TableCell className="font-mono">{results.reinforcement.As_minimum}</TableCell>
                          <TableCell>mm²/m</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell className="font-medium font-bold">Bar Size</TableCell>
                          <TableCell className="font-mono font-bold text-blue-600">T{results.reinforcement.bar_diameter}</TableCell>
                          <TableCell>mm</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell className="font-medium font-bold">Spacing</TableCell>
                          <TableCell className="font-mono font-bold text-blue-600">{results.reinforcement.bar_spacing}</TableCell>
                          <TableCell>mm</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">A<sub>s,prov</sub></TableCell>
                          <TableCell className="font-mono font-bold">{results.reinforcement.As_provided}</TableCell>
                          <TableCell>mm²/m</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Utilisation</TableCell>
                          <TableCell className="font-mono">{results.reinforcement.utilisation}%</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </>
                    )}
                    {results.reinforcement_x && (
                      <>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell colSpan={3} className="font-mono font-bold">X-Direction (Bottom)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">A<sub>s,req</sub></TableCell>
                          <TableCell className="font-mono">{results.reinforcement_x.As_required}</TableCell>
                          <TableCell>mm²/m</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Bars Provided</TableCell>
                          <TableCell className="font-mono font-bold text-blue-600">
                            T{results.reinforcement_x.bar_diameter} @ {results.reinforcement_x.bar_spacing} mm
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow className="bg-blue-50 dark:bg-blue-900/20">
                          <TableCell colSpan={3} className="font-mono font-bold">Y-Direction (Top Layer)</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">A<sub>s,req</sub></TableCell>
                          <TableCell className="font-mono">{results.reinforcement_y?.As_required}</TableCell>
                          <TableCell>mm²/m</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Bars Provided</TableCell>
                          <TableCell className="font-mono font-bold text-blue-600">
                            T{results.reinforcement_y?.bar_diameter} @ {results.reinforcement_y?.bar_spacing} mm
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Checks Tab */}
            <TabsContent value="checks">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shear Check */}
                {results.shear && (
                  <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-mono font-bold">Shear Check (EC2 6.2)</h3>
                      <StatusIcon pass={results.shear.shear_ok} />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">V<sub>Ed</sub></span>
                        <span className="font-mono">{results.shear.V_Ed} kN/m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">V<sub>Rd,c</sub></span>
                        <span className="font-mono">{results.shear.V_Rd_c} kN/m</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Utilisation</span>
                        <span className={`font-mono ${results.shear.shear_ok ? "text-green-600" : "text-red-600"}`}>
                          {results.shear.utilisation}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Punching Shear Check */}
                {results.punching_shear && (
                  <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-mono font-bold">Punching Shear (EC2 6.4)</h3>
                      <StatusIcon pass={results.punching_shear.punching_ok} />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">V<sub>Ed</sub></span>
                        <span className="font-mono">{results.punching_shear.V_Ed} kN</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Control Perimeter u<sub>1</sub></span>
                        <span className="font-mono">{results.punching_shear.control_perimeter} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">v<sub>Ed</sub></span>
                        <span className="font-mono">{results.punching_shear.v_Ed} N/mm²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">v<sub>Rd,c</sub></span>
                        <span className="font-mono">{results.punching_shear.v_Rd_c} N/mm²</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Utilisation</span>
                        <span className={`font-mono ${results.punching_shear.punching_ok ? "text-green-600" : "text-red-600"}`}>
                          {results.punching_shear.utilisation}%
                        </span>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Deflection Check */}
                <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-mono font-bold">Deflection (EC2 7.4)</h3>
                    <StatusIcon pass={results.deflection?.deflection_ok} />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">L/d actual</span>
                      <span className="font-mono">{results.deflection?.L_d_actual}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">L/d allowable</span>
                      <span className="font-mono">{results.deflection?.L_d_allowable}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Utilisation</span>
                      <span className={`font-mono ${results.deflection?.deflection_ok ? "text-green-600" : "text-red-600"}`}>
                        {results.deflection?.utilisation}%
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Crack Control Check */}
                {results.crack_control && (
                  <Card className="border rounded-sm bg-white dark:bg-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <h3 className="font-mono font-bold">Crack Control (EC2 7.3)</h3>
                      <StatusIcon pass={results.crack_control.crack_ok} />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Steel Stress σ<sub>s</sub></span>
                        <span className="font-mono">{results.crack_control.steel_stress} MPa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Bar Spacing</span>
                        <span className="font-mono">{results.crack_control.max_bar_spacing} mm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Actual Spacing</span>
                        <span className="font-mono">{results.crack_control.actual_spacing} mm</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Status</span>
                        <span className={`font-mono ${results.crack_control.crack_ok ? "text-green-600" : "text-red-600"}`}>
                          {results.crack_control.crack_ok ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Diagram Tab */}
            <TabsContent value="diagram">
              <Card className="border rounded-sm bg-white dark:bg-slate-800 p-8">
                <div className="font-mono text-xs uppercase tracking-widest text-slate-500 mb-6">
                  Slab Cross-Section Diagram
                </div>
                <SlabDiagram input={input} results={results} />
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

// Simple SVG Slab Diagram
const SlabDiagram = ({ input, results }) => {
  const width = 600;
  const height = 300;
  const margin = 40;
  
  const slabWidth = width - 2 * margin;
  const slabHeight = 80;
  const rebarY = height / 2 + slabHeight / 2 - 25;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl mx-auto">
      {/* Background grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#grid)"/>
      
      {/* Slab concrete */}
      <rect 
        x={margin} 
        y={height/2 - slabHeight/2} 
        width={slabWidth} 
        height={slabHeight} 
        fill="#94a3b8" 
        stroke="#64748b" 
        strokeWidth="2"
      />
      
      {/* Reinforcement bars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle 
          key={i}
          cx={margin + 60 + i * (slabWidth - 120) / 4}
          cy={rebarY}
          r={8}
          fill="#2563eb"
          stroke="#1d4ed8"
          strokeWidth="2"
        />
      ))}
      
      {/* Dimension lines */}
      {/* Span */}
      <line x1={margin} y1={height - 20} x2={margin + slabWidth} y2={height - 20} stroke="#334155" strokeWidth="1"/>
      <line x1={margin} y1={height - 25} x2={margin} y2={height - 15} stroke="#334155" strokeWidth="1"/>
      <line x1={margin + slabWidth} y1={height - 25} x2={margin + slabWidth} y2={height - 15} stroke="#334155" strokeWidth="1"/>
      <text x={width/2} y={height - 5} textAnchor="middle" className="font-mono text-xs fill-slate-700">
        Span = {input.span_x} mm
      </text>
      
      {/* Thickness */}
      <line x1={width - 25} y1={height/2 - slabHeight/2} x2={width - 25} y2={height/2 + slabHeight/2} stroke="#334155" strokeWidth="1"/>
      <line x1={width - 30} y1={height/2 - slabHeight/2} x2={width - 20} y2={height/2 - slabHeight/2} stroke="#334155" strokeWidth="1"/>
      <line x1={width - 30} y1={height/2 + slabHeight/2} x2={width - 20} y2={height/2 + slabHeight/2} stroke="#334155" strokeWidth="1"/>
      <text x={width - 10} y={height/2} textAnchor="start" transform={`rotate(90, ${width - 10}, ${height/2})`} className="font-mono text-xs fill-slate-700">
        h = {input.slab_thickness} mm
      </text>
      
      {/* Cover dimension */}
      <line x1={margin + 60} y1={height/2 + slabHeight/2} x2={margin + 60} y2={rebarY + 8} stroke="#f97316" strokeWidth="1" strokeDasharray="4"/>
      <text x={margin + 75} y={height/2 + slabHeight/2 - 5} className="font-mono text-xs fill-orange-600">
        c = {input.cover} mm
      </text>
      
      {/* Legend */}
      <rect x={margin} y={20} width={15} height={15} fill="#94a3b8" stroke="#64748b"/>
      <text x={margin + 22} y={32} className="font-mono text-xs fill-slate-700">{input.concrete_grade}</text>
      
      <circle cx={margin + 100} cy={27} r={6} fill="#2563eb" stroke="#1d4ed8"/>
      <text x={margin + 112} y={32} className="font-mono text-xs fill-slate-700">
        {results.reinforcement?.bar_diameter 
          ? `T${results.reinforcement.bar_diameter}@${results.reinforcement.bar_spacing}`
          : results.reinforcement_x
            ? `T${results.reinforcement_x.bar_diameter}@${results.reinforcement_x.bar_spacing}`
            : "Reinforcement"
        }
      </text>
    </svg>
  );
};

export default ProjectView;
