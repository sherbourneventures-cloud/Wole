import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';

export const MagnelDiagram = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data) return { lines: [], optimal: null };
    
    const formatLine = (points, name) => {
      if (!points || points.length === 0) return [];
      return points.map(p => ({
        x: p.eccentricity,
        y: p.inverse_force,
        name
      }));
    };
    
    return {
      line1: formatLine(data.line1_top_transfer, 'Top @ Transfer'),
      line2: formatLine(data.line2_bot_transfer, 'Bottom @ Transfer'),
      line3: formatLine(data.line3_top_service, 'Top @ Service'),
      line4: formatLine(data.line4_bot_service, 'Bottom @ Service'),
      optimal: data.optimal_point ? {
        x: data.optimal_point.eccentricity,
        y: data.optimal_point.inverse_force
      } : null
    };
  }, [data]);
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Run analysis to view Magnel diagram
      </div>
    );
  }
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const force = point.y > 0 ? (1 / (point.y / 1000)).toFixed(0) : 'N/A';
      return (
        <div className="bg-card border border-border rounded p-3 shadow-lg">
          <p className="text-sm font-mono">
            <span className="text-muted-foreground">e:</span> {point.x?.toFixed(1)} mm
          </p>
          <p className="text-sm font-mono">
            <span className="text-muted-foreground">1/P:</span> {point.y?.toFixed(6)} 1/kN
          </p>
          <p className="text-sm font-mono">
            <span className="text-muted-foreground">P:</span> {force} kN
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="chart-container h-full min-h-[400px]" data-testid="magnel-diagram">
      <div className="text-sm font-semibold text-muted-foreground mb-4">
        Magnel Diagram - Feasible Design Region
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(215, 20%, 20%)"
            opacity={0.5}
          />
          <XAxis 
            dataKey="x" 
            type="number"
            name="Eccentricity"
            unit=" mm"
            stroke="hsl(215, 10%, 65%)"
            tick={{ fill: 'hsl(215, 10%, 65%)', fontSize: 10 }}
            label={{ 
              value: 'Eccentricity e (mm)', 
              position: 'bottom',
              fill: 'hsl(215, 10%, 65%)',
              fontSize: 11
            }}
          />
          <YAxis 
            dataKey="y" 
            type="number"
            name="1/P"
            stroke="hsl(215, 10%, 65%)"
            tick={{ fill: 'hsl(215, 10%, 65%)', fontSize: 10 }}
            tickFormatter={(v) => v.toExponential(1)}
            label={{ 
              value: '1/P (1/kN)', 
              angle: -90, 
              position: 'insideLeft',
              fill: 'hsl(215, 10%, 65%)',
              fontSize: 11
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '10px' }}
          />
          
          {/* Constraint lines */}
          <Scatter 
            name="Top @ Transfer" 
            data={chartData.line1} 
            fill="hsl(176, 96%, 69%)" 
            line={{ stroke: 'hsl(176, 96%, 69%)', strokeWidth: 2 }}
            shape="circle"
            r={0}
          />
          <Scatter 
            name="Bottom @ Transfer" 
            data={chartData.line2} 
            fill="hsl(48, 89%, 60%)" 
            line={{ stroke: 'hsl(48, 89%, 60%)', strokeWidth: 2 }}
            shape="circle"
            r={0}
          />
          <Scatter 
            name="Top @ Service" 
            data={chartData.line3} 
            fill="hsl(215, 60%, 50%)" 
            line={{ stroke: 'hsl(215, 60%, 50%)', strokeWidth: 2 }}
            shape="circle"
            r={0}
          />
          <Scatter 
            name="Bottom @ Service" 
            data={chartData.line4} 
            fill="hsl(0, 80%, 60%)" 
            line={{ stroke: 'hsl(0, 80%, 60%)', strokeWidth: 2 }}
            shape="circle"
            r={0}
          />
          
          {/* Optimal point */}
          {chartData.optimal && (
            <Scatter 
              name="Optimal" 
              data={[chartData.optimal]} 
              fill="hsl(280, 65%, 60%)"
              shape="star"
              r={8}
            />
          )}
          
          <ReferenceLine x={0} stroke="hsl(215, 20%, 30%)" strokeDasharray="3 3" />
        </ScatterChart>
      </ResponsiveContainer>
      
      {chartData.optimal && (
        <div className="mt-4 p-3 bg-muted/30 rounded text-sm font-mono">
          <span className="text-muted-foreground">Optimal:</span>{' '}
          <span className="text-primary">P = {(1 / (chartData.optimal.y / 1000)).toFixed(0)} kN</span>,{' '}
          <span className="text-accent">e = {chartData.optimal.x.toFixed(1)} mm</span>
        </div>
      )}
    </div>
  );
};

export default MagnelDiagram;
