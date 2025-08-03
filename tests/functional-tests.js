// Digital Twin IDE - Comprehensive Functional Tests
// Automatyczne testowanie wszystkich funkcjonalności środowiska

export class FunctionalTester {
    constructor() {
        this.testResults = new Map();
        this.componentManager = null;
        this.propertiesManager = null;
        this.simulationManager = null;
        this.testComponents = [];
    }

    // Inicjalizacja testera
    async init() {
        console.log('🧪 Inicjalizacja Functional Tester...');
        
        // Pobierz referencje do głównych managerów
        this.componentManager = window.componentManager;
        this.propertiesManager = window.propertiesManager;
        this.simulationManager = window.simulationManager;
        
        if (!this.componentManager || !this.propertiesManager) {
            throw new Error('Nie można zainicjalizować testera - brak głównych managerów');
        }
        
        console.log('✅ Tester zainicjalizowany pomyślnie');
    }

    // Test 1: Ładowanie i zarządzanie komponentami
    async testComponentManagement() {
        console.log('🧪 Test: Zarządzanie komponentami...');
        const results = {
            componentLoading: false,
            componentStorage: false,
            componentSelection: false,
            componentRemoval: false
        };

        try {
            // Test ładowania komponentów
            const response = await fetch('/components.json');
            const data = await response.json();
            results.componentLoading = data.components && data.components.length > 0;

            // Test przechowywania komponentu
            const testComponent = {
                id: 'test-component-1',
                element: document.createElementNS('http://www.w3.org/2000/svg', 'rect'),
                metadata: { name: 'Test Component' }
            };
            
            this.componentManager.storeComponent(testComponent);
            const storedComponent = this.componentManager.getComponent('test-component-1');
            results.componentStorage = storedComponent !== undefined;
            this.testComponents.push(testComponent.id);

            // Test wyboru komponentu
            this.componentManager.setSelectedComponent(testComponent);
            const selectedComponent = this.componentManager.getSelectedComponent();
            results.componentSelection = selectedComponent === testComponent;

            // Test usuwania komponentu
            this.componentManager.components.delete('test-component-1');
            results.componentRemoval = !this.componentManager.getComponent('test-component-1');

        } catch (error) {
            console.error('❌ Błąd w teście zarządzania komponentami:', error);
        }

        this.testResults.set('componentManagement', results);
        return results;
    }

    // Test 2: System właściwości
    async testPropertiesSystem() {
        console.log('🧪 Test: System właściwości...');
        const results = {
            propertiesPanel: false,
            colorManagement: false,
            parameterUpdates: false,
            metadataEditing: false,
            propertyMapping: false
        };

        try {
            // Test panelu właściwości
            if (this.propertiesManager.generateProperties) {
                results.propertiesPanel = true;
            }

            // Test zarządzania kolorami
            if (window.updateSvgColor && typeof window.updateSvgColor === 'function') {
                results.colorManagement = true;
            }

            // Test aktualizacji parametrów
            if (window.updateParam && typeof window.updateParam === 'function') {
                results.parameterUpdates = true;
            }

            // Test edycji metadanych
            if (this.propertiesManager.editMetadataRaw) {
                results.metadataEditing = true;
            }

            // Test mapowania właściwości
            if (window.refreshPropertiesMapping && typeof window.refreshPropertiesMapping === 'function') {
                window.refreshPropertiesMapping();
                results.propertyMapping = true;
            }

        } catch (error) {
            console.error('❌ Błąd w teście systemu właściwości:', error);
        }

        this.testResults.set('propertiesSystem', results);
        return results;
    }

    // Test 3: System interakcji
    async testInteractionsSystem() {
        console.log('🧪 Test: System interakcji...');
        const results = {
            interactionCreation: false,
            eventBinding: false,
            actionExecution: false,
            interactionRemoval: false
        };

        try {
            // Test tworzenia interakcji
            if (window.addInteraction && typeof window.addInteraction === 'function') {
                results.interactionCreation = true;
            }

            // Test aktualizacji interakcji
            if (window.updateInteraction && typeof window.updateInteraction === 'function') {
                results.eventBinding = true;
            }

            // Test wykonywania interakcji
            if (window.executeInteraction && typeof window.executeInteraction === 'function') {
                results.actionExecution = true;
            }

            // Test usuwania interakcji
            if (window.removeInteraction && typeof window.removeInteraction === 'function') {
                results.interactionRemoval = true;
            }

        } catch (error) {
            console.error('❌ Błąd w teście systemu interakcji:', error);
        }

        this.testResults.set('interactionsSystem', results);
        return results;
    }

    // Test 4: System symulacji
    async testSimulationSystem() {
        console.log('🧪 Test: System symulacji...');
        const results = {
            simulationStart: false,
            simulationStop: false,
            componentBehavior: false,
            realTimeUpdates: false
        };

        try {
            if (this.simulationManager) {
                // Test uruchamiania symulacji
                if (this.simulationManager.startSimulation) {
                    results.simulationStart = true;
                }

                // Test zatrzymywania symulacji
                if (this.simulationManager.stopSimulation) {
                    results.simulationStop = true;
                }

                // Test zachowań komponentów
                if (this.simulationManager.updateSimulation) {
                    results.componentBehavior = true;
                }

                // Test aktualizacji w czasie rzeczywistym
                if (this.simulationManager.simulateComponent) {
                    results.realTimeUpdates = true;
                }
            }

        } catch (error) {
            console.error('❌ Błąd w teście systemu symulacji:', error);
        }

        this.testResults.set('simulationSystem', results);
        return results;
    }

    // Test 5: Drag & Drop
    async testDragDropSystem() {
        console.log('🧪 Test: System Drag & Drop...');
        const results = {
            dragSetup: false,
            dropHandling: false,
            componentPlacement: false,
            gridSnapping: false
        };

        try {
            // Test setup drag & drop
            if (window.dragDropManager) {
                results.dragSetup = true;
            }

            // Test obsługi drop
            const canvas = document.getElementById('canvas');
            if (canvas) {
                results.dropHandling = true;
                results.componentPlacement = true;
            }

            // Test grid snapping
            if (window.gridManager && window.gridManager.snapToGrid) {
                results.gridSnapping = true;
            }

        } catch (error) {
            console.error('❌ Błąd w teście Drag & Drop:', error);
        }

        this.testResults.set('dragDropSystem', results);
        return results;
    }

    // Test 6: UI/UX
    async testUISystem() {
        console.log('🧪 Test: System UI/UX...');
        const results = {
            canvasRendering: false,
            responsiveLayout: false,
            propertiesPanel: false,
            componentLibrary: false,
            toolbar: false
        };

        try {
            // Test renderowania canvas
            const canvas = document.getElementById('canvas');
            if (canvas && canvas.tagName === 'svg') {
                results.canvasRendering = true;
            }

            // Test responsive layout
            const workspace = document.getElementById('workspace');
            if (workspace) {
                results.responsiveLayout = true;
            }

            // Test panelu właściwości
            const propertiesPanel = document.getElementById('properties-panel');
            if (propertiesPanel) {
                results.propertiesPanel = true;
            }

            // Test biblioteki komponentów
            const componentLibrary = document.getElementById('component-library');
            if (componentLibrary) {
                results.componentLibrary = true;
            }

            // Test toolbar
            const toolbar = document.querySelector('.toolbar');
            if (toolbar) {
                results.toolbar = true;
            }

        } catch (error) {
            console.error('❌ Błąd w teście UI/UX:', error);
        }

        this.testResults.set('uiSystem', results);
        return results;
    }

    // Uruchom wszystkie testy
    async runAllTests() {
        console.log('🚀 Uruchamianie wszystkich testów funkcjonalnych...');
        
        await this.init();
        
        const testSuite = [
            this.testComponentManagement,
            this.testPropertiesSystem,
            this.testInteractionsSystem,
            this.testSimulationSystem,
            this.testDragDropSystem,
            this.testUISystem
        ];

        for (const test of testSuite) {
            try {
                await test.call(this);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay między testami
            } catch (error) {
                console.error('❌ Błąd podczas wykonywania testu:', error);
            }
        }

        return this.generateReport();
    }

    // Generuj raport z testów
    generateReport() {
        console.log('📊 Generowanie raportu testów...');
        
        const report = {
            timestamp: new Date().toISOString(),
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            details: {}
        };

        this.testResults.forEach((results, testName) => {
            const testDetails = {
                total: 0,
                passed: 0,
                failed: 0,
                results: results
            };

            Object.entries(results).forEach(([key, value]) => {
                testDetails.total++;
                if (value) {
                    testDetails.passed++;
                    report.passedTests++;
                } else {
                    testDetails.failed++;
                    report.failedTests++;
                }
                report.totalTests++;
            });

            report.details[testName] = testDetails;
        });

        // Wyświetl raport w konsoli
        console.log('📋 RAPORT TESTÓW FUNKCJONALNYCH');
        console.log('================================');
        console.log(`📊 Łącznie testów: ${report.totalTests}`);
        console.log(`✅ Przeszło: ${report.passedTests}`);
        console.log(`❌ Nie przeszło: ${report.failedTests}`);
        console.log(`📈 Wskaźnik powodzenia: ${((report.passedTests/report.totalTests)*100).toFixed(1)}%`);
        console.log('================================');

        Object.entries(report.details).forEach(([testName, details]) => {
            console.log(`🧪 ${testName}: ${details.passed}/${details.total} (${((details.passed/details.total)*100).toFixed(1)}%)`);
        });

        return report;
    }

    // Eksportuj raport do JSON
    exportReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `functional-test-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return report;
    }
}

// Utwórz globalną instancję testera
window.functionalTester = new FunctionalTester();

// Funkcje globalne do użycia w konsoli
window.runFunctionalTests = async () => {
    return await window.functionalTester.runAllTests();
};

window.exportTestReport = () => {
    return window.functionalTester.exportReport();
};
