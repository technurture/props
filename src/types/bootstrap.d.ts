declare module 'bootstrap/dist/js/bootstrap.bundle.min.js';

interface BootstrapModal {
  show(): void;
  hide(): void;
  toggle(): void;
  dispose(): void;
}

interface BootstrapDropdown {
  show(): void;
  hide(): void;
  toggle(): void;
  update(): void;
  dispose(): void;
}

interface BootstrapTooltip {
  show(): void;
  hide(): void;
  toggle(): void;
  dispose(): void;
  enable(): void;
  disable(): void;
}

interface BootstrapStatic {
  Modal: {
    new (element: HTMLElement, options?: any): BootstrapModal;
    getInstance(element: HTMLElement): BootstrapModal | null;
    getOrCreateInstance(element: HTMLElement, options?: any): BootstrapModal;
  };
  Dropdown: {
    new (element: HTMLElement, options?: any): BootstrapDropdown;
    getInstance(element: HTMLElement): BootstrapDropdown | null;
    getOrCreateInstance(element: HTMLElement, options?: any): BootstrapDropdown;
  };
  Tooltip: {
    new (element: HTMLElement, options?: any): BootstrapTooltip;
    getInstance(element: HTMLElement): BootstrapTooltip | null;
    getOrCreateInstance(element: HTMLElement, options?: any): BootstrapTooltip;
  };
}

declare global {
  interface Window {
    bootstrap?: BootstrapStatic;
  }
}
