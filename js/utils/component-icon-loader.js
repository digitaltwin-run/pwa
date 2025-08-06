/**
 * Component Icon Loader Utility
 * 
 * Standardized utility for asynchronously loading SVG icons for components
 * with fallback to emoji icons when SVG files are not available.
 */

export class ComponentIconLoader {
    /**
     * Asynchronously loads an SVG icon for a component
     * @param {string} componentId - Component ID or type
     * @param {object} options - Optional configuration
     * @param {string} options.basePath - Base path to SVG icons directory (default: '/components/')
     * @param {object} options.fallbackIcons - Custom fallback emoji icons map
     * @param {Function} options.onLoadStart - Callback when loading starts
     * @param {Function} options.onLoadEnd - Callback when loading ends (success or error)
     * @returns {Promise<string>} - SVG content as string or fallback emoji
     */
    static async loadIcon(componentId, options = {}) {
        const {
            basePath = '/components/',
            fallbackIcons = {},
            onLoadStart,
            onLoadEnd
        } = options;

        // Call load start callback if provided
        if (onLoadStart && typeof onLoadStart === 'function') {
            onLoadStart(componentId);
        }
        
        try {
            // Try to fetch SVG icon from components directory
            const svgUrl = `${basePath}${componentId}.svg`;
            const response = await fetch(svgUrl);
            
            if (!response.ok) {
                throw new Error(`SVG not found: ${svgUrl}`);
            }
            
            // Parse SVG and prepare it as an icon
            const svgText = await response.text();
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            const svgElement = svgDoc.querySelector('svg');
            
            if (!svgElement) {
                throw new Error('Invalid SVG content');
            }
            
            // Ensure consistent size for icon display
            svgElement.setAttribute('width', '20');
            svgElement.setAttribute('height', '20');
            svgElement.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '0 0 24 24');
            
            // Call load end callback if provided
            if (onLoadEnd && typeof onLoadEnd === 'function') {
                onLoadEnd(componentId, true);
            }
            
            // Convert to string for use in HTML
            const serializer = new XMLSerializer();
            return serializer.serializeToString(svgElement);
            
        } catch (error) {
            console.warn(`[ComponentIconLoader] Falling back to emoji icon for ${componentId}:`, error.message);
            
            // Call load end callback if provided
            if (onLoadEnd && typeof onLoadEnd === 'function') {
                onLoadEnd(componentId, false);
            }
            
            // Default fallback emoji icons
            const defaultIconMap = {
                'gauge': '📊',
                'led': '💡',
                'pump': '⚙️',
                'valve': '🔧',
                'motor': '🔄',
                'tank': '🛢️',
                'display': '📟',
                'button': '🔘',
                'slider': '🎚️',
                'graph': '📈',
                'label': '🏷️',
                'switch': '🔌',
                'panel': '📋',
                'indicator': '🚥',
                'sensor': '🌡️',
                'counter': '🔢',
                'relay': '⚡',
                'knob': '🎛️',
                'toggle': '⏬'
            };
            
            // Merge custom fallback icons with defaults
            const iconMap = { ...defaultIconMap, ...fallbackIcons };
            
            return iconMap[componentId] || '🔧';
        }
    }
    
    /**
     * Extract component type ID from component URL or object
     * @param {string|object} component - Component URL, ID or object with id/type property
     * @returns {string} - Component type ID
     */
    static extractComponentId(component) {
        if (!component) return 'unknown';
        
        // If component is a string (URL or ID)
        if (typeof component === 'string') {
            // Extract from SVG URL if it looks like a path
            if (component.includes('/')) {
                return component.split('/').pop().replace('.svg', '').toLowerCase();
            }
            // Otherwise assume it's already an ID
            return component.toLowerCase();
        }
        
        // If component is an object with id property
        if (typeof component === 'object') {
            if (component.id) return component.id.toLowerCase();
            if (component.type) return component.type.toLowerCase();
            if (component.svg) {
                return this.extractComponentId(component.svg);
            }
        }
        
        return 'unknown';
    }
}

// Export as default for convenience
export default ComponentIconLoader;
