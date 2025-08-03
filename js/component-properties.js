// Component property definitions
// Defines the structure and properties for each component type

export const COMPONENT_PROPERTIES = {
    // Motor component
    motor: {
        name: 'Silnik',
        icon: '⚙️',
        properties: [
            {
                id: 'label',
                name: 'Etykieta',
                type: 'text',
                default: 'Silnik',
                category: 'Ogólne'
            },
            {
                id: 'state',
                name: 'Stan',
                type: 'boolean',
                default: false,
                category: 'Stan'
            },
            {
                id: 'speed',
                name: 'Prędkość',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 50,
                unit: '%',
                category: 'Parametry'
            },
            {
                id: 'direction',
                name: 'Kierunek',
                type: 'select',
                options: [
                    { value: 'forward', label: 'Do przodu' },
                    { value: 'backward', label: 'Do tyłu' }
                ],
                default: 'forward',
                category: 'Parametry'
            }
        ]
    },
    
    // LED component
    led: {
        name: 'Diody LED',
        icon: '💡',
        properties: [
            {
                id: 'label',
                name: 'Etykieta',
                type: 'text',
                default: 'LED',
                category: 'Ogólne'
            },
            {
                id: 'state',
                name: 'Włączony',
                type: 'boolean',
                default: false,
                category: 'Stan'
            },
            {
                id: 'color',
                name: 'Kolor',
                type: 'color',
                default: '#00ff00',
                category: 'Wygląd'
            },
            {
                id: 'brightness',
                name: 'Jasność',
                type: 'range',
                min: 0,
                max: 100,
                step: 1,
                default: 100,
                unit: '%',
                category: 'Parametry'
            }
        ]
    },
    
    // Button component
    button: {
        name: 'Przycisk',
        icon: '🔘',
        properties: [
            {
                id: 'label',
                name: 'Etykieta',
                type: 'text',
                default: 'Przycisk',
                category: 'Ogólne'
            },
            {
                id: 'color',
                name: 'Kolor',
                type: 'color',
                default: '#3498db',
                category: 'Wygląd'
            },
            {
                id: 'textColor',
                name: 'Kolor tekstu',
                type: 'color',
                default: '#ffffff',
                category: 'Wygląd'
            }
        ]
    },
    
    // Default properties for unknown component types
    default: {
        name: 'Komponent',
        icon: '📦',
        properties: [
            {
                id: 'label',
                name: 'Etykieta',
                type: 'text',
                default: 'Komponent',
                category: 'Ogólne'
            }
        ]
    }
};

/**
 * Get properties definition for a component type
 * @param {string} componentType - The type of the component
 * @returns {Object} Component properties definition
 */
export function getComponentProperties(componentType) {
    return COMPONENT_PROPERTIES[componentType] || COMPONENT_PROPERTIES.default;
}

/**
 * Get all component types with their names and icons
 * @returns {Array} List of component types
 */
export function getComponentTypes() {
    return Object.entries(COMPONENT_PROPERTIES).map(([id, def]) => ({
        id,
        name: def.name,
        icon: def.icon
    }));
}
