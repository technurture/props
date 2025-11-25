"use client";
import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import type { StylesConfig } from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  value?: Option | null;
  onChange?: (option: Option | null) => void;
  className?: string;
  styles?: StylesConfig<Option, false>;
  ariaLabel?: string;
  placeholder?: string;
}

// Custom dropdown indicator component
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

const CommonSelect: React.FC<SelectProps> = ({ 
  options, 
  defaultValue, 
  value, 
  onChange, 
  className, 
  ariaLabel, 
  placeholder = "Select" 
}) => {
  const [internalValue, setInternalValue] = useState<Option | undefined>(defaultValue);

  const customStyles = {
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

  const isControlled = value !== undefined;
  const displayValue = isControlled ? value : internalValue;

  const handleChange = useCallback((option: Option | null) => {
    if (onChange) {
      onChange(option);
    }
    if (!isControlled) {
      setInternalValue(option || undefined);
    }
  }, [onChange, isControlled]);

  useEffect(() => {
    if (!isControlled && defaultValue !== undefined) {
      setInternalValue(defaultValue || undefined);
    }
  }, [defaultValue, isControlled])
  
  return (
    <div className="common-select">
    <Select
     classNamePrefix="react-select"
      className={className}
      styles={customStyles}
      options={options}
      value={displayValue}
      onChange={handleChange}
      components={customComponents}
      placeholder={placeholder}
      menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      aria-label={ariaLabel}
      aria-describedby="select-description"
    />
    <div id="select-description" className="sr-only">
      {ariaLabel} dropdown with {options.length} options
    </div>
    </div>
  );
};

export default React.memo(CommonSelect);
