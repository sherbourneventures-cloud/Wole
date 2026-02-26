import React from 'react';
import { cn } from '../../lib/utils';
import { 
  Square, 
  Minus,
  Box
} from 'lucide-react';

const sections = [
  {
    id: 'rectangular',
    name: 'Rectangular',
    icon: Square,
    description: 'Simple rectangular beam'
  },
  {
    id: 't_beam',
    name: 'T-Beam',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16v4H14v10h-4V10H4V6z" />
      </svg>
    ),
    description: 'T-section with top flange'
  },
  {
    id: 'i_beam',
    name: 'I-Beam',
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16v3H14v10h6v3H4v-3h6V7H4V4z" />
      </svg>
    ),
    description: 'Double-T section'
  },
  {
    id: 'box_girder',
    name: 'Box Girder',
    icon: Box,
    description: 'Hollow box section'
  }
];

export const SectionSelector = ({ value, onChange }) => {
  return (
    <div className="section-selector" data-testid="section-selector">
      {sections.map((section) => {
        const Icon = section.icon;
        const isSelected = value === section.id;
        
        return (
          <button
            key={section.id}
            type="button"
            data-testid={`section-${section.id}`}
            onClick={() => onChange(section.id)}
            className={cn(
              'section-card flex flex-col items-center gap-3 py-6',
              isSelected && 'selected'
            )}
          >
            <Icon className={cn(
              'w-12 h-12 transition-colors',
              isSelected ? 'text-primary' : 'text-muted-foreground'
            )} />
            <div className="text-center">
              <div className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {section.name}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {section.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SectionSelector;
