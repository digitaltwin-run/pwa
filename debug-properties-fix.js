/**
 * 🐛 Debug Fix for Properties Mapping Issue
 * Temporary fix for the getAvailableTargetComponents empty array problem
 */

// Enhanced debugging for the mapping issue
function debugPropertiesMapping() {
    console.log('🐛 DEBUG: Properties Mapping Issue Analysis');
    console.log('================================================');
    
    const propertiesManager = window.propertiesManager;
    const mapper = propertiesManager?.propertiesMapper;
    
    if (!mapper) {
        console.error('❌ PropertiesMapper not available');
        return;
    }
    
    console.log('1. 🔍 Current state:');
    console.log('   mappedProperties:', mapper.mappedProperties);
    console.log('   mappedProperties size:', mapper.mappedProperties?.size);
    console.log('   mappedProperties type:', typeof mapper.mappedProperties);
    console.log('   is Map:', mapper.mappedProperties instanceof Map);
    
    console.log('2. 🖼️ Canvas analysis:');
    const canvas = document.getElementById('svg-canvas');
    const components = canvas?.querySelectorAll('[data-id]');
    console.log('   Canvas found:', !!canvas);
    console.log('   Components on canvas:', components?.length || 0);
    
    if (components?.length > 0) {
        Array.from(components).forEach((comp, index) => {
            console.log(`   Component ${index + 1}:`, {
                id: comp.getAttribute('data-id'),
                svgUrl: comp.getAttribute('data-svg-url'),
                hasMetadata: !!comp.getAttribute('data-metadata'),
                nodeName: comp.nodeName
            });
        });
    }
    
    console.log('3. 🔧 Testing extraction manually:');
    if (components?.length > 0) {
        const testComponent = components[0];
        const testId = testComponent.getAttribute('data-id');
        
        try {
            const extractedProps = mapper.extractElementPropertiesFromSvg(testComponent);
            console.log(`   Extracted props for ${testId}:`, extractedProps);
            
            // Test manual mapping
            if (mapper.mappedProperties instanceof Map) {
                mapper.mappedProperties.set(testId, extractedProps);
                console.log('   ✅ Manual mapping successful');
                console.log('   New mappedProperties size:', mapper.mappedProperties.size);
                
                // Test getAvailableTargetComponents after manual mapping
                const targets = mapper.getAvailableTargetComponents();
                console.log('   Available targets after manual mapping:', targets);
                
            } else {
                console.error('   ❌ mappedProperties is not a Map');
            }
            
        } catch (error) {
            console.error('   ❌ Error during extraction:', error);
        }
    }
    
    console.log('4. 🔄 Testing scanCanvasProperties:');
    try {
        mapper.scanCanvasProperties();
        console.log('   ✅ scanCanvasProperties executed');
        console.log('   Final mappedProperties size:', mapper.mappedProperties?.size);
        
        const finalTargets = mapper.getAvailableTargetComponents();
        console.log('   Final available targets:', finalTargets);
        
    } catch (error) {
        console.error('   ❌ Error in scanCanvasProperties:', error);
    }
    
    console.log('================================================');
    return mapper.mappedProperties;
}

// Quick fix function
function quickFixPropertiesMapping() {
    console.log('🚀 Quick Fix: Properties Mapping');
    
    const mapper = window.propertiesManager?.propertiesMapper;
    if (!mapper) {
        console.error('❌ PropertiesMapper not available');
        return false;
    }
    
    // Ensure mappedProperties is a Map
    if (!(mapper.mappedProperties instanceof Map)) {
        console.log('🔧 Initializing mappedProperties as Map');
        mapper.mappedProperties = new Map();
    }
    
    // Ensure availableVariables is a Map
    if (!(mapper.availableVariables instanceof Map)) {
        console.log('🔧 Initializing availableVariables as Map');
        mapper.availableVariables = new Map();
    }
    
    // Force scan
    console.log('🔄 Forcing canvas scan...');
    mapper.scanCanvasProperties();
    
    const targets = mapper.getAvailableTargetComponents();
    console.log('✅ Quick fix result:', targets.length, 'targets available');
    
    return targets.length > 0;
}

// Make functions available globally
window.debugPropertiesMapping = debugPropertiesMapping;
window.quickFixPropertiesMapping = quickFixPropertiesMapping;

console.log('🐛 Debug Properties Fix loaded!');
console.log('📋 Available debug commands:');
console.log('  debugPropertiesMapping() - Full diagnostic');
console.log('  quickFixPropertiesMapping() - Attempt quick fix');
