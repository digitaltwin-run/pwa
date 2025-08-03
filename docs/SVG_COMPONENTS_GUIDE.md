# Digital Twin IDE - SVG Components Guide

## Table of Contents
1. [Introduction](#introduction)
2. [SVG Component Requirements](#svg-component-requirements)
3. [XML Metadata Format](#xml-metadata-format)
4. [Animation Scripts](#animation-scripts)
5. [Common Issues and Solutions](#common-issues-and-solutions)
6. [Best Practices](#best-practices)
7. [Validation](#validation)
8. [Troubleshooting](#troubleshooting)

## Introduction

This guide explains how to create and use SVG components in the Digital Twin IDE. SVG components are the building blocks of your digital twin interfaces, providing interactive elements that can be animated and controlled through the application.

## SVG Component Requirements

### File Structure
- Must be a valid XML document
- Must have proper SVG namespace declaration
- Must include XML metadata in the specified format
- Must be properly closed with `</svg>`
- Must not contain unescaped special characters

### Required Attributes
```xml
<svg 
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 100 100"
  width="100" 
  height="100"
  data-component-id="unique-id"
  class="draggable-component">
  <!-- SVG content -->
</svg>
```

## XML Metadata Format

All components must include properly formatted XML metadata within a `<metadata>` element. This metadata is used by the Digital Twin IDE to understand and manipulate the component.

### Required Metadata Structure

```xml
<metadata>
  <component id="unique-id" name="Component Name" type="component-type">
    <parameters>
      <label>Label Text</label>
      <isActive>true</isActive>
      <!-- Component-specific parameters -->
    </parameters>
  </component>
</metadata>
```

> **IMPORTANT**: The metadata MUST use XML format as shown above. The previous JSON-based format using `<script type="application/json" class="metadata">` is no longer supported and will cause conflicts with the application.

### Component Types and Required Parameters

Each component type requires specific parameters:

#### LED Component
```xml
<parameters>
  <label>LED1</label>
  <isActive>true</isActive>
  <color>#ff0000</color>
  <isOn>true</isOn>
  <isBlinking>false</isBlinking>
  <blinkRate>500</blinkRate>
</parameters>
```

#### Button Component
```xml
<parameters>
  <label>Button1</label>
  <isActive>true</isActive>
  <pressed>false</pressed>
  <momentary>true</momentary>
</parameters>
```

#### Switch Component
```xml
<parameters>
  <label>Switch1</label>
  <isActive>true</isActive>
  <state>false</state>
</parameters>
```

#### Slider/Knob Components
```xml
<parameters>
  <label>Slider1</label>
  <isActive>true</isActive>
  <value>50</value>
  <min>0</min>
  <max>100</max>
</parameters>
```

#### Gauge Component
```xml
<parameters>
  <label>Gauge1</label>
  <isActive>true</isActive>
  <value>50</value>
  <min>0</min>
  <max>100</max>
  <units>%</units>
</parameters>
```

#### Counter Component
```xml
<parameters>
  <label>Counter1</label>
  <isActive>true</isActive>
  <value>0</value>
  <min>0</min>
  <max>100</max>
  <step>1</step>
</parameters>
```

#### Motor Component
```xml
<parameters>
  <label>Motor1</label>
  <isActive>true</isActive>
  <speed>0</speed>
  <direction>clockwise</direction>
  <isRunning>false</isRunning>
</parameters>
```

## Animation Scripts

Components should include animation scripts that respond to changes in metadata parameters. These scripts should be embedded in the SVG using CDATA sections.

### Script Structure

```xml
<defs>
  <script>
    <![CDATA[
      (function() {
        // Get reference to this specific SVG instance
        const svgElement = document.currentScript.closest('svg');
        
        // Initialize component
        function initialize() {
          // Read metadata parameters
          const metadata = getMetadata(svgElement);
          
          // Set up initial state
          updateComponent(svgElement, metadata);
          
          // Set up polling for parameter changes
          setupPolling(svgElement);
        }
        
        // Read metadata from XML format
        function getMetadata(svg) {
          const params = {};
          const metadataElement = svg.querySelector('metadata');
          
          if (metadataElement) {
            const parametersElement = metadataElement.querySelector('component > parameters');
            if (parametersElement) {
              // Convert all parameter elements to a JavaScript object
              Array.from(parametersElement.children).forEach(param => {
                const name = param.tagName;
                let value = param.textContent.trim();
                
                // Convert string values to appropriate types
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value.trim() !== '') value = Number(value);
                
                params[name] = value;
              });
            }
          }
          
          return params;
        }
        
        // Update component based on parameters
        function updateComponent(svg, params) {
          // Component-specific update logic
          // ...
        }
        
        // Set up polling for parameter changes
        function setupPolling(svg) {
          // Check for parameter changes periodically
          svg.pollingInterval = setInterval(() => {
            const params = getMetadata(svg);
            // Update component if parameters changed
            updateComponent(svg, params);
          }, 500);
          
          // Clean up on removal
          window.addEventListener('beforeunload', () => {
            if (svg.pollingInterval) clearInterval(svg.pollingInterval);
          });
          
          // For SVGs that are embedded and might be removed
          try {
            if (typeof MutationObserver !== 'undefined' && svg.ownerDocument && svg.ownerDocument.body) {
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (Array.from(mutation.removedNodes).includes(svg)) {
                    if (svg.pollingInterval) clearInterval(svg.pollingInterval);
                    observer.disconnect();
                  }
                });
              });
              
              observer.observe(svg.parentNode, { childList: true });
            }
          } catch (e) {
            // Ignore errors for standalone SVGs
            console.warn("Could not set up observer:", e);
          }
        }
        
        // Initialize the component
        initialize();
      })();
    ]]>
  </script>
</defs>
```

### Important Script Considerations

1. **CDATA Sections**: Always wrap JavaScript code in CDATA sections to prevent XML parsing issues.
2. **Self-Contained**: Use an IIFE (Immediately Invoked Function Expression) to keep variables scoped to the component.
3. **SVG Reference**: Use `document.currentScript.closest('svg')` to get a reference to the specific SVG instance.
4. **Cleanup**: Always clean up intervals and event listeners when the component is removed.
5. **Error Handling**: Include try/catch blocks for operations that might fail in different contexts.
6. **Metadata Reading**: Use the XML format for reading metadata parameters.
7. **DOM References**: Use `svg.ownerDocument` instead of directly accessing `document.body` to avoid errors in different contexts.

### Example: LED Animation Script

```xml
<defs>
  <script>
    <![CDATA[
      (function() {
        const svg = document.currentScript.closest('svg');
        const ledCircle = svg.querySelector('.led-circle');
        let blinkInterval;
        
        function initialize() {
          const params = getMetadata(svg);
          updateLED(params);
          setupPolling();
        }
        
        function getMetadata(svg) {
          const params = { isOn: false, color: '#ff0000', isBlinking: false, blinkRate: 500 };
          const metadataElement = svg.querySelector('metadata');
          
          if (metadataElement) {
            const parametersElement = metadataElement.querySelector('component > parameters');
            if (parametersElement) {
              Array.from(parametersElement.children).forEach(param => {
                const name = param.tagName;
                let value = param.textContent.trim();
                
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(value) && value.trim() !== '') value = Number(value);
                
                params[name] = value;
              });
            }
          }
          
          return params;
        }
        
        function updateLED(params) {
          if (blinkInterval) {
            clearInterval(blinkInterval);
            blinkInterval = null;
          }
          
          if (params.isBlinking && params.isOn) {
            let isVisible = true;
            blinkInterval = setInterval(() => {
              isVisible = !isVisible;
              ledCircle.style.fill = isVisible ? params.color : '#444444';
            }, params.blinkRate);
          } else {
            ledCircle.style.fill = params.isOn ? params.color : '#444444';
          }
        }
        
        function setupPolling() {
          svg.pollingInterval = setInterval(() => {
            const params = getMetadata(svg);
            updateLED(params);
          }, 500);
          
          window.addEventListener('beforeunload', () => {
            if (svg.pollingInterval) clearInterval(svg.pollingInterval);
            if (blinkInterval) clearInterval(blinkInterval);
          });
          
          try {
            if (typeof MutationObserver !== 'undefined' && svg.ownerDocument && svg.ownerDocument.body) {
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  if (Array.from(mutation.removedNodes).includes(svg)) {
                    if (svg.pollingInterval) clearInterval(svg.pollingInterval);
                    if (blinkInterval) clearInterval(blinkInterval);
                    observer.disconnect();
                  }
                });
              });
              
              observer.observe(svg.parentNode, { childList: true });
            }
          } catch (e) {
            console.warn("Could not set up observer:", e);
          }
        }
        
        initialize();
      })();
    ]]>
  </script>
</defs>
```

## Common Issues and Solutions

### 1. XML Parsing Errors

**Error Message:**
```
XML Parsing Error: unclosed CDATA section
```

**Cause:**
- Unclosed CDATA sections (`<![CDATA[ ... ]]>`)
- Unescaped special characters in the SVG
- Missing closing tags

**Solution:**
1. Check for unclosed CDATA sections
2. Ensure all special characters are properly escaped
3. Verify all tags are properly closed
4. Use an XML validator to check your SVG

### 2. Component Not Loading

**Possible Causes:**
- Missing required attributes
- Invalid SVG structure
- File encoding issues
- Incorrect metadata format

**Solution:**
1. Verify all required attributes are present
2. Check the browser console for specific error messages
3. Ensure the file is saved with UTF-8 encoding
4. Confirm metadata is in XML format, not JSON

### 3. Animation Not Working

**Possible Causes:**
- Script errors in the animation code
- Incorrect DOM element references
- Missing or incorrect metadata parameters

**Solution:**
1. Check browser console for JavaScript errors
2. Verify that all DOM elements referenced in the script exist in the SVG
3. Confirm that metadata parameters are correctly defined
4. Use `console.log()` to debug parameter values

## Best Practices

### 1. Naming Conventions
- Use kebab-case for file names (e.g., `motor-control.svg`)
- Use descriptive names that reflect the component's purpose
- Prefix related components (e.g., `motor-on.svg`, `motor-off.svg`)

### 2. SVG Optimization
- Remove unnecessary metadata
- Minimize the use of groups (`<g>`) when possible
- Use simple shapes instead of complex paths when appropriate
- Optimize path data

### 3. Interactivity
- Add `class` attributes for styling
- Use `data-*` attributes for custom data
- Keep interactivity logic in JavaScript when possible

### 4. Metadata Management
- Always use XML format for metadata
- Include all required parameters for the component type
- Use descriptive parameter names
- Follow the schema defined in component-schema.xsd

## Troubleshooting

### 1. Debugging SVG Issues
1. Open the SVG file in a browser to check for rendering issues
2. Use the browser's developer tools to inspect the SVG element
3. Check the console for JavaScript errors
4. Verify the SVG's dimensions and viewBox

### 2. Common Fixes
- **Missing viewBox**: Add `viewBox="0 0 width height"`
- **Improper nesting**: Ensure all elements are properly nested and closed
- **Invalid attributes**: Remove or fix any unsupported attributes
- **Character encoding**: Save files with UTF-8 encoding
- **Metadata format**: Convert JSON metadata to XML format

### 3. Getting Help
If you encounter issues not covered in this guide:
1. Check the browser's console for error messages
2. Validate your SVG using an online validator
3. Consult the [MDN SVG documentation](https://developer.mozilla.org/en-US/docs/Web/SVG)

## Validation

The Digital Twin IDE includes a validator tool that checks SVG components for compliance with the schema and best practices.

### Using the Validator

```bash
# Validate all SVG components
node validator.js ./components/*.svg

# Validate a specific component
node validator.js ./components/led.svg

# Try to automatically fix common issues
node validator.js --fix ./components/*.svg
```

### What the Validator Checks

1. **XSD Schema Validation**: Ensures the SVG conforms to the component-schema.xsd schema.
2. **Metadata Structure**: Verifies that the metadata is properly formatted and contains all required fields.
3. **Script Structure**: Checks for proper script structure, CDATA sections, and common patterns.
4. **Component-Specific Requirements**: Validates that each component type has its required elements and parameters.
5. **JavaScript Syntax**: Checks for JavaScript syntax errors in component scripts.

### Common Validation Errors

- **Missing required parameters**: Each component type requires specific parameters in its metadata.
- **Invalid XML structure**: The XML structure must conform to the schema.
- **Unclosed CDATA sections**: All CDATA sections must be properly closed with `]]>`.
- **Missing script elements**: Interactive components should have animation scripts.
- **Improper script termination**: Scripts should be properly terminated with `})();`.

### XSD Schema

The component-schema.xsd file defines the structure and constraints for SVG components. It validates:

- Required SVG attributes (width, height, viewBox)
- Metadata structure and required fields
- Component parameters based on type
- Animation-related fields (isOn, isBlinking, blinkRate, etc.)

The schema is designed to be flexible while ensuring that components meet the minimum requirements for proper functioning in the Digital Twin IDE.

---

*Last updated: September 15, 2023*
