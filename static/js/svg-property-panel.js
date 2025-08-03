/**
 * SVG Property Panel Enhancement
 * 
 * This script enhances the SVG editor's property panel to properly display
 * component parameters from the SVG metadata.
 */

// Expose functions for testing
const svgPropertyPanel = {
  enhancePropertyPanel,
  getSelectedSvgElement,
  getComponentMetadata,
  updatePropertyPanel,
  formatParamName,
  updateParameter
};

// Make functions available on window for testing
if (typeof window !== 'undefined') {
  window.svgPropertyPanel = svgPropertyPanel;
  // Also expose individual functions for backward compatibility
  window.enhancePropertyPanel = enhancePropertyPanel;
  window.getSelectedSvgElement = getSelectedSvgElement;
  window.getComponentMetadata = getComponentMetadata;
  window.updatePropertyPanel = updatePropertyPanel;
  window.formatParamName = formatParamName;
  window.updateParameter = updateParameter;
}

document.addEventListener('DOMContentLoaded', function() {
  // Wait for the SVG editor to be fully loaded
  const checkEditor = setInterval(function() {
    const propertyPanel = document.querySelector('.property-panel, [class*="PropertyPanel"], [class*="property-panel"]');
    
    if (propertyPanel) {
      clearInterval(checkEditor);
      enhancePropertyPanel(propertyPanel);
    }
  }, 500);
  
  // If we don't find the property panel after 10 seconds, give up
  setTimeout(function() {
    clearInterval(checkEditor);
  }, 10000);
});

/**
 * Enhance the property panel to show component parameters
 */
