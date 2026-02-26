import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Calculator, 
  FileText, 
  Loader2,
  Download,
  ArrowLeft
} from 'lucide-react';

import { SectionSelector } from '../components/beam/SectionSelector';
import { TendonProfileSelector } from '../components/beam/TendonProfileSelector';
import { BeamVisualizer } from '../components/beam/BeamVisualizer';
import { MagnelDiagram } from '../components/beam/MagnelDiagram';
import { ResultCard, ResultsTable, SummaryCard } from '../components/beam/ResultsDisplay';

import { analyzeBeam, generatePdf } from '../api';

const DEFAULT_FORM = {
  project_name: 'Prestressed Beam Project',
  beam_name: 'Beam 1',
  span: 20,
  section_type: 'rectangular',
  width: 400,
  height: 800,
  bw: 300,
  bf: 1000,
  hf: 150,
  bf_top: 600,
  bf_bot: 600,
  hf_top: 150,
  hf_bot: 200,
  b_top: 2000,
  b_bot: 1200,
  b_int: 1000,
  t_top: 200,
  t_bot: 200,
  t_web: 200,
  concrete: {
    fck: 40,
    creep_coefficient: 2.0,
    shrinkage_strain: 0.0003,
    density: 25.0
  },
  steel: {
    fp01k: 1640,
    fpk: 1860,
    Ep: 195,
    strand_area: 140,
    num_strands: 12,
    relaxation_class: 2
  },
  prestress_type: 'post_tensioned',
  jacking_stress: 1400,
  tendon_profile: 'parabolic',
  eccentricity: 250,
  e_end: 0,
  e_mid: 300,
  e_support: 0,
  e_drape: 300,
  drape_position: 0.4,
  friction_coefficient: 0.19,
  wobble_coefficient: 0.008,
  include_self_weight: true,
  imposed_udl: 15,
  permanent_udl: 5
};

