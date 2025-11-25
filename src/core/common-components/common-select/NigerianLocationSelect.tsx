"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Select from "react-select";
import type { StylesConfig } from "react-select";
import {
  getStates,
  getLGAsForState,
  getWardsForLGA,
  formatLocationName,
} from "@/lib/utils/nigerian-locations";

export type LocationOption = {
  value: string;
  label: string;
};

export interface NigerianLocationSelectProps {
  stateValue?: string;
  lgaValue?: string;
  wardValue?: string;
  onStateChange: (value: string) => void;
  onLGAChange: (value: string) => void;
  onWardChange: (value: string) => void;
  stateRequired?: boolean;
  lgaRequired?: boolean;
  wardRequired?: boolean;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
}

const DropdownIndicator = (props: any) => {
  return (
    <div {...props.innerProps} style={{ padding: '0 8px' }}>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '4px solid currentColor',
          transform: props.selectProps.menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          marginTop: props.selectProps.menuIsOpen ? '2px' : '0'
        }}
      />
    </div>
  );
};

const customComponents = {
  IndicatorSeparator: () => null,
  DropdownIndicator: DropdownIndicator,
};

const NigerianLocationSelect: React.FC<NigerianLocationSelectProps> = ({
  stateValue,
  lgaValue,
  wardValue,
  onStateChange,
  onLGAChange,
  onWardChange,
  stateRequired = false,
  lgaRequired = false,
  wardRequired = false,
  disabled = false,
  className,
  showLabels = true,
}) => {
  const [selectedState, setSelectedState] = useState<LocationOption | null>(null);
  const [selectedLGA, setSelectedLGA] = useState<LocationOption | null>(null);
  const [selectedWard, setSelectedWard] = useState<LocationOption | null>(null);

  const stateOptions: LocationOption[] = useMemo(() => getStates(), []);

  const lgaOptions: LocationOption[] = useMemo(() => {
    if (!stateValue) return [];
    return getLGAsForState(stateValue);
  }, [stateValue]);

  const wardOptions: LocationOption[] = useMemo(() => {
    if (!stateValue || !lgaValue) return [];
    return getWardsForLGA(stateValue, lgaValue);
  }, [stateValue, lgaValue]);

  useEffect(() => {
    if (stateValue && stateOptions.length > 0) {
      const selected = stateOptions.find(opt => opt.value.toLowerCase() === stateValue.toLowerCase());
      setSelectedState(selected || { value: stateValue, label: formatLocationName(stateValue) });
    } else {
      setSelectedState(null);
    }
  }, [stateValue, stateOptions]);

  useEffect(() => {
    if (lgaValue && lgaOptions.length > 0) {
      const selected = lgaOptions.find(opt => opt.value.toLowerCase() === lgaValue.toLowerCase());
      setSelectedLGA(selected || { value: lgaValue, label: formatLocationName(lgaValue) });
    } else {
      setSelectedLGA(null);
    }
  }, [lgaValue, lgaOptions]);

  useEffect(() => {
    if (wardValue && wardOptions.length > 0) {
      const selected = wardOptions.find(opt => opt.value.toLowerCase() === wardValue.toLowerCase());
      setSelectedWard(selected || { value: wardValue, label: formatLocationName(wardValue) });
    } else {
      setSelectedWard(null);
    }
  }, [wardValue, wardOptions]);

  const customStyles: StylesConfig<LocationOption, false> = {
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#1F6DB2"
        : state.isFocused
        ? "#white"
        : "white",
      color: state.isSelected
        ? "#fff"
        : state.isFocused
        ? "#1F6DB2"
        : "#707070",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#1F6DB2",
        color: state.isSelected ? "white" : "#fff",
      },
    }),
    menu: (base: any) => ({
      ...base,
      position: "absolute",
      width: "100%",
      zIndex: 9999,
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const handleStateChange = useCallback((option: LocationOption | null) => {
    setSelectedState(option);
    onStateChange(option?.value || '');
    setSelectedLGA(null);
    onLGAChange('');
    setSelectedWard(null);
    onWardChange('');
  }, [onStateChange, onLGAChange, onWardChange]);

  const handleLGAChange = useCallback((option: LocationOption | null) => {
    setSelectedLGA(option);
    onLGAChange(option?.value || '');
    setSelectedWard(null);
    onWardChange('');
  }, [onLGAChange, onWardChange]);

  const handleWardChange = useCallback((option: LocationOption | null) => {
    setSelectedWard(option);
    onWardChange(option?.value || '');
  }, [onWardChange]);

  return (
    <div className={`nigerian-location-select ${className || ''}`}>
      <div className="row">
        <div className="col-md-4">
          {showLabels && (
            <label className="form-label">
              State {stateRequired && <span className="text-danger">*</span>}
            </label>
          )}
          <div className="common-select">
            <Select
              classNamePrefix="react-select"
              styles={customStyles}
              options={stateOptions}
              value={selectedState}
              onChange={handleStateChange}
              components={customComponents}
              isDisabled={disabled}
              placeholder="Select State"
              isClearable
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>
        </div>

        <div className="col-md-4">
          {showLabels && (
            <label className="form-label">
              LGA {lgaRequired && <span className="text-danger">*</span>}
            </label>
          )}
          <div className="common-select">
            <Select
              classNamePrefix="react-select"
              styles={customStyles}
              options={lgaOptions}
              value={selectedLGA}
              onChange={handleLGAChange}
              components={customComponents}
              isDisabled={disabled || !stateValue || lgaOptions.length === 0}
              placeholder={stateValue ? "Select LGA" : "Select State First"}
              isClearable
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>
        </div>

        <div className="col-md-4">
          {showLabels && (
            <label className="form-label">
              Ward {wardRequired && <span className="text-danger">*</span>}
            </label>
          )}
          <div className="common-select">
            <Select
              classNamePrefix="react-select"
              styles={customStyles}
              options={wardOptions}
              value={selectedWard}
              onChange={handleWardChange}
              components={customComponents}
              isDisabled={disabled || !lgaValue || wardOptions.length === 0}
              placeholder={lgaValue ? "Select Ward" : "Select LGA First"}
              isClearable
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NigerianLocationSelect;