function enhancePropertyPanel(panel) {
  console.log('Enhancing SVG property panel...');
  
  // Create a MutationObserver to watch for changes to the property panel
  const observer = new MutationObserver(function(mutations) {
    // Check if the selected element is an SVG component with metadata
    const selectedElement = getSelectedSvgElement();
    
    if (selectedElement && selectedElement.tagName.toLowerCase() === 'svg') {
      const metadata = getComponentMetadata(selectedElement);
      
      if (metadata && metadata.parameters) {
        updatePropertyPanel(panel, metadata.parameters);
      }
    }
  });
  
  // Start observing the property panel for changes
  observer.observe(panel, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
  
  console.log('SVG property panel enhancement active');
}

/**
 * Get the currently selected SVG element in the editor
 */
function getSelectedSvgElement() {
  // This selector might need to be adjusted based on the SVG editor's structure
  const selected = document.querySelector('.selected, [class*="selected"], [class*="Selected"], [data-selected="true"]');
  
  // If the selected element is an SVG, return it
  if (selected && selected.tagName && selected.tagName.toLowerCase() === 'svg') {
    return selected;
  }
  
  // If the selected element is inside an SVG, return the SVG element
  const svgAncestor = selected ? selected.closest('svg') : null;
  return svgAncestor;
}

/**
 * Extract component metadata from an SVG element
 */
function getComponentMetadata(svgElement) {
  try {
    const metadataElement = svgElement.querySelector('metadata component');
    
    if (!metadataElement) {
      return null;
    }
    
    const result = { parameters: {} };
    const paramsElement = metadataElement.querySelector('parameters');
    
    if (paramsElement) {
      // Get all direct children of parameters element
      const paramElements = Array.from(paramsElement.children);
      
      paramElements.forEach(paramEl => {
        const paramName = paramEl.tagName.toLowerCase();
        result.parameters[paramName] = paramEl.textContent.trim();
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error parsing component metadata:', error);
    return null;
  }
}

/**
 * Update the property panel with component parameters
 */
function updatePropertyPanel(panel, parameters) {
  // Find or create the component parameters section
  let paramsSection = panel.querySelector('.component-parameters, [data-component-params]');
  
  if (!paramsSection) {
    paramsSection = document.createElement('div');
    paramsSection.className = 'component-parameters';
    paramsSection.setAttribute('data-component-params', 'true');
    
    // Add a header
    const header = document.createElement('h3');
    header.textContent = 'Component Parameters';
    header.style.margin = '10px 0 5px 0';
    header.style.paddingBottom = '5px';
    header.style.borderBottom = '1px solid #ddd';
    
    paramsSection.appendChild(header);
    
    // Insert the section at the top of the panel
    panel.insertBefore(paramsSection, panel.firstChild);
  } else {
    // Clear existing parameter inputs
    while (paramsSection.children.length > 1) { // Keep the header
      paramsSection.removeChild(paramsSection.lastChild);
    }
  }
  
  // Add parameter inputs
  Object.entries(parameters).forEach(([paramName, paramValue]) => {
    // Skip internal parameters
    if (paramName.startsWith('_')) return;
    
    const paramDiv = document.createElement('div');
    paramDiv.className = 'parameter-row';
    paramDiv.style.margin = '5px 0';
    paramDiv.style.display = 'flex';
    paramDiv.style.alignItems = 'center';
    
    const label = document.createElement('label');
    label.textContent = formatParamName(paramName) + ':';
    label.style.flex = '1';
    label.style.marginRight = '10px';
    label.style.fontSize = '0.9em';
    
    let input;
    
    // Create appropriate input based on parameter name and value
    if (typeof paramValue === 'boolean' || 
        paramName.toLowerCase().includes('is') || 
        paramName.toLowerCase().includes('active') ||
        paramName.toLowerCase().includes('enabled')) {
      // Boolean parameter (checkbox)
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = paramValue === 'true' || paramValue === true;
      input.style.width = 'auto';
      input.onchange = (e) => updateParameter(paramName, e.target.checked);
    } else if (paramName.toLowerCase().includes('color')) {
      // Color parameter (color picker)
      input = document.createElement('input');
      input.type = 'color';
      input.value = paramValue || '#000000';
      input.style.width = '40px';
      input.style.height = '24px';
      input.style.padding = '0';
      input.style.border = '1px solid #ccc';
      input.onchange = (e) => updateParameter(paramName, e.target.value);
    } else if (!isNaN(paramValue) && paramValue.toString().trim() !== '') {
      // Numeric parameter (number input)
      input = document.createElement('input');
      input.type = 'number';
      input.value = paramValue;
      input.style.width = '60px';
      input.onchange = (e) => updateParameter(paramName, parseFloat(e.target.value) || 0);
    } else {
      // Text parameter (text input)
      input = document.createElement('input');
      input.type = 'text';
      input.value = paramValue;
      input.style.flex = '1';
      input.onchange = (e) => updateParameter(paramName, e.target.value);
    }
    
    // Common input styles
    input.style.padding = '3px 5px';
    input.style.border = '1px solid #ccc';
    input.style.borderRadius = '3px';
    
    paramDiv.appendChild(label);
    paramDiv.appendChild(input);
    
    paramsSection.appendChild(paramDiv);
  });
}

/**
 * Format parameter name for display (e.g., "isActive" -> "Is Active")
 */
function formatParamName(name) {
  // Handle camelCase
  const result = name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
  
  // Handle snake_case
  return result.replace(/_/g, ' ');
}

/**
 * Update a parameter value in the SVG metadata
 */
function updateParameter(paramName, value) {
  const selectedElement = getSelectedSvgElement();
  
  if (!selectedElement) {
    console.warn('No SVG element selected');
    return;
  }
  
  const metadataElement = selectedElement.querySelector('metadata component');
  
  if (!metadataElement) {
    console.warn('No metadata found in selected element');
    return;
  }
  
  let paramsElement = metadataElement.querySelector('parameters');
  
  if (!paramsElement) {
    paramsElement = document.createElement('parameters');
    metadataElement.appendChild(paramsElement);
  }
  
  let paramElement = paramsElement.querySelector(paramName);
  
  if (!paramElement) {
    paramElement = document.createElement(paramName);
    paramsElement.appendChild(paramElement);
  }
  
  // Convert boolean to string
  const stringValue = typeof value === 'boolean' ? value.toString() : value;
  
  // Update the parameter value
  paramElement.textContent = stringValue;
  
  console.log(`Updated parameter: ${paramName} = ${stringValue}`);
  
  // Dispatch a custom event to notify other parts of the application
  const event = new CustomEvent('componentParameterUpdated', {
    detail: {
      element: selectedElement,
      parameter: paramName,
      value: value
    }
  });
  
  document.dispatchEvent(event);
}
