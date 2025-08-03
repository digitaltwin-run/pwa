/**
 * 🐛 Interaction Bug Detector
 * Targeted diagnosis and automatic fixes for interaction panel issues
 */

class InteractionBugDetector {
    constructor() {
        this.detectedIssues = [];
        this.autoFixEnabled = true;
        console.log('🐛 InteractionBugDetector initialized');
    }

    // Diagnoza głównych problemów z interakcjami
    diagnoseInteractionIssues() {
        console.log('🔍 Diagnosing interaction panel issues...');
        const issues = [];

        // 1. Sprawdź czy select dla komponentów docelowych jest pusty
        const targetSelect = document.querySelector('#targetComponent');
        if (targetSelect && targetSelect.options.length <= 1) {
            issues.push({
                type: 'empty_target_select',
                severity: 'high',
                description: 'Target component select is empty',
                element: targetSelect
            });
        }

        // 2. Sprawdź czy PropertiesMapper działa
        const mapper = window.propertiesManager?.propertiesMapper;
        if (!mapper) {
            issues.push({
                type: 'missing_properties_mapper',
                severity: 'critical',
                description: 'PropertiesMapper not available'
            });
        } else if (!mapper.mappedProperties || mapper.mappedProperties.size === 0) {
            issues.push({
                type: 'empty_mapped_properties',
                severity: 'high',
                description: 'No components mapped in PropertiesMapper'
            });
        }

        // 3. Sprawdź komponenty na canvas
        const canvas = document.getElementById('svg-canvas');
        const components = canvas?.querySelectorAll('[data-id]');
        if (!components || components.length === 0) {
            issues.push({
                type: 'no_canvas_components',
                severity: 'medium',
                description: 'No components found on canvas'
            });
        }

        this.detectedIssues = issues;
        return issues;
    }

    // Automatyczne naprawy problemów
    autoFix() {
        console.log('🔧 Running auto-fixes for interaction issues...');
        const issues = this.diagnoseInteractionIssues();
        let fixedCount = 0;

        issues.forEach(issue => {
            try {
                switch (issue.type) {
                    case 'empty_mapped_properties':
                        this.fixEmptyMappedProperties();
                        fixedCount++;
                        break;
                    case 'empty_target_select':
                        this.fixEmptyTargetSelect();
                        fixedCount++;
                        break;
                    case 'missing_properties_mapper':
                        console.warn('❌ Cannot auto-fix missing PropertiesMapper');
                        break;
                }
            } catch (error) {
                console.error(`❌ Failed to fix ${issue.type}:`, error);
            }
        });

        console.log(`✅ Auto-fixed ${fixedCount}/${issues.length} issues`);
        return fixedCount;
    }

    // Naprawa pustych mappedProperties
    fixEmptyMappedProperties() {
        console.log('🔧 Fixing empty mappedProperties...');
        const mapper = window.propertiesManager?.propertiesMapper;
        
        if (!mapper) {
            throw new Error('PropertiesMapper not available');
        }

        // Ensure Maps are initialized
        if (!(mapper.mappedProperties instanceof Map)) {
            mapper.mappedProperties = new Map();
        }
        if (!(mapper.availableVariables instanceof Map)) {
            mapper.availableVariables = new Map();
        }

        // Force scan canvas
        mapper.scanCanvasProperties();
        
        console.log(`✅ Mapped properties refreshed. Size: ${mapper.mappedProperties.size}`);
    }

    // Naprawa pustego target select
    fixEmptyTargetSelect() {
        console.log('🔧 Fixing empty target select...');
        
        // Trigger refresh of interactions panel
        const interactionsManager = window.interactionsManager;
        if (interactionsManager) {
            // Force refresh target options
            const targetSelect = document.querySelector('#targetComponent');
            if (targetSelect) {
                const selectedValue = targetSelect.value;
                const newOptions = interactionsManager.generateTargetOptions(selectedValue);
                targetSelect.innerHTML = newOptions;
                console.log('✅ Target select options refreshed');
            }
        }
    }

    // Szczegółowy raport diagnostyczny
    generateDetailedReport() {
        const issues = this.diagnoseInteractionIssues();
        const mapper = window.propertiesManager?.propertiesMapper;
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: issues.length,
                criticalIssues: issues.filter(i => i.severity === 'critical').length,
                highIssues: issues.filter(i => i.severity === 'high').length,
                mediumIssues: issues.filter(i => i.severity === 'medium').length
            },
            issues: issues,
            systemState: {
                propertiesMapperAvailable: !!mapper,
                mappedPropertiesSize: mapper?.mappedProperties?.size || 0,
                canvasComponentsCount: document.querySelectorAll('#svg-canvas [data-id]').length,
                targetSelectOptions: document.querySelector('#targetComponent')?.options?.length || 0
            },
            recommendations: this.generateRecommendations(issues)
        };

        console.log('📊 Interaction Bug Detector Report:', report);
        return report;
    }

    // Generuj rekomendacje na podstawie wykrytych problemów
    generateRecommendations(issues) {
        const recommendations = [];
        
        issues.forEach(issue => {
            switch (issue.type) {
                case 'empty_target_select':
                    recommendations.push('Run fixInteractionBug() in console to refresh target components');
                    break;
                case 'empty_mapped_properties':
                    recommendations.push('Call refreshPropertiesMapping() to rescan canvas components');
                    break;
                case 'no_canvas_components':
                    recommendations.push('Add components to canvas by drag & drop from component palette');
                    break;
                case 'missing_properties_mapper':
                    recommendations.push('Check PropertiesManager initialization in app.js');
                    break;
            }
        });

        return recommendations;
    }
}

// Globalne funkcje dla łatwego debugowania
window.interactionBugDetector = new InteractionBugDetector();

// Quick fix function
window.fixInteractionBug = function() {
    console.log('🚀 Quick Fix: Interaction Bug');
    return window.interactionBugDetector.autoFix();
};

// Detailed diagnostic function
window.diagnoseInteractionBug = function() {
    console.log('🔍 Detailed Interaction Bug Diagnosis');
    return window.interactionBugDetector.generateDetailedReport();
};

// Export for module usage
export { InteractionBugDetector };
export default InteractionBugDetector;

console.log('🐛 Interaction Bug Detector loaded!');
console.log('📋 Available commands:');
console.log('  fixInteractionBug() - Quick fix for interaction issues');
console.log('  diagnoseInteractionBug() - Detailed diagnostic report');
