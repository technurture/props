"use client";
import React from 'react';

interface PriorityPillProps {
  waitingMinutes: number;
}

export default function PriorityPill({ waitingMinutes }: PriorityPillProps) {
  const getPriorityConfig = () => {
    if (waitingMinutes > 60) {
      return {
        label: 'Overdue',
        icon: 'ti-alert-triangle',
        bgColor: '#CC0000',
        textColor: '#ffffff',
        pulse: true
      };
    } else if (waitingMinutes > 30) {
      return {
        label: 'At Risk',
        icon: 'ti-alert-circle',
        bgColor: '#FDAF22',
        textColor: '#ffffff',
        pulse: false
      };
    } else if (waitingMinutes > 15) {
      return {
        label: 'Normal',
        icon: 'ti-clock',
        bgColor: '#4A90E2',
        textColor: '#ffffff',
        pulse: false
      };
    } else {
      return {
        label: 'Recent',
        icon: 'ti-clock',
        bgColor: '#09800F',
        textColor: '#ffffff',
        pulse: false
      };
    }
  };

  const config = getPriorityConfig();

  return (
    <span 
      className={`priority-pill ${config.pulse ? 'pulse-animation' : ''}`}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        padding: '0.25rem 0.75rem',
        borderRadius: '1rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem'
      }}
    >
      <i className={`ti ${config.icon}`} style={{ fontSize: '0.875rem' }}></i>
      {waitingMinutes}m
    </span>
  );
}
