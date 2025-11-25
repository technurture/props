"use client"

import { useEffect } from "react"

export default function BootstrapJs(){
    useEffect(() => {
        const initializeBootstrap = async () => {
            if (typeof window === 'undefined') return;
            
            try {
                // Import Bootstrap bundle which includes Popper.js for dropdown positioning
                const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
                
                // Make Bootstrap available globally
                (window as any).bootstrap = bootstrap;
                
                // Bootstrap's data API automatically initializes elements with data-bs-toggle attributes
                // No manual initialization needed - just ensure Bootstrap is loaded
                
            } catch (err) {
                console.error('Failed to load Bootstrap:', err);
            }
        };
        
        initializeBootstrap();
    }, []);
    
    return null
}