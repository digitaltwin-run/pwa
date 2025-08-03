/**
 * 🐛 Interaction Panel Bug Detector
 * Specific tools to detect and fix the empty select issue in interaction panels
 */

class InteractionBugDetector {
    constructor() {
        this.fixes = [];
        this.diagnostics = {};
    }

    // 🔍 Main diagnostic function for the empty selects bug
    async diagnoseEmptySelectsBug() {
        console.log('🔍 Diagnosing empty interaction selects bug...');
        
        const diagnosis = {
            timestamp: new Date().toISOString(),
            bugDetected: false,
            rootCause: null,
            fixes: [],
            details: {}
        };

        // Step 1: Check if bug exists
        const bugExists = this.detectEmptySelects();
        if (!bugExists) {
            console.log('✅ No empty select bug detected');
            return { ...diagnosis, bugDetected: false };
        }

        diagnosis.bugDetected = true;
        console.log('🚨 Empty selects bug confirmed!');

        // Step 2: Diagnose root cause
        diagnosis.rootCause = await this.identifyRootCause();
        diagnosis.details = await this.gatherDiagnosticData();

        // Step 3: Generate fixes
        diagnosis.fixes = this.generateFixes(diagnosis.rootCause);

        // Step 4: Auto-apply safe fixes
        const autoFixResults = await this.applySafeFixes(diagnosis.fixes);
        diagnosis.autoFixResults = autoFixResults;

        this.logDiagnosisReport(diagnosis);
        return diagnosis;
    }

    // 🚨 Detect empty selects in interaction panels
    detectEmptySelects() {
        const interactionPanels = document.querySelectorAll('.interaction');
        let emptySelectsFound = 0;

        interactionPanels.forEach(panel => {
            const targetSelect = panel.querySelector('select[onchange*="target"]');
            const propertySelect = panel.querySelector('select[onchange*="property"]');

            if (targetSelect) {
                const targetOptions = targetSelect.querySelectorAll('option:not([value=""])');
                if (targetOptions.length === 0) {
                    emptySelectsFound++;
                    console.log('🚨 Empty target select found in panel:', panel);
                }
            }

            if (propertySelect) {
                const propertyOptions = propertySelect.querySelectorAll('option:not([value=""])');
                if (propertyOptions.length === 0) {
                    emptySelectsFound++;
                    console.log('🚨 Empty property select found in panel:', panel);
                }
            }
        });

        return emptySelectsFound > 0;
    }

    // 🔬 Identify root cause of the bug
    async identifyRootCause() {
        const causes = [];

        // Check 1: PropertiesMapper availability
        const mapper = window.propertiesManager?.propertiesMapper;
        if (!mapper) {
            causes.push('PROPERTIES_MAPPER_MISSING');
        } else if (!mapper.mappedProperties) {
            causes.push('MAPPER_NOT_INITIALIZED');
        } else if (mapper.mappedProperties.size === 0) {
            causes.push('NO_COMPONENTS_MAPPED');
        }

        // Check 2: InteractionsManager availability
        const interactionsMgr = window.propertiesManager?.interactionsManager;
        if (!interactionsMgr) {
            causes.push('INTERACTIONS_MANAGER_MISSING');
        } else {
            // Test generateTargetOptions method
            try {
                const targetHTML = interactionsMgr.generateTargetOptions('');
                if (!targetHTML.includes('<option value=') || targetHTML.includes('option value=""')) {
                    causes.push('GENERATE_TARGET_OPTIONS_BROKEN');
                }
            } catch (error) {
                causes.push('GENERATE_TARGET_OPTIONS_ERROR');
                console.error('generateTargetOptions error:', error);
            }

            // Test generatePropertyOptions method
            try {
                const propertyHTML = interactionsMgr.generatePropertyOptions('', 'comp-0');
                if (!propertyHTML.includes('<option value=')) {
                    causes.push('GENERATE_PROPERTY_OPTIONS_BROKEN');
                }
            } catch (error) {
                causes.push('GENERATE_PROPERTY_OPTIONS_ERROR');
                console.error('generatePropertyOptions error:', error);
            }
        }

        // Check 3: Components on canvas
        const canvas = document.getElementById('svg-canvas');
        if (canvas) {
            const components = canvas.querySelectorAll('[data-id]');
            if (components.length === 0) {
                causes.push('NO_COMPONENTS_ON_CANVAS');
            }
        } else {
            causes.push('CANVAS_MISSING');
        }

        // Check 4: Mapping synchronization
        if (mapper && canvas) {
            const canvasComponents = canvas.querySelectorAll('[data-id]');
            const mappedCount = mapper.mappedProperties.size;
            
            if (canvasComponents.length > mappedCount) {
                causes.push('MAPPING_OUT_OF_SYNC');
            }
        }

        return causes.length > 0 ? causes : ['UNKNOWN'];
    }

