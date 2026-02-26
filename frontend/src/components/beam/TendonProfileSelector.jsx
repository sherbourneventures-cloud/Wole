import React from 'react';
import { cn } from '../../lib/utils';

const profiles = [
  {
    id: 'straight',
    name: 'Straight',
    description: 'Constant eccentricity',
    svg: (
      <svg viewBox="0 0 120 60" className="w-full h-16">
        <line x1="10" y1="10" x2="110" y2="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="10" y1="35" x2="110" y2="35" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-primary" />
        <circle cx="10" cy="35" r="3" fill="currentColor" className="text-primary" />
        <circle cx="110" cy="35" r="3" fill="currentColor" className="text-primary" />
      </svg>
    )
  },
  {
    id: 'parabolic',
    name: 'Parabolic',
    description: 'Single parabola',
    svg: (
      <svg viewBox="0 0 120 60" className="w-full h-16">
        <line x1="10" y1="10" x2="110" y2="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <path d="M10,20 Q60,45 110,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-primary" />
        <circle cx="10" cy="20" r="3" fill="currentColor" className="text-primary" />
        <circle cx="60" cy="43" r="3" fill="currentColor" className="text-primary" />
        <circle cx="110" cy="20" r="3" fill="currentColor" className="text-primary" />
      </svg>
    )
  },
  {
    id: 'harped',
    name: 'Harped',
    description: 'Draped profile',
    svg: (
      <svg viewBox="0 0 120 60" className="w-full h-16">
        <line x1="10" y1="10" x2="110" y2="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <path d="M10,20 L40,42 L80,42 L110,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-primary" />
        <circle cx="10" cy="20" r="3" fill="currentColor" className="text-primary" />
        <circle cx="40" cy="42" r="3" fill="currentColor" className="text-primary" />
        <circle cx="80" cy="42" r="3" fill="currentColor" className="text-primary" />
        <circle cx="110" cy="20" r="3" fill="currentColor" className="text-primary" />
      </svg>
    )
  },
  {
    id: 'multi_parabolic',
    name: 'Multi-Parabolic',
    description: 'Multiple segments',
    svg: (
      <svg viewBox="0 0 120 60" className="w-full h-16">
        <line x1="10" y1="10" x2="110" y2="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <line x1="10" y1="50" x2="110" y2="50" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
        <path d="M10,20 Q30,40 50,30 Q70,20 90,35 Q100,40 110,20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4" className="text-primary" />
        <circle cx="10" cy="20" r="3" fill="currentColor" className="text-primary" />
        <circle cx="50" cy="30" r="3" fill="currentColor" className="text-primary" />
        <circle cx="90" cy="35" r="3" fill="currentColor" className="text-primary" />
        <circle cx="110" cy="20" r="3" fill="currentColor" className="text-primary" />
      </svg>
    )
  }
];

export const TendonProfileSelector = ({ value, onChange }) => {
  return (
    <div className="profile-selector" data-testid="tendon-profile-selector">
      {profiles.map((profile) => {
        const isSelected = value === profile.id;
        
        return (
          <button
            key={profile.id}
            type="button"
            data-testid={`profile-${profile.id}`}
            onClick={() => onChange(profile.id)}
            className={cn(
              'profile-card',
              isSelected && 'selected'
            )}
          >
            <div className={cn(
              'w-full',
              isSelected ? 'text-primary' : 'text-muted-foreground'
            )}>
              {profile.svg}
            </div>
            <div className="text-center">
              <div className={cn(
                'text-sm font-semibold',
                isSelected ? 'text-primary' : 'text-foreground'
              )}>
                {profile.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {profile.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default TendonProfileSelector;
