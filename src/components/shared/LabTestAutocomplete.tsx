"use client";
import React, { useState, useEffect, useRef } from 'react';

interface LabTest {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
}

interface LabTestAutocompleteProps {
  value: string;
  onChange: (value: string, serviceChargeId?: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  labTests: LabTest[];
  loading?: boolean;
}

export default function LabTestAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'e.g., Complete Blood Count (CBC)',
  disabled = false,
  labTests,
  loading = false,
}: LabTestAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredLabTests, setFilteredLabTests] = useState<LabTest[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter lab tests based on input value
    if (value && value.length > 0) {
      const filtered = labTests.filter(
        (test) =>
          test.name.toLowerCase().includes(value.toLowerCase()) ||
          (test.description && test.description.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredLabTests(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredLabTests(labTests.slice(0, 10)); // Show first 10 lab tests when empty
      setShowDropdown(false);
    }
  }, [value, labTests]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, undefined);
    setShowDropdown(true);
  };

  const handleSelectLabTest = (test: LabTest) => {
    onChange(test.name, test._id);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (value.length > 0 && filteredLabTests.length > 0) {
      setShowDropdown(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <div ref={wrapperRef} className="position-relative">
      <input
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        disabled={disabled || loading}
        autoComplete="off"
      />
      
      {loading && (
        <div className="position-absolute end-0 top-50 translate-middle-y me-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {showDropdown && !disabled && (
        <div 
          className="position-absolute w-100 mt-1 bg-white border rounded shadow-sm"
          style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            zIndex: 1050 
          }}
        >
          {filteredLabTests.length > 0 ? (
            <>
              {filteredLabTests.map((test) => (
                <div
                  key={test._id}
                  className="p-2 cursor-pointer border-bottom"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectLabTest(test)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <strong>{test.name}</strong>
                      {test.description && (
                        <div className="text-muted small">
                          {test.description}
                        </div>
                      )}
                      <span className="badge bg-info-transparent mt-1">
                        Laboratory Test
                      </span>
                    </div>
                    <div className="text-end ms-2">
                      <span className="badge bg-success">
                        {formatCurrency(test.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Manual entry hint */}
              <div className="p-2 bg-light border-top">
                <small className="text-muted">
                  <i className="ti ti-info-circle me-1"></i>
                  Can't find the test? Type the name manually to request it.
                </small>
              </div>
            </>
          ) : (
            /* No matches found */
            <div className="p-3 text-center">
              <div className="text-muted mb-2">
                <i className="ti ti-search-off"></i>
              </div>
              <small className="text-muted">
                No matches found in lab tests.<br />
                Continue typing to enter the test name manually.
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
