"use client";
import { DateRangePicker } from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';
import { useState, useEffect, useMemo } from 'react';

// Helper to format date as "11 July 25"
function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short', // changed from 'long' to 'short'
    year: '2-digit',
  });
}

export default function PredefinedDatePicker() {
  const [displayValue, setDisplayValue] = useState('Loading...');
  const [isClient, setIsClient] = useState(false);

  // Calculate dates in useMemo to avoid recalculating on every render
  const dateRanges = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    return {
      startOfToday,
      endOfToday,
      startOfMonth,
      endOfMonth,
      startOfLastMonth,
      endOfLastMonth,
      now
    };
  }, []);

  const initialSettings = useMemo(() => ({
    startDate: dateRanges.startOfToday,
    endDate: dateRanges.endOfToday,
    ranges: {
      'Last 30 Days': [
        new Date(dateRanges.now.getFullYear(), dateRanges.now.getMonth(), dateRanges.now.getDate() - 29, 0, 0, 0, 0),
        dateRanges.endOfToday,
      ],
      'Last 7 Days': [
        new Date(dateRanges.now.getFullYear(), dateRanges.now.getMonth(), dateRanges.now.getDate() - 6, 0, 0, 0, 0),
        dateRanges.endOfToday,
      ],
      'Last Month': [
        dateRanges.startOfLastMonth,
        dateRanges.endOfLastMonth,
      ],
      'This Month': [
        dateRanges.startOfMonth,
        dateRanges.endOfMonth,
      ],
      Today: [
        dateRanges.startOfToday,
        dateRanges.endOfToday,
      ],
      Yesterday: [
        new Date(dateRanges.now.getFullYear(), dateRanges.now.getMonth(), dateRanges.now.getDate() - 1, 0, 0, 0, 0),
        new Date(dateRanges.now.getFullYear(), dateRanges.now.getMonth(), dateRanges.now.getDate() - 1, 23, 59, 59, 999),
      ],
    },
    timePicker: false,
    locale: {
      format: 'DD MMM YY', // changed from 'DD MMMM YY' to 'DD MMM YY'
    },
  }), [dateRanges]);

  // Set display value only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
    setDisplayValue(
      `${formatDate(dateRanges.startOfToday)} - ${formatDate(dateRanges.endOfToday)}`
    );
  }, [dateRanges]);

  // Always format the input value when the picker is shown
  const handleShow = (_event: any, picker: any) => {
    setDisplayValue(
      `${formatDate(picker.startDate.toDate())} - ${formatDate(picker.endDate.toDate())}`
    );
  };

  const handleApply = (_event: any, picker: any) => {
    setDisplayValue(
      `${formatDate(picker.startDate.toDate())} - ${formatDate(picker.endDate.toDate())}`
    );
  };

  // Only render date picker after client mount to avoid hydration mismatch
  if (!isClient) {
    return (
      <div className='reportrange-picker bg-white d-flex align-items-center'>
        <i className="ti ti-calendar text-body fs-14 me-1" />
        <span className="reportrange-picker-field">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className='reportrange-picker bg-white d-flex align-items-center'>
  
      <i className="ti ti-calendar text-body fs-14 me-1" />
      <DateRangePicker
        initialSettings={initialSettings}
        onApply={handleApply}
        onShow={handleShow}
      >
        <span className="reportrange-picker-field">
          {displayValue}
        </span>
      </DateRangePicker>
    </div>
  );
}