    // 📊 Gather detailed diagnostic data
    async gatherDiagnosticData() {
        const data = {};

        // Canvas components
        const canvas = document.getElementById('svg-canvas');
        if (canvas) {
            const components = canvas.querySelectorAll('[data-id]');
            data.canvasComponents = Array.from(components).map(comp => ({
                id: comp.getAttribute('data-id'),
                svgUrl: comp.getAttribute('data-svg-url'),
                hasMetadata: !!comp.getAttribute('data-metadata')
            }));
        }

        // Mapped components
        const mapper = window.propertiesManager?.propertiesMapper;
        if (mapper && mapper.mappedProperties) {
            data.mappedComponents = Array.from(mapper.mappedProperties.entries()).map(([id, props]) => ({
                id,
                type: props.type,
                eventsCount: props.events?.length || 0,
                parametersCount: Object.keys(props.parameters || {}).length
            }));
        }

        // Available target options
        const interactionsMgr = window.propertiesManager?.interactionsManager;
        if (interactionsMgr) {
            try {
                const availableTargets = mapper?.getAvailableTargetComponents() || [];
                data.availableTargets = availableTargets.map(target => ({
                    id: target.id,
                    name: target.name,
                    type: target.type,
                    parametersCount: target.parameters?.length || 0
                }));
            } catch (error) {
                data.availableTargets = { error: error.message };
            }
        }

        // Interaction panels
        const panels = document.querySelectorAll('.interaction');
        data.interactionPanels = Array.from(panels).map((panel, index) => {
            const targetSelect = panel.querySelector('select[onchange*="target"]');
            const propertySelect = panel.querySelector('select[onchange*="property"]');
            
            return {
                index,
                hasTargetSelect: !!targetSelect,
                targetOptionsCount: targetSelect ? targetSelect.querySelectorAll('option').length : 0,
                hasPropertySelect: !!propertySelect,
                propertyOptionsCount: propertySelect ? propertySelect.querySelectorAll('option').length : 0
            };
        });

        return data;
    }

