"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Select from "react-select";
import type { StylesConfig } from "react-select";
import { getBranches } from "@/lib/services/branches";
import { Branch } from "@/types/emr";
import { UserRole } from "@/types/emr";

export type BranchOption = {
  value: string;
  label: string;
};

export interface BranchSelectProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  showAllOption?: boolean;
  className?: string;
  placeholder?: string;
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

const BranchSelect: React.FC<BranchSelectProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  showAllOption = false,
  className,
  placeholder = "Select Branch"
}) => {
  const { data: session } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<BranchOption | null>(null);

  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const userBranchId = typeof session?.user?.branch === 'object' 
    ? session.user.branch._id 
    : session?.user?.branch;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches({ isActive: true, limit: 100 });
        setBranches(response.branches);
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const options: BranchOption[] = React.useMemo(() => {
    const branchOptions = branches.map((branch) => ({
      value: branch._id || '',
      label: `${branch.name} (${branch.code})`,
    }));

    if (showAllOption && isAdmin) {
      return [{ value: 'all', label: 'All Branches' }, ...branchOptions];
    }

    return branchOptions;
  }, [branches, showAllOption, isAdmin]);

  useEffect(() => {
    if (!isAdmin && userBranchId && !value && options.length > 0) {
      const userBranch = options.find(opt => opt.value === userBranchId);
      if (userBranch) {
        setSelectedOption(userBranch);
        onChange(userBranchId);
      }
    }
  }, [isAdmin, userBranchId, options, value]);

  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find(opt => opt.value === value);
      if (selected) {
        setSelectedOption(selected);
      }
    } else if (!value && !loading) {
      setSelectedOption(null);
    }
  }, [value, options, loading]);

  const customStyles: StylesConfig<BranchOption, false> = {
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

  const handleChange = useCallback((option: BranchOption | null) => {
    setSelectedOption(option);
    onChange(option?.value || '');
  }, [onChange]);

  const isDisabled = disabled || loading;

  if (loading) {
    return (
      <div className="common-select">
        <Select
          classNamePrefix="react-select"
          className={className}
          isDisabled={true}
          placeholder="Loading branches..."
          components={customComponents}
        />
      </div>
    );
  }

  return (
    <div className="common-select">
      <Select
        classNamePrefix="react-select"
        className={className}
        styles={customStyles}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        components={customComponents}
        placeholder={placeholder}
        isDisabled={isDisabled}
        required={required}
        menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
        aria-label="Branch selection"
        aria-describedby="branch-select-description"
      />
      <div id="branch-select-description" className="sr-only">
        Branch selection dropdown with {options.length} options
      </div>
    </div>
  );
};

export default React.memo(BranchSelect);
