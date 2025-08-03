const fs = require('fs');
const path = require('path');
const { parseString } = require('xml2js');

const COMPONENTS_DIR = path.join(__dirname, '../components');
const COMPONENTS_JSON_PATH = path.join(__dirname, '../components.json');

// Default component configuration for known component types
const COMPONENT_DEFAULTS = {
  'motor': {
    name: 'Silnik',
    defaultEvents: {
      click: [{
        type: 'http-request',
        params: {
          method: 'POST',
          url: 'http://localhost:3000/api/motor/toggle',
          body: { action: 'toggle' }
        }
      }]
    }
  },
  'led': {
    name: 'Diody LED',
    defaultState: { on: false, color: '#00ff00' }
  },
  'switch': {
    name: 'Przełącznik',
    defaultState: { on: false }
  },
  'relay': {
    name: 'Przekaźnik',
    defaultState: { active: false }
  },
  'button': {
    name: 'Przycisk',
    defaultState: { pressed: false }
  },
  'display': {
    name: 'Wyświetlacz',
    defaultState: { url: 'about:blank', refreshInterval: 0 }
  },
  'gauge': {
    name: 'Wskaźnik',
    defaultState: { value: 0, min: 0, max: 100 }
  },
  'sensor': {
    name: 'Czujnik',
    defaultState: { value: 0, unit: '°C' }
  },
  'valve': {
    name: 'Zawór',
    defaultState: { open: false }
  },
  'pump': {
    name: 'Pompa',
    defaultState: { running: false, speed: 0 }
  },
  'modbus8adc': {
    name: 'Modbus 8CH ADC',
    defaultState: {
      channels: Array(8).fill(0).map((_, i) => ({
        id: i + 1,
        value: 0,
        mode: 'voltage',
        range: '0-10V'
      }))
    }
  },
  'modbus8i8o': {
    name: 'Modbus 8I/8O',
    defaultState: {
      inputs: Array(8).fill(false),
      outputs: Array(8).fill(false)
    }
  },
  'usb2rs485': {
    name: 'Konwerter USB-RS485',
    defaultState: {
      connected: false,
      baudRate: 9600,
      parity: 'none',
      dataBits: 8,
      stopBits: 1
    }
  }
};

// Function to read SVG file and extract metadata
async function getSvgMetadata(filePath) {
  try {
    const xml = await fs.promises.readFile(filePath, 'utf8');
    
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          console.error(`Error parsing ${filePath}:`, err);
          return resolve(null);
        }

        const metadata = {};
        
        // Extract metadata from SVG
        if (result.svg.metadata && result.svg.metadata[0].component) {
          const component = result.svg.metadata[0].component[0].$;
          const parameters = result.svg.metadata[0].component[0].parameters?.[0] || {};
          
          metadata.id = component.id || path.basename(filePath, '.svg');
          metadata.name = component.name || path.basename(filePath, '.svg');
          metadata.type = component.type || 'generic';
          
          // Convert parameters to a more usable format
          if (parameters) {
            metadata.parameters = {};
            Object.entries(parameters).forEach(([key, value]) => {
              if (Array.isArray(value) && value[0]) {
                metadata.parameters[key] = value[0];
              }
            });
          }
        } else {
          // If no metadata, use filename as ID and name
          const baseName = path.basename(filePath, '.svg');
          metadata.id = baseName.toLowerCase();
          metadata.name = baseName;
          metadata.type = 'generic';
        }
        
        resolve(metadata);
      });
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

// Function to update components.json
async function updateComponentsJson() {
  try {
    // Read all SVG files in components directory
    const files = fs.readdirSync(COMPONENTS_DIR)
      .filter(file => file.endsWith('.svg'));

    const components = [];
    
    // Process each SVG file
    for (const file of files) {
      const filePath = path.join(COMPONENTS_DIR, file);
      const metadata = await getSvgMetadata(filePath);
      
      if (metadata) {
        const baseName = path.basename(file, '.svg');
        const componentId = metadata.id || baseName.toLowerCase();
        const componentName = metadata.name || baseName;
        
        // Get default configuration for this component type if available
        const defaultConfig = COMPONENT_DEFAULTS[componentId] || {};
        
        // Create component entry
        const component = {
          svg: `components/${file}`,
          name: componentName,
          id: componentId,
          ...defaultConfig
        };
        
        components.push(component);
      }
    }
    
    // Sort components by name
    components.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create the final JSON structure
    const componentsJson = { components };
    
    // Write to components.json
    await fs.promises.writeFile(
      COMPONENTS_JSON_PATH,
      JSON.stringify(componentsJson, null, 2) + '\n',
      'utf8'
    );
    
    console.log(`✅ Successfully updated ${COMPONENTS_JSON_PATH} with ${components.length} components`);
    return true;
  } catch (error) {
    console.error('Error updating components.json:', error);
    return false;
  }
}

// Export the function for use in other modules
module.exports = { updateComponentsJson };

// If this script is run directly (not imported)
if (require.main === module) {
  updateComponentsJson().then(success => {
    process.exit(success ? 0 : 1);
  });
}