    // 🔧 Generate fixes based on root cause
    generateFixes(rootCauses) {
        const fixes = [];

        rootCauses.forEach(cause => {
            switch (cause) {
                case 'PROPERTIES_MAPPER_MISSING':
                    fixes.push({
                        type: 'CRITICAL',
                        description: 'PropertiesMapper is missing',
                        action: 'RELOAD_PAGE',
                        autoApply: false,
                        command: 'window.location.reload()'
                    });
                    break;

                case 'MAPPER_NOT_INITIALIZED':
                case 'NO_COMPONENTS_MAPPED':
                case 'MAPPING_OUT_OF_SYNC':
                    fixes.push({
                        type: 'SAFE',
                        description: 'Refresh properties mapping',
                        action: 'REFRESH_MAPPING',
                        autoApply: true,
                        command: 'refreshPropertiesMapping()'
                    });
                    break;

                case 'INTERACTIONS_MANAGER_MISSING':
                    fixes.push({
                        type: 'CRITICAL',
                        description: 'InteractionsManager is missing',
                        action: 'RELOAD_PAGE',
                        autoApply: false,
                        command: 'window.location.reload()'
                    });
                    break;

                case 'GENERATE_TARGET_OPTIONS_BROKEN':
                case 'GENERATE_TARGET_OPTIONS_ERROR':
                    fixes.push({
                        type: 'REPAIR',
                        description: 'Fix generateTargetOptions method',
                        action: 'DEBUG_TARGET_OPTIONS',
                        autoApply: true,
                        command: 'this.debugTargetOptionsGeneration()'
                    });
                    break;

                case 'GENERATE_PROPERTY_OPTIONS_BROKEN':
                case 'GENERATE_PROPERTY_OPTIONS_ERROR':
                    fixes.push({
                        type: 'REPAIR',
                        description: 'Fix generatePropertyOptions method',
                        action: 'DEBUG_PROPERTY_OPTIONS',
                        autoApply: true,
                        command: 'this.debugPropertyOptionsGeneration()'
                    });
                    break;

                case 'NO_COMPONENTS_ON_CANVAS':
                    fixes.push({
                        type: 'INFO',
                        description: 'Add components to canvas first',
                        action: 'USER_ACTION_REQUIRED',
                        autoApply: false,
                        command: 'console.log("Please add components to canvas")'
                    });
                    break;

                case 'CANVAS_MISSING':
                    fixes.push({
                        type: 'CRITICAL',
                        description: 'Canvas element is missing',
                        action: 'RELOAD_PAGE',
                        autoApply: false,
                        command: 'window.location.reload()'
                    });
                    break;

                default:
                    fixes.push({
                        type: 'UNKNOWN',
                        description: 'Unknown issue detected',
                        action: 'MANUAL_DEBUG',
                        autoApply: false,
                        command: 'console.log("Manual debugging required")'
                    });
            }
        });

        return fixes;
    }

    // 🔧 Apply safe fixes automatically
    async applySafeFixes(fixes) {
        const results = [];

        for (const fix of fixes) {
            if (fix.autoApply) {
                console.log(`🔧 Applying fix: ${fix.description}`);
                
                try {
                    if (fix.action === 'REFRESH_MAPPING') {
                        if (typeof refreshPropertiesMapping === 'function') {
                            refreshPropertiesMapping();
                            results.push({ fix: fix.description, status: 'SUCCESS' });
                        } else {
                            results.push({ fix: fix.description, status: 'FAILED', error: 'refreshPropertiesMapping not available' });
                        }
                    } else if (fix.action === 'DEBUG_TARGET_OPTIONS') {
                        this.debugTargetOptionsGeneration();
                        results.push({ fix: fix.description, status: 'SUCCESS' });
                    } else if (fix.action === 'DEBUG_PROPERTY_OPTIONS') {
                        this.debugPropertyOptionsGeneration();
                        results.push({ fix: fix.description, status: 'SUCCESS' });
                    }
                } catch (error) {
                    results.push({ fix: fix.description, status: 'FAILED', error: error.message });
                }
            }
        }

        return results;
    }

