"use client";
import React, { useState, useEffect } from 'react';
import { PatientVisit } from '@/types/emr';
import { differenceInMinutes } from 'date-fns';

interface QueueOverviewMetricsProps {
  queue: PatientVisit[];
  currentStage: string;
}

export default function QueueOverviewMetrics({ queue, currentStage }: QueueOverviewMetricsProps) {
  const [metrics, setMetrics] = useState({
    totalWaiting: 0,
    avgWaitTime: 0,
    overdueCount: 0,
    atRiskCount: 0
  });

  useEffect(() => {
    const getWaitingMinutes = (visit: PatientVisit) => {
      const stage = visit.currentStage;
      let clockInTime: Date | undefined;

      switch (stage) {
        case 'front_desk':
          clockInTime = visit.stages.frontDesk?.clockedInAt;
          break;
        case 'nurse':
          clockInTime = visit.stages.nurse?.clockedInAt || visit.stages.frontDesk?.clockedOutAt;
          break;
        case 'doctor':
          clockInTime = visit.stages.doctor?.clockedInAt || visit.stages.nurse?.clockedOutAt;
          break;
        case 'lab':
          clockInTime = visit.stages.lab?.clockedInAt || visit.stages.doctor?.clockedOutAt;
          break;
        case 'pharmacy':
          clockInTime = visit.stages.pharmacy?.clockedInAt || visit.stages.lab?.clockedOutAt;
          break;
        case 'billing':
          clockInTime = visit.stages.billing?.clockedInAt || visit.stages.pharmacy?.clockedOutAt;
          break;
        case 'returned_to_front_desk':
          clockInTime = visit.stages.returnedToFrontDesk?.clockedInAt || visit.stages.billing?.clockedOutAt;
          break;
      }

      if (!clockInTime) return 0;
      return differenceInMinutes(new Date(), new Date(clockInTime));
    };

    const totalWaiting = queue.length;
    const waitTimes = queue.map(visit => getWaitingMinutes(visit));
    const avgWaitTime = waitTimes.length > 0 
      ? Math.round(waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length) 
      : 0;
    const overdueCount = waitTimes.filter(time => time > 60).length;
    const atRiskCount = waitTimes.filter(time => time > 30 && time <= 60).length;

    setMetrics({ totalWaiting, avgWaitTime, overdueCount, atRiskCount });
  }, [queue]);

  const { totalWaiting, avgWaitTime, overdueCount, atRiskCount } = metrics;

  const metricCards = [
    {
      title: 'Total in Queue',
      value: totalWaiting,
      icon: 'ti-users',
      color: '#003366',
      bgColor: 'rgba(0, 51, 102, 0.1)',
      borderColor: '#003366'
    },
    {
      title: 'Avg Wait Time',
      value: `${avgWaitTime}m`,
      icon: 'ti-clock',
      color: avgWaitTime > 30 ? '#FDAF22' : '#4A90E2',
      bgColor: avgWaitTime > 30 ? 'rgba(253, 175, 34, 0.1)' : 'rgba(74, 144, 226, 0.1)',
      borderColor: avgWaitTime > 30 ? '#FDAF22' : '#4A90E2'
    },
    {
      title: 'Overdue (>60m)',
      value: overdueCount,
      icon: 'ti-alert-triangle',
      color: '#CC0000',
      bgColor: 'rgba(204, 0, 0, 0.1)',
      borderColor: '#CC0000'
    },
    {
      title: 'At Risk (30-60m)',
      value: atRiskCount,
      icon: 'ti-alert-circle',
      color: '#FDAF22',
      bgColor: 'rgba(253, 175, 34, 0.1)',
      borderColor: '#FDAF22'
    }
  ];

  return (
    <div className="queue-overview-metrics">
      <div className="row g-3 mb-4">
        {metricCards.map((metric, index) => (
          <div key={index} className="col-6 col-lg-3">
            <div 
              className="metric-card" 
              style={{ 
                backgroundColor: metric.bgColor,
                borderLeft: `4px solid ${metric.borderColor}`
              }}
            >
              <div className="metric-icon" style={{ color: metric.color }}>
                <i className={`ti ${metric.icon}`}></i>
              </div>
              <div className="metric-content">
                <div className="metric-value" style={{ color: metric.color }}>
                  {metric.value}
                </div>
                <div className="metric-title">{metric.title}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
