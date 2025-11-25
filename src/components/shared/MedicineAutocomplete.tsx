"use client";
import React, { useState, useEffect, useRef } from 'react';

interface Medicine {
  _id: string;
  productName: string;
  genericName?: string;
  stock: number;
  unit: string;
  category?: string;
}

interface MedicineAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  medicines: Medicine[];
  loading?: boolean;
}

export default function MedicineAutocomplete({
  value,
  onChange,
  className = '',
  placeholder = 'e.g., Amoxicillin',
  disabled = false,
  medicines,
  loading = false,
}: MedicineAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter medicines based on input value
    if (value && value.length > 0) {
      const filtered = medicines.filter(
        (med) =>
          med.productName.toLowerCase().includes(value.toLowerCase()) ||
          (med.genericName && med.genericName.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredMedicines(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setFilteredMedicines(medicines.slice(0, 10)); // Show first 10 medicines when empty
      setShowDropdown(false);
    }
  }, [value, medicines]);

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
    onChange(newValue);
    setShowDropdown(true);
  };

  const handleSelectMedicine = (medicine: Medicine) => {
    onChange(medicine.productName);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (value.length > 0 && filteredMedicines.length > 0) {
      setShowDropdown(true);
    }
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
          {filteredMedicines.length > 0 ? (
            <>
              {filteredMedicines.map((medicine) => (
                <div
                  key={medicine._id}
                  className="p-2 cursor-pointer border-bottom"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectMedicine(medicine)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <strong>{medicine.productName}</strong>
                      {medicine.genericName && (
                        <div className="text-muted small">
                          Generic: {medicine.genericName}
                        </div>
                      )}
                      {medicine.category && (
                        <div className="text-muted small">
                          Category: {medicine.category}
                        </div>
                      )}
                    </div>
                    <div className="text-end">
                      <span className={`badge ${medicine.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
                        {medicine.stock > 0 ? `${medicine.stock} ${medicine.unit}` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Manual entry hint */}
              <div className="p-2 bg-light border-top">
                <small className="text-muted">
                  <i className="ti ti-info-circle me-1"></i>
                  Can't find the medicine? Type the name manually.
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
                No matches found in inventory.<br />
                Continue typing to enter the medicine name manually.
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
