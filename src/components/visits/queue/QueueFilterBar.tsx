"use client";
import React from 'react';

interface QueueFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: 'waitTime' | 'arrival' | 'name';
  onSortChange: (value: 'waitTime' | 'arrival' | 'name') => void;
  urgencyFilter: 'all' | 'overdue' | 'atRisk' | 'normal';
  onUrgencyFilterChange: (value: 'all' | 'overdue' | 'atRisk' | 'normal') => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (value: 'cards' | 'table') => void;
}

export default function QueueFilterBar({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  urgencyFilter,
  onUrgencyFilterChange,
  viewMode,
  onViewModeChange
}: QueueFilterBarProps) {
  return (
    <div className="queue-filter-bar card mb-3">
      <div className="card-body">
        <div className="row g-3 align-items-center">
          {/* Search */}
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text" style={{ backgroundColor: '#E3F2FD', borderColor: '#4A90E2', color: '#003366' }}>
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search patient..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="col-12 col-md-4">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm ${urgencyFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => onUrgencyFilterChange('all')}
                style={urgencyFilter === 'all' ? { backgroundColor: '#003366', borderColor: '#003366' } : {}}
              >
                All
              </button>
              <button
                type="button"
                className={`btn btn-sm ${urgencyFilter === 'overdue' ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => onUrgencyFilterChange('overdue')}
                style={urgencyFilter === 'overdue' ? { backgroundColor: '#CC0000', borderColor: '#CC0000' } : {}}
              >
                <i className="ti ti-alert-triangle me-1"></i>
                Overdue
              </button>
              <button
                type="button"
                className={`btn btn-sm ${urgencyFilter === 'atRisk' ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => onUrgencyFilterChange('atRisk')}
                style={urgencyFilter === 'atRisk' ? { backgroundColor: '#FDAF22', borderColor: '#FDAF22', color: '#fff' } : {}}
              >
                <i className="ti ti-alert-circle me-1"></i>
                At Risk
              </button>
              <button
                type="button"
                className={`btn btn-sm ${urgencyFilter === 'normal' ? 'btn-info' : 'btn-outline-secondary'}`}
                onClick={() => onUrgencyFilterChange('normal')}
                style={urgencyFilter === 'normal' ? { backgroundColor: '#4A90E2', borderColor: '#4A90E2' } : {}}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Sort & View Toggle */}
          <div className="col-12 col-md-4">
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as 'waitTime' | 'arrival' | 'name')}
                style={{ borderColor: '#E2E8F0', flex: 1 }}
              >
                <option value="waitTime">Sort: Wait Time</option>
                <option value="arrival">Sort: Arrival</option>
                <option value="name">Sort: Name</option>
              </select>
              
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => onViewModeChange('cards')}
                  style={viewMode === 'cards' ? { backgroundColor: '#003366', borderColor: '#003366' } : {}}
                  title="Card View"
                >
                  <i className="ti ti-layout-grid"></i>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => onViewModeChange('table')}
                  style={viewMode === 'table' ? { backgroundColor: '#003366', borderColor: '#003366' } : {}}
                  title="Table View"
                >
                  <i className="ti ti-list"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