    // 🔍 Debug target options generation
    debugTargetOptionsGeneration() {
        console.log('🔍 Debugging target options generation...');
        
        const mapper = window.propertiesManager?.propertiesMapper;
        const interactionsMgr = window.propertiesManager?.interactionsManager;

        if (!mapper || !interactionsMgr) {
            console.error('❌ Required managers not available');
            return;
        }

        // Test getAvailableTargetComponents
        try {
            const targets = mapper.getAvailableTargetComponents();
            console.log('🎯 Available targets from mapper:', targets);

            if (targets.length === 0) {
                console.log('🔧 Forcing mapping refresh...');
                if (typeof refreshPropertiesMapping === 'function') {
                    refreshPropertiesMapping();
                    // Retry after refresh
                    setTimeout(() => {
                        const newTargets = mapper.getAvailableTargetComponents();
                        console.log('🎯 Available targets after refresh:', newTargets);
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('❌ Error getting available targets:', error);
        }

        // Test generateTargetOptions
        try {
            const html = interactionsMgr.generateTargetOptions('');
            console.log('🎯 Generated target options HTML:', html);
        } catch (error) {
            console.error('❌ Error generating target options:', error);
        }
    }

    // 🔍 Debug property options generation
    debugPropertyOptionsGeneration() {
        console.log('🔍 Debugging property options generation...');
        
        const interactionsMgr = window.propertiesManager?.interactionsManager;
        if (!interactionsMgr) {
            console.error('❌ InteractionsManager not available');
            return;
        }

        // Test with first available component
        const canvas = document.getElementById('svg-canvas');
        if (canvas) {
            const firstComponent = canvas.querySelector('[data-id]');
            if (firstComponent) {
                const componentId = firstComponent.getAttribute('data-id');
                
                try {
                    const html = interactionsMgr.generatePropertyOptions('', componentId);
                    console.log('🎯 Generated property options HTML:', html);
                } catch (error) {
                    console.error('❌ Error generating property options:', error);
                }
            }
        }
    }

    // 📄 Log comprehensive diagnosis report
    logDiagnosisReport(diagnosis) {
        console.log('\n📋 INTERACTION BUG DIAGNOSIS REPORT');
        console.log('=====================================');
        console.log('🕐 Timestamp:', diagnosis.timestamp);
        console.log('🚨 Bug Detected:', diagnosis.bugDetected);
        
        if (diagnosis.bugDetected) {
            console.log('🔍 Root Causes:', diagnosis.rootCause);
            console.log('🔧 Fixes Generated:', diagnosis.fixes.length);
            
            diagnosis.fixes.forEach(fix => {
                const icon = fix.autoApply ? '✅' : '⚠️';
                console.log(`  ${icon} ${fix.description} (${fix.type})`);
            });

            if (diagnosis.autoFixResults) {
                console.log('🤖 Auto-fix Results:');
                diagnosis.autoFixResults.forEach(result => {
                    const icon = result.status === 'SUCCESS' ? '✅' : '❌';
                    console.log(`  ${icon} ${result.fix}: ${result.status}`);
                });
            }
        }

        console.log('📊 Diagnostic Details:');
        console.log('  Canvas Components:', diagnosis.details.canvasComponents?.length || 0);
        console.log('  Mapped Components:', diagnosis.details.mappedComponents?.length || 0);
        console.log('  Available Targets:', diagnosis.details.availableTargets?.length || 0);
        console.log('  Interaction Panels:', diagnosis.details.interactionPanels?.length || 0);
        
        console.log('=====================================\n');
    }

    // 🚀 Quick fix command for users
    async quickFix() {
        console.log('🚀 Running quick fix for interaction panel bug...');
        
        // 1. Refresh mapping
        if (typeof refreshPropertiesMapping === 'function') {
            console.log('🔄 Refreshing properties mapping...');
            refreshPropertiesMapping();
        }

        // Wait for refresh
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 2. Re-check
        const bugStillExists = this.detectEmptySelects();
        
        if (!bugStillExists) {
            console.log('✅ Quick fix successful! Interaction panels should now be populated.');
            return true;
        }

        // 3. Full diagnosis if quick fix didn't work
        console.log('🔍 Quick fix didn\'t resolve issue, running full diagnosis...');
        return await this.diagnoseEmptySelectsBug();
    }
}

// 🌍 Make available globally
window.interactionBugDetector = new InteractionBugDetector();

// 🚀 Quick commands for console use
window.fixInteractionBug = () => window.interactionBugDetector.quickFix();
window.diagnoseInteractionBug = () => window.interactionBugDetector.diagnoseEmptySelectsBug();

console.log('🐛 Interaction Bug Detector loaded!');
console.log('📋 Available commands:');
console.log('  fixInteractionBug() - Quick fix for empty selects');
console.log('  diagnoseInteractionBug() - Full diagnostic report');
