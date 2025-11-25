"use client";
import React from 'react';
import Link from 'next/link';

export interface MissingResourceProps {
  resourceName: string;
  message?: string;
  backLink: string;
  backLabel?: string;
}

export function MissingResource({
  resourceName,
  message,
  backLink,
  backLabel,
}: MissingResourceProps) {
  const defaultMessage = `The ${resourceName.toLowerCase()} you are looking for could not be found or the required information is missing.`;
  const defaultBackLabel = `Back to ${resourceName}s`;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="ti ti-file-search text-primary" style={{ fontSize: '5rem' }}></i>
          </div>
          <h4 className="mb-3">{resourceName} Not Found</h4>
          <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
            {message || defaultMessage}
          </p>
          <Link href={backLink} className="btn btn-primary">
            <i className="ti ti-arrow-left me-2"></i>
            {backLabel || defaultBackLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
