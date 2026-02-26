import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const ResultCard = ({ title, value, unit, status, utilization, subtitle }) => {
  const getStatusColor = () => {
    if (!status) return '';
    if (status === 'PASS' || status.includes('PASS')) return 'status-pass';
    if (status === 'FAIL') return 'status-fail';
    return '';
  };
  
  const getStatusIcon = () => {
    if (!status) return null;
    if (status === 'PASS' || status.includes('PASS')) {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    }
    if (status === 'FAIL') {
      return <XCircle className="w-5 h-5 text-red-400" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };
  
  const getUtilizationColor = () => {
    if (!utilization) return 'bg-muted';
    if (utilization <= 0.7) return 'bg-emerald-500';
    if (utilization <= 0.9) return 'bg-yellow-500';
    if (utilization <= 1.0) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="result-card card-hover" data-testid={`result-card-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="result-card-header">
        <span className="result-card-title">{title}</span>
        {status && (
          <span className={cn('status-indicator', getStatusColor())}>
            <span className="flex items-center gap-1">
              {getStatusIcon()}
              {status}
            </span>
          </span>
        )}
      </div>
      
      <div className="flex items-baseline">
        <span className="result-card-value">{value}</span>
        {unit && <span className="result-card-unit">{unit}</span>}
      </div>
      
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
      )}
      
      {utilization !== undefined && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Utilization</span>
            <span className="font-mono">{(utilization * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-500', getUtilizationColor())}
              style={{ width: `${Math.min(utilization * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const ResultsTable = ({ title, data }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <div className="result-card" data-testid={`results-table-${title?.toLowerCase().replace(/\s+/g, '-')}`}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="results-table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="text-muted-foreground">{row.label}</td>
                <td className="font-mono">{row.value}</td>
                <td className="text-muted-foreground">{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SummaryCard = ({ results }) => {
  if (!results) return null;
  
  const checks = [
    { name: 'Flexure', status: results.flexure?.status, util: results.flexure?.utilization },
    { name: 'Shear', status: results.shear?.status, util: results.shear?.utilization },
    { name: 'Deflection', status: results.deflection?.status, util: results.deflection?.utilization },
    { name: 'Crack Width', status: results.crack_width?.status, util: results.crack_width?.utilization },
  ];
  
  const overallPass = results.overall_status === 'PASS';
  
  return (
    <div 
      className={cn(
        'result-card border-2',
        overallPass ? 'border-emerald-500/50' : 'border-red-500/50'
      )}
      data-testid="summary-card"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-lg font-semibold">Design Summary</span>
        <span className={cn(
          'px-4 py-2 rounded text-sm font-bold',
          overallPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
        )}>
          {results.overall_status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {checks.map((check) => (
          <div key={check.name} className="flex items-center justify-between p-3 bg-muted/30 rounded">
            <span className="text-sm text-muted-foreground">{check.name}</span>
            <span className={cn(
              'text-sm font-semibold',
              check.status === 'PASS' || check.status?.includes('PASS') ? 'text-emerald-400' : 'text-red-400'
            )}>
              {check.status || 'N/A'}
            </span>
          </div>
        ))}
      </div>
      
      {!results.cable_concordancy && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-sm">
          Warning: Cable concordancy check failed. Review tendon profile.
        </div>
      )}
    </div>
  );
};

export default ResultCard;