const BeamDesign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('geometry');

  const updateForm = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateNestedForm = useCallback((parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await analyzeBeam(formData);
      setResults(response.data.results);
      toast.success('Analysis completed successfully');
      setActiveTab('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error.response?.data?.detail || 'Analysis failed. Check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      const response = await generatePdf(formData);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.project_name.replace(/\s+/g, '_')}_${formData.beam_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report generated');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setPdfLoading(false);
    }
  };

  const getHeight = () => {
    if (formData.section_type === 'rectangular') return formData.height;
    if (formData.section_type === 't_beam') return formData.height;
    if (formData.section_type === 'i_beam') return formData.height;
    if (formData.section_type === 'box_girder') return formData.height;
    return 800;
  };

  const buildSection = () => {
    const type = formData.section_type;
    if (type === 'rectangular') {
      return {
        section_type: type,
        rectangular: { width: formData.width, height: formData.height }
      };
    }
    if (type === 't_beam') {
      return {
        section_type: type,
        t_beam: { bw: formData.bw, bf: formData.bf, hf: formData.hf, h: formData.height }
      };
    }
    if (type === 'i_beam') {
      return {
        section_type: type,
        i_beam: { 
          bw: formData.bw, 
          bf_top: formData.bf_top, 
          bf_bot: formData.bf_bot,
          hf_top: formData.hf_top,
          hf_bot: formData.hf_bot,
          h: formData.height 
        }
      };
    }
    if (type === 'box_girder') {
      return {
        section_type: type,
        box_girder: {
          b_top: formData.b_top,
          b_bot: formData.b_bot,
          b_int: formData.b_int,
          t_top: formData.t_top,
          t_bot: formData.t_bot,
          t_web: formData.t_web,
          h: formData.height
        }
      };
    }
    return { section_type: 'rectangular', rectangular: { width: 400, height: 800 } };
  };

  const getEccentricity = () => {
    if (formData.tendon_profile === 'straight') return formData.eccentricity;
    if (formData.tendon_profile === 'parabolic') return formData.e_mid;
    if (formData.tendon_profile === 'harped') return formData.e_drape;
    return formData.e_mid;
  };

  return (
    <div className="page-container" data-testid="beam-design-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-heading">Beam Design</h1>
            <p className="text-sm text-muted-foreground">Prestressed beam analysis per EC2</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="gap-2"
            data-testid="analyze-btn"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Analyze
          </Button>
          <Button 
            variant="outline" 
            onClick={handleGeneratePdf}
            disabled={pdfLoading || !results}
            className="gap-2"
            data-testid="pdf-btn"
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            PDF Report
          </Button>
        </div>
      </div>

      {/* Main Layout - Split View */}
      <div className="split-view">
        {/* Left - Visualizer */}
        <div className="split-view-left">
          <Tabs defaultValue="section" className="h-full">
            <div className="border-b border-border p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="section" data-testid="tab-section">Section View</TabsTrigger>
                <TabsTrigger value="magnel" data-testid="tab-magnel">Magnel Diagram</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="section" className="h-[calc(100%-60px)] m-0">
              <BeamVisualizer 
                section={buildSection()}
                tendonProfile={formData.tendon_profile}
                eccentricity={getEccentricity()}
                height={getHeight()}
              />
            </TabsContent>
            <TabsContent value="magnel" className="h-[calc(100%-60px)] m-0 p-4">
              <MagnelDiagram data={results?.magnel_diagram} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right - Input Forms */}
        <ScrollArea className="split-view-right h-[calc(100vh-180px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="geometry" data-testid="tab-geometry">Geometry</TabsTrigger>
              <TabsTrigger value="materials" data-testid="tab-materials">Materials</TabsTrigger>
              <TabsTrigger value="prestress" data-testid="tab-prestress">Prestress</TabsTrigger>
              <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
            </TabsList>

            {/* Geometry Tab */}
            <TabsContent value="geometry" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">Project Name</Label>
                      <Input 
                        value={formData.project_name}
                        onChange={(e) => updateForm('project_name', e.target.value)}
                        data-testid="input-project-name"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Beam Name</Label>
                      <Input 
                        value={formData.beam_name}
                        onChange={(e) => updateForm('beam_name', e.target.value)}
                        data-testid="input-beam-name"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Span <span className="input-unit">(m)</span></Label>
                      <Input 
                        type="number"
                        step="0.1"
                        className="font-mono"
                        value={formData.span}
                        onChange={(e) => updateForm('span', parseFloat(e.target.value))}
                        data-testid="input-span"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Section Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <SectionSelector 
                    value={formData.section_type}
                    onChange={(v) => updateForm('section_type', v)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Section Dimensions</CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.section_type === 'rectangular' && (
                    <div className="input-row">
                      <div className="input-field">
                        <Label className="input-label">Width (b) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.width}
                          onChange={(e) => updateForm('width', parseFloat(e.target.value))}
                          data-testid="input-width"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Height (h) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.height}
                          onChange={(e) => updateForm('height', parseFloat(e.target.value))}
                          data-testid="input-height"
                        />
                      </div>
                    </div>
                  )}

                  {formData.section_type === 't_beam' && (
                    <div className="input-row">
                      <div className="input-field">
                        <Label className="input-label">Web Width (bw) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.bw}
                          onChange={(e) => updateForm('bw', parseFloat(e.target.value))}
                          data-testid="input-bw"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Flange Width (bf) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.bf}
                          onChange={(e) => updateForm('bf', parseFloat(e.target.value))}
                          data-testid="input-bf"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Flange Thickness (hf) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.hf}
                          onChange={(e) => updateForm('hf', parseFloat(e.target.value))}
                          data-testid="input-hf"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Total Height (h) <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.height}
                          onChange={(e) => updateForm('height', parseFloat(e.target.value))}
                          data-testid="input-height-t"
                        />
                      </div>
                    </div>
                  )}

                  {formData.section_type === 'i_beam' && (
                    <div className="space-y-4">
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Web Width (bw) <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.bw}
                            onChange={(e) => updateForm('bw', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Total Height (h) <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.height}
                            onChange={(e) => updateForm('height', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Top Flange Width <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.bf_top}
                            onChange={(e) => updateForm('bf_top', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Top Flange Thickness <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.hf_top}
                            onChange={(e) => updateForm('hf_top', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Bottom Flange Width <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.bf_bot}
                            onChange={(e) => updateForm('bf_bot', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Bottom Flange Thickness <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.hf_bot}
                            onChange={(e) => updateForm('hf_bot', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.section_type === 'box_girder' && (
                    <div className="space-y-4">
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Top Width <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.b_top}
                            onChange={(e) => updateForm('b_top', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Bottom Width <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.b_bot}
                            onChange={(e) => updateForm('b_bot', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Total Height <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.height}
                            onChange={(e) => updateForm('height', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Top Slab Thickness <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.t_top}
                            onChange={(e) => updateForm('t_top', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Bottom Slab Thickness <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.t_bot}
                            onChange={(e) => updateForm('t_bot', parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Web Thickness <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.t_web}
                            onChange={(e) => updateForm('t_web', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Loading</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="input-label">Include Self-Weight</Label>
                    <Switch 
                      checked={formData.include_self_weight}
                      onCheckedChange={(v) => updateForm('include_self_weight', v)}
                      data-testid="switch-self-weight"
                    />
                  </div>
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">Additional Permanent Load <span className="input-unit">(kN/m)</span></Label>
                      <Input 
                        type="number"
                        step="0.1"
                        className="font-mono"
                        value={formData.permanent_udl}
                        onChange={(e) => updateForm('permanent_udl', parseFloat(e.target.value))}
                        data-testid="input-permanent-udl"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Imposed Load <span className="input-unit">(kN/m)</span></Label>
                      <Input 
                        type="number"
                        step="0.1"
                        className="font-mono"
                        value={formData.imposed_udl}
                        onChange={(e) => updateForm('imposed_udl', parseFloat(e.target.value))}
                        data-testid="input-imposed-udl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concrete Properties (EC2 Table 3.1)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">Characteristic Strength (fck) <span className="input-unit">(MPa)</span></Label>
                      <Select 
                        value={String(formData.concrete.fck)}
                        onValueChange={(v) => updateNestedForm('concrete', 'fck', parseFloat(v))}
                      >
                        <SelectTrigger className="font-mono" data-testid="select-fck">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90].map(v => (
                            <SelectItem key={v} value={String(v)}>C{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Creep Coefficient (φ)</Label>
                      <Input 
                        type="number"
                        step="0.1"
                        className="font-mono"
                        value={formData.concrete.creep_coefficient}
                        onChange={(e) => updateNestedForm('concrete', 'creep_coefficient', parseFloat(e.target.value))}
                        data-testid="input-creep"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Shrinkage Strain (εcs)</Label>
                      <Input 
                        type="number"
                        step="0.0001"
                        className="font-mono"
                        value={formData.concrete.shrinkage_strain}
                        onChange={(e) => updateNestedForm('concrete', 'shrinkage_strain', parseFloat(e.target.value))}
                        data-testid="input-shrinkage"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prestressing Steel Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">0.1% Proof Stress (fp0.1k) <span className="input-unit">(MPa)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.steel.fp01k}
                        onChange={(e) => updateNestedForm('steel', 'fp01k', parseFloat(e.target.value))}
                        data-testid="input-fp01k"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Tensile Strength (fpk) <span className="input-unit">(MPa)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.steel.fpk}
                        onChange={(e) => updateNestedForm('steel', 'fpk', parseFloat(e.target.value))}
                        data-testid="input-fpk"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Modulus (Ep) <span className="input-unit">(GPa)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.steel.Ep}
                        onChange={(e) => updateNestedForm('steel', 'Ep', parseFloat(e.target.value))}
                        data-testid="input-Ep"
                      />
                    </div>
                  </div>
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">Strand Area <span className="input-unit">(mm²)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.steel.strand_area}
                        onChange={(e) => updateNestedForm('steel', 'strand_area', parseFloat(e.target.value))}
                        data-testid="input-strand-area"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Number of Strands</Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.steel.num_strands}
                        onChange={(e) => updateNestedForm('steel', 'num_strands', parseInt(e.target.value))}
                        data-testid="input-num-strands"
                      />
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Relaxation Class</Label>
                      <Select 
                        value={String(formData.steel.relaxation_class)}
                        onValueChange={(v) => updateNestedForm('steel', 'relaxation_class', parseInt(v))}
                      >
                        <SelectTrigger className="font-mono" data-testid="select-relaxation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Class 1 - Normal</SelectItem>
                          <SelectItem value="2">Class 2 - Low Relaxation</SelectItem>
                          <SelectItem value="3">Class 3 - Very Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Prestress Tab */}
            <TabsContent value="prestress" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prestress Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="input-row">
                    <div className="input-field">
                      <Label className="input-label">Prestress Type</Label>
                      <Select 
                        value={formData.prestress_type}
                        onValueChange={(v) => updateForm('prestress_type', v)}
                      >
                        <SelectTrigger data-testid="select-prestress-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pretensioned">Pre-tensioned</SelectItem>
                          <SelectItem value="post_tensioned">Post-tensioned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="input-field">
                      <Label className="input-label">Jacking Stress <span className="input-unit">(MPa)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.jacking_stress}
                        onChange={(e) => updateForm('jacking_stress', parseFloat(e.target.value))}
                        data-testid="input-jacking-stress"
                      />
                    </div>
                  </div>
                  
                  {formData.prestress_type === 'post_tensioned' && (
                    <div className="input-row">
                      <div className="input-field">
                        <Label className="input-label">Friction Coefficient (μ)</Label>
                        <Input 
                          type="number"
                          step="0.01"
                          className="font-mono"
                          value={formData.friction_coefficient}
                          onChange={(e) => updateForm('friction_coefficient', parseFloat(e.target.value))}
                          data-testid="input-friction"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Wobble Coefficient (k) <span className="input-unit">(1/m)</span></Label>
                        <Input 
                          type="number"
                          step="0.001"
                          className="font-mono"
                          value={formData.wobble_coefficient}
                          onChange={(e) => updateForm('wobble_coefficient', parseFloat(e.target.value))}
                          data-testid="input-wobble"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tendon Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TendonProfileSelector 
                    value={formData.tendon_profile}
                    onChange={(v) => updateForm('tendon_profile', v)}
                  />
                  
                  {formData.tendon_profile === 'straight' && (
                    <div className="input-field">
                      <Label className="input-label">Eccentricity (e) <span className="input-unit">(mm)</span></Label>
                      <Input 
                        type="number"
                        className="font-mono"
                        value={formData.eccentricity}
                        onChange={(e) => updateForm('eccentricity', parseFloat(e.target.value))}
                        data-testid="input-eccentricity"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Positive = below centroid
                      </p>
                    </div>
                  )}
                  
                  {formData.tendon_profile === 'parabolic' && (
                    <div className="input-row">
                      <div className="input-field">
                        <Label className="input-label">Eccentricity at Ends <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.e_end}
                          onChange={(e) => updateForm('e_end', parseFloat(e.target.value))}
                          data-testid="input-e-end"
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Eccentricity at Mid-span <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.e_mid}
                          onChange={(e) => updateForm('e_mid', parseFloat(e.target.value))}
                          data-testid="input-e-mid"
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.tendon_profile === 'harped' && (
                    <div className="space-y-4">
                      <div className="input-row">
                        <div className="input-field">
                          <Label className="input-label">Eccentricity at Support <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.e_support}
                            onChange={(e) => updateForm('e_support', parseFloat(e.target.value))}
                            data-testid="input-e-support"
                          />
                        </div>
                        <div className="input-field">
                          <Label className="input-label">Eccentricity at Drape Point <span className="input-unit">(mm)</span></Label>
                          <Input 
                            type="number"
                            className="font-mono"
                            value={formData.e_drape}
                            onChange={(e) => updateForm('e_drape', parseFloat(e.target.value))}
                            data-testid="input-e-drape"
                          />
                        </div>
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Drape Point Position (fraction of span)</Label>
                        <Input 
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="0.5"
                          className="font-mono"
                          value={formData.drape_position}
                          onChange={(e) => updateForm('drape_position', parseFloat(e.target.value))}
                          data-testid="input-drape-position"
                        />
                      </div>
                    </div>
                  )}
                  
                  {formData.tendon_profile === 'multi_parabolic' && (
                    <div className="input-row">
                      <div className="input-field">
                        <Label className="input-label">Eccentricity at Ends <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.e_end}
                          onChange={(e) => updateForm('e_end', parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="input-field">
                        <Label className="input-label">Eccentricity at Mid-span <span className="input-unit">(mm)</span></Label>
                        <Input 
                          type="number"
                          className="font-mono"
                          value={formData.e_mid}
                          onChange={(e) => updateForm('e_mid', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {!results ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Run analysis to view results</p>
                    <Button 
                      onClick={handleAnalyze} 
                      disabled={loading}
                      className="mt-4"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Run Analysis
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <SummaryCard results={results} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ResultCard 
                      title="Flexure"
                      value={results.flexure?.M_Rd?.toFixed(1)}
                      unit="kNm"
                      status={results.flexure?.status}
                      utilization={results.flexure?.utilization}
                      subtitle={`M_Ed = ${results.flexure?.M_Ed?.toFixed(1)} kNm`}
                    />
                    <ResultCard 
                      title="Shear"
                      value={results.shear?.V_Rd_c?.toFixed(1)}
                      unit="kN"
                      status={results.shear?.status}
                      utilization={results.shear?.utilization}
                      subtitle={`V_Ed = ${results.shear?.V_Ed?.toFixed(1)} kN`}
                    />
                    <ResultCard 
                      title="Deflection"
                      value={results.deflection?.delta_total?.toFixed(2)}
                      unit="mm"
                      status={results.deflection?.status}
                      utilization={results.deflection?.utilization}
                      subtitle={`L/${results.deflection?.span_ratio?.toFixed(0)}`}
                    />
                    <ResultCard 
                      title="Crack Width"
                      value={results.crack_width?.wk?.toFixed(3)}
                      unit="mm"
                      status={results.crack_width?.status}
                      utilization={results.crack_width?.utilization}
                      subtitle={`Limit = ${results.crack_width?.wk_limit} mm`}
                    />
                  </div>
                  
                  <ResultsTable 
                    title="Prestress Losses"
                    data={[
                      { label: 'Elastic Shortening', value: results.prestress_losses?.elastic_shortening?.toFixed(2), unit: 'MPa' },
                      { label: 'Friction', value: results.prestress_losses?.friction?.toFixed(2), unit: 'MPa' },
                      { label: 'Anchorage Slip', value: results.prestress_losses?.anchorage_slip?.toFixed(2), unit: 'MPa' },
                      { label: 'Creep', value: results.prestress_losses?.creep?.toFixed(2), unit: 'MPa' },
                      { label: 'Shrinkage', value: results.prestress_losses?.shrinkage?.toFixed(2), unit: 'MPa' },
                      { label: 'Relaxation', value: results.prestress_losses?.relaxation?.toFixed(2), unit: 'MPa' },
                      { label: 'Total Losses', value: results.prestress_losses?.total?.toFixed(2), unit: 'MPa' },
                      { label: 'Loss Ratio', value: results.prestress_losses?.loss_ratio?.toFixed(1), unit: '%' },
                    ]}
                  />
                  
                  <ResultsTable 
                    title="Section Properties"
                    data={[
                      { label: 'Area', value: results.section_properties?.area?.toLocaleString(), unit: 'mm²' },
                      { label: 'Second Moment (I)', value: results.section_properties?.I?.toExponential(3), unit: 'mm⁴' },
                      { label: 'Ztop', value: results.section_properties?.Z_top?.toExponential(3), unit: 'mm³' },
                      { label: 'Zbot', value: results.section_properties?.Z_bot?.toExponential(3), unit: 'mm³' },
                      { label: 'y_top', value: results.section_properties?.y_top?.toFixed(1), unit: 'mm' },
                      { label: 'y_bot', value: results.section_properties?.y_bot?.toFixed(1), unit: 'mm' },
                    ]}
                  />
                  
                  <ResultsTable 
                    title="Stress Verification"
                    data={[
                      { label: 'Top Fiber @ Transfer', value: results.flexure?.sigma_top_transfer?.toFixed(2), unit: 'MPa' },
                      { label: 'Bottom Fiber @ Transfer', value: results.flexure?.sigma_bot_transfer?.toFixed(2), unit: 'MPa' },
                      { label: 'Top Fiber @ Service', value: results.flexure?.sigma_top_service?.toFixed(2), unit: 'MPa' },
                      { label: 'Bottom Fiber @ Service', value: results.flexure?.sigma_bot_service?.toFixed(2), unit: 'MPa' },
                    ]}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </div>
    </div>
  );
};

export default BeamDesign;
