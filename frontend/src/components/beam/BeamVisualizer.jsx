import React, { useMemo } from 'react';

export const BeamVisualizer = ({ section, tendonProfile, eccentricity, height }) => {
  const svgContent = useMemo(() => {
    const viewBoxWidth = 400;
    const viewBoxHeight = 300;
    const padding = 40;
    const beamWidth = viewBoxWidth - 2 * padding;
    const beamHeight = Math.min(viewBoxHeight - 2 * padding, 200);
    
    const scale = beamHeight / (height || 800);
    
    // Calculate section shape based on type
    const getSectionPath = () => {
      const centerX = viewBoxWidth / 2;
      const topY = padding;
      const bottomY = padding + beamHeight;
      
      if (section.section_type === 'rectangular') {
        const w = (section.rectangular?.width || 400) * scale;
        return (
          <rect
            x={centerX - w / 2}
            y={topY}
            width={w}
            height={beamHeight}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground"
          />
        );
      }
      
      if (section.section_type === 't_beam') {
        const bw = (section.t_beam?.bw || 300) * scale;
        const bf = (section.t_beam?.bf || 1000) * scale;
        const hf = (section.t_beam?.hf || 150) * scale;
        
        return (
          <path
            d={`
              M ${centerX - bf / 2} ${topY}
              L ${centerX + bf / 2} ${topY}
              L ${centerX + bf / 2} ${topY + hf}
              L ${centerX + bw / 2} ${topY + hf}
              L ${centerX + bw / 2} ${bottomY}
              L ${centerX - bw / 2} ${bottomY}
              L ${centerX - bw / 2} ${topY + hf}
              L ${centerX - bf / 2} ${topY + hf}
              Z
            `}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground"
          />
        );
      }
      
      if (section.section_type === 'i_beam') {
        const bw = (section.i_beam?.bw || 200) * scale;
        const bfTop = (section.i_beam?.bf_top || 600) * scale;
        const bfBot = (section.i_beam?.bf_bot || 600) * scale;
        const hfTop = (section.i_beam?.hf_top || 150) * scale;
        const hfBot = (section.i_beam?.hf_bot || 200) * scale;
        
        return (
          <path
            d={`
              M ${centerX - bfTop / 2} ${topY}
              L ${centerX + bfTop / 2} ${topY}
              L ${centerX + bfTop / 2} ${topY + hfTop}
              L ${centerX + bw / 2} ${topY + hfTop}
              L ${centerX + bw / 2} ${bottomY - hfBot}
              L ${centerX + bfBot / 2} ${bottomY - hfBot}
              L ${centerX + bfBot / 2} ${bottomY}
              L ${centerX - bfBot / 2} ${bottomY}
              L ${centerX - bfBot / 2} ${bottomY - hfBot}
              L ${centerX - bw / 2} ${bottomY - hfBot}
              L ${centerX - bw / 2} ${topY + hfTop}
              L ${centerX - bfTop / 2} ${topY + hfTop}
              Z
            `}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted-foreground"
          />
        );
      }
      
      if (section.section_type === 'box_girder') {
        const bTop = (section.box_girder?.b_top || 2000) * scale * 0.15;
        const bBot = (section.box_girder?.b_bot || 1200) * scale * 0.15;
        const tTop = (section.box_girder?.t_top || 200) * scale;
        const tBot = (section.box_girder?.t_bot || 200) * scale;
        const tWeb = (section.box_girder?.t_web || 200) * scale;
        
        return (
          <>
            {/* Outer shape */}
            <path
              d={`
                M ${centerX - bTop / 2} ${topY}
                L ${centerX + bTop / 2} ${topY}
                L ${centerX + bBot / 2} ${bottomY}
                L ${centerX - bBot / 2} ${bottomY}
                Z
              `}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground"
            />
            {/* Inner void */}
            <path
              d={`
                M ${centerX - bTop / 2 + tWeb} ${topY + tTop}
                L ${centerX + bTop / 2 - tWeb} ${topY + tTop}
                L ${centerX + bBot / 2 - tWeb} ${bottomY - tBot}
                L ${centerX - bBot / 2 + tWeb} ${bottomY - tBot}
                Z
              `}
              fill="hsl(228, 15%, 5%)"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground"
            />
          </>
        );
      }
      
      // Default rectangle
      return (
        <rect
          x={centerX - beamWidth / 4}
          y={topY}
          width={beamWidth / 2}
          height={beamHeight}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted-foreground"
        />
      );
    };
    
    // Tendon path
    const getTendonPath = () => {
      const centerX = viewBoxWidth / 2;
      const topY = padding;
      const bottomY = padding + beamHeight;
      const centroidY = (topY + bottomY) / 2;
      const e = (eccentricity || 200) * scale;
      const tendonY = centroidY + e;
      
      if (tendonProfile === 'straight') {
        return (
          <>
            <line
              x1={padding}
              y1={tendonY}
              x2={viewBoxWidth - padding}
              y2={tendonY}
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="8,4"
              className="text-primary"
            />
            <circle cx={padding} cy={tendonY} r="5" fill="currentColor" className="text-primary" />
            <circle cx={viewBoxWidth - padding} cy={tendonY} r="5" fill="currentColor" className="text-primary" />
          </>
        );
      }
      
      if (tendonProfile === 'parabolic') {
        const endY = centroidY;
        const midY = tendonY;
        return (
          <>
            <path
              d={`M ${padding} ${endY} Q ${centerX} ${midY + 20} ${viewBoxWidth - padding} ${endY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="8,4"
              className="text-primary"
            />
            <circle cx={padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
            <circle cx={centerX} cy={midY + 10} r="5" fill="currentColor" className="text-primary" />
            <circle cx={viewBoxWidth - padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
          </>
        );
      }
      
      if (tendonProfile === 'harped') {
        const endY = centroidY;
        const drapeY = tendonY;
        const drapeX1 = padding + beamWidth * 0.3;
        const drapeX2 = viewBoxWidth - padding - beamWidth * 0.3;
        return (
          <>
            <path
              d={`M ${padding} ${endY} L ${drapeX1} ${drapeY} L ${drapeX2} ${drapeY} L ${viewBoxWidth - padding} ${endY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="8,4"
              className="text-primary"
            />
            <circle cx={padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
            <circle cx={drapeX1} cy={drapeY} r="5" fill="currentColor" className="text-primary" />
            <circle cx={drapeX2} cy={drapeY} r="5" fill="currentColor" className="text-primary" />
            <circle cx={viewBoxWidth - padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
          </>
        );
      }
      
      // multi_parabolic
      const endY = centroidY;
      const midY = tendonY;
      return (
        <>
          <path
            d={`M ${padding} ${endY} Q ${padding + beamWidth * 0.25} ${midY} ${centerX} ${midY - 10} Q ${viewBoxWidth - padding - beamWidth * 0.25} ${midY} ${viewBoxWidth - padding} ${endY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="8,4"
            className="text-primary"
          />
          <circle cx={padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
          <circle cx={centerX} cy={midY - 10} r="5" fill="currentColor" className="text-primary" />
          <circle cx={viewBoxWidth - padding} cy={endY} r="5" fill="currentColor" className="text-primary" />
        </>
      );
    };
    
    // Centerline
    const getCenterline = () => {
      const topY = padding;
      const bottomY = padding + beamHeight;
      const centroidY = (topY + bottomY) / 2;
      
      return (
        <line
          x1={padding - 20}
          y1={centroidY}
          x2={viewBoxWidth - padding + 20}
          y2={centroidY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4,4"
          className="text-muted-foreground/50"
        />
      );
    };
    
    return (
      <>
        {getCenterline()}
        {getSectionPath()}
        {getTendonPath()}
        {/* Labels */}
        <text x={padding} y={viewBoxHeight - 10} className="text-xs fill-muted-foreground">
          Section View
        </text>
        <text x={viewBoxWidth - padding} y={viewBoxHeight - 10} textAnchor="end" className="text-xs fill-muted-foreground">
          h = {height || 800} mm
        </text>
      </>
    );
  }, [section, tendonProfile, eccentricity, height]);
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 blueprint-grid" data-testid="beam-visualizer">
      <svg 
        viewBox="0 0 400 300" 
        className="w-full max-w-lg"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {svgContent}
      </svg>
    </div>
  );
};

export default BeamVisualizer;
