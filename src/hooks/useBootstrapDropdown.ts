import { useEffect, useRef } from 'react';

export function useBootstrapDropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeDropdown = async () => {
      if (!dropdownRef.current) return;

      const dropdownToggle = dropdownRef.current.querySelector('[data-bs-toggle="dropdown"]');
      if (!dropdownToggle) return;

      try {
        const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
        
        if (!(dropdownToggle as any)._bootstrap_dropdown) {
          new bootstrap.Dropdown(dropdownToggle);
          (dropdownToggle as any)._bootstrap_dropdown = true;
        }
      } catch (error) {
        console.error('Failed to initialize dropdown:', error);
      }
    };

    const timer = setTimeout(initializeDropdown, 100);
    return () => clearTimeout(timer);
  }, []);

  return dropdownRef;
}
