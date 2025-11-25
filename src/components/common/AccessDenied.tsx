"use client";
import React from 'react';
import Link from 'next/link';
import { all_routes } from '@/router/all_routes';

export interface AccessDeniedProps {
  message?: string;
  backLink?: string;
}

export function AccessDenied({
  message,
  backLink,
}: AccessDeniedProps) {
  const defaultMessage = "You don't have the necessary permissions to access this page. Please contact your administrator if you believe this is an error.";
  const defaultBackLink = all_routes.dashboard;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="ti ti-lock text-danger" style={{ fontSize: '5rem' }}></i>
          </div>
          <h4 className="mb-3">Access Denied</h4>
          <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
            {message || defaultMessage}
          </p>
          <Link href={backLink || defaultBackLink} className="btn btn-primary">
            <i className="ti ti-arrow-left me-2"></i>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
