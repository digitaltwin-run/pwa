/**
 * Ulepszony Selektywny System Monitorowania Anomalii HMI
 * 
 * KLUCZOWE FUNKCJE:
 * 1. Rejestr monitorowanych parametrów - tylko wybrane zdarzenia
 * 2. Real-time detection bez zapisywania całego stanu
 * 3. Deklaratywny kod JS z precyzyjnym pattern matching
 * 4. Minimalne zużycie pamięci - smart event filtering
 */

import SelectiveAnomalyMonitor from './utils/selective-anomaly-monitor.js';
import DeclarativeHMIDetector from './utils/declarative-hmi-detector.js';
import HMIPatternExamples from './utils/hmi-pattern-examples.js';

class EnhancedHMIPatternDemo {
    constructor() {
        this.monitor = null;
        this.sessionHash = 'enhanced-' + Date.now();
        this.registeredParameters = new Map();
        this.isActive = false;
        
        // Komponenty na canvas
        this.canvasComponents = new Map();
        
        console.info('🚀 Enhanced HMI Pattern Demo initialized');
    }

    async initialize() {
        console.info('🎯 Inicjalizacja Selektywnego Systemu Monitorowania...');

        // Stwórz monitor z rejestrem
        this.monitor = new SelectiveAnomalyMonitor(this.sessionHash);
        
        // Zarejestruj kluczowe parametry do monitorowania
        this.registerMonitoringParameters();
        
        // Skanuj komponenty na canvas
        this.scanCanvasComponents();
        
        // Udostępnij globalnie
        window.hmiDetector = this.monitor; // Dla kompatybilności
        window.hmiMonitor = this.monitor;
        window.hmiDemo = this;
        
        console.info('✅ Selektywny system zainicjalizowany');
        console.info(`📊 Monitorowane parametry: ${this.monitor.monitoringRegistry.size}`);
    }

    /**
     * Rejestracja parametrów do monitorowania (REJESTR)
     */
    registerMonitoringParameters() {
        console.info('📋 Rejestracja parametrów do monitorowania...');
        
        // 1. MOUSE AREA SELECTION - dokładnie jak w żądaniu
        this.monitor.registerParameter('area_selection_start', {
            type: 'mouse',
            events: ['mousedown'],
            conditions: [{
                name: 'right_click_start',
                type: 'mouse_button_check',
                button: 2 // Prawy przycisk
            }],
            onAnomaly: (anomaly, data) => {
                console.info('🟡 START: Area selection rozpoczęte', data);
            }
        });
        
        this.monitor.registerParameter('area_selection_end', {
            type: 'mouse',
            events: ['mouseup'],
            conditions: [{
                name: 'area_selection_empty',
                type: 'area_selection_empty'
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Pusty obszar zaznaczenia!', anomaly);
            }
        });
        
        // 2. COMPONENT INTERACTION
        this.monitor.registerParameter('component_clicks', {
            type: 'component',
            events: ['click'],
            conditions: [{
                name: 'click_no_component',
                type: 'mouse_no_component'
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Kliknięcie bez komponentu!', anomaly);
            }
        });
        
        // 3. RAPID CLICKING DETECTION
        this.monitor.registerParameter('rapid_clicks', {
            type: 'mouse',
            events: ['mousedown'],
            conditions: [{
                name: 'rapid_clicking',
                type: 'rapid_clicks',
                threshold: 200 // ms
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Zbyt szybkie klikanie!', anomaly);
            }
        });
        
        // 4. KEYBOARD COMBOS
        this.monitor.registerParameter('keyboard_combos', {
            type: 'keyboard',
            events: ['keydown'],
            conditions: [],
            onAnomaly: (anomaly, data) => {
                console.info('⌨️ Combo klawiszowe:', data);
            }
        });
        
        console.info(`✅ Zarejestrowano ${this.monitor.monitoringRegistry.size} parametrów`);
    }
    
    /**
     * Skanowanie komponentów na canvas
     */
    scanCanvasComponents() {
        const components = document.querySelectorAll('[data-id]');
        this.canvasComponents.clear();
        
        components.forEach(comp => {
            const id = comp.getAttribute('data-id');
            const rect = comp.getBoundingClientRect();
            this.canvasComponents.set(id, {
                id,
                element: comp,
                bounds: rect,
                type: comp.getAttribute('data-type') || 'unknown'
            });
        });
        
        console.info(`📋 Znaleziono ${components.length} komponentów na canvas`);
        return this.canvasComponents;
    }

    /**
     * DEMONSTRACJA 1: Dokładnie jak w żądaniu użytkownika
     * Zaznaczenie obszaru prawym przyciskiem myszy
     */
    demonstrateAreaSelectionPattern() {
        console.info('🎯 DEMO: Wzorzec zaznaczenia obszaru (jak w żądaniu)');

        // Rejestracja wzorca dokładnie jak w żądaniu
        const patternId = this.detector.registerPattern('user-requested-area-selection', function(pattern) {
            pattern.push(this.gui.canvas.components.count() > 0);

            // pattern.push(hmi.mouse.button.right.press.down)
            pattern.push(this.hmi.mouse.button.right.press.down());

            // startx = hmi.mouse.position.x
            // starty = hmi.mouse.position.y
            let startx = this.hmi.mouse.position.x;
            let starty = this.hmi.mouse.position.y;

            // pattern.push(hmi.mouse.move)
            pattern.push(this.hmi.mouse.move());

            // pattern.push(hmi.mouse.button.right.press.up)
            pattern.push(this.hmi.mouse.button.right.press.up());

            // stopx = hmi.mouse.position.x
            // stopy = hmi.mouse.position.y
            let stopx = this.hmi.mouse.position.x;
            let stopy = this.hmi.mouse.position.y;

            // pattern.push(gui.canva.components.selected)
            pattern.push(this.gui.canvas.components.selected);

            // gui.canva.hasComponents.between(startx,starty,stopx,stopy)
            pattern.push(this.gui.canvas.hasComponents.between(startx, starty, stopx, stopy));
        });

        // Uruchom wykrywanie
        this.detector.startDetection(patternId);

        console.info('🔍 Wzorzec zarejestrowany i aktywny. Wykonaj gest prawym przyciskiem myszy na canvas!');

        return patternId;
    }

    /**
     * DEMONSTRACJA 2: Dodatkowe wzorce zgodne z formatem
     */
    demonstrateAdvancedPatterns() {
        console.info('🎯 DEMO: Zaawansowane wzorce w formacie deklaratywnym');

        // Wzorzec Drag & Drop z precyzyjnymi współrzędnymi
        const dragDropId = this.detector.registerPattern('precise-drag-drop', function(pattern) {
            pattern.push(this.hmi.mouse.button.left.press.down());
            let startx = this.hmi.mouse.position.x;
            let starty = this.hmi.mouse.position.y;

            pattern.push(this.hmi.mouse.move());

            pattern.push(this.hmi.mouse.button.left.press.up());
            let stopx = this.hmi.mouse.position.x;
            let stopy = this.hmi.mouse.position.y;

            // Sprawdź czy został przesunięty o więcej niż 50px
            pattern.push(this.gui.canvas.components.selected);
        });

        // Wzorzec Copy-Paste z walidacją
        const copyPasteId = this.detector.registerPattern('validated-copy-paste', function(pattern) {
            pattern.push(this.hmi.mouse.button.left.click());
            pattern.push(this.gui.canvas.components.selected);

            pattern.push(this.hmi.keyboard.combo(['Control', 'c']));
            pattern.push(this.hmi.keyboard.combo(['Control', 'v']));

            pattern.push(this.gui.canvas.selection.count);
        });

        // Wzorzec Multi-Select z walidacją liczby
        const multiSelectId = this.detector.registerPattern('counted-multi-select', function(pattern) {
            pattern.push(this.hmi.mouse.button.left.click());
            pattern.push(this.gui.canvas.components.selected);

            pattern.push(this.hmi.keyboard.key.down('Control'));
            pattern.push(this.hmi.mouse.button.left.click());
            pattern.push(this.hmi.keyboard.key.up('Control'));

            pattern.push(this.gui.canvas.selection.count);
        });

        // Uruchom wszystkie wykrywania
        [dragDropId, copyPasteId, multiSelectId].forEach(id => {
            this.detector.startDetection(id);
        });

        console.info('🔍 Zaawansowane wzorce aktywne. Testuj różne interakcje!');
        
        return { dragDropId, copyPasteId, multiSelectId };
    }

    /**
     * Uruchom selektywny monitoring anomalii
     */
    async startSelectiveMonitoring() {
        await this.initialize();

        console.info('🚀 Uruchamianie selektywnego monitorowania anomalii...');

        // Rozpocznij monitoring
        this.monitor.startMonitoring();
        this.isActive = true;

        // Skanuj komponenty ponownie
        this.scanCanvasComponents();

        // Status monitoring co 5 sekund
        this.statusInterval = setInterval(() => {
            this.displayMonitoringStatus();
        }, 5000);

        // Instrukcje dla użytkownika
        this.displaySelectiveInstructions();

        return {
            sessionId: this.sessionHash,
            monitoredParameters: this.monitor.monitoringRegistry.size,
            canvasComponents: this.canvasComponents.size,
            status: 'monitoring_active'
        };
    }

    /**
     * Wyświetl status monitorowania
     */
    displayMonitoringStatus() {
        if (!this.isActive) return;
        
        const report = this.monitor.getAnomalyReport();
        const paramStats = this.monitor.getParameterStats();
        
        console.info('📊 STATUS MONITOROWANIA:', {
            sesja: this.sessionHash,
            monitorowaneParametry: report.monitoredParameters,
            wykryteAnomalie: report.totalAnomalies,
            ostatnieAnomalie: report.recentAnomalies.length,
            komponentyNaCanvas: this.canvasComponents.size,
            parametryAktywne: Object.values(paramStats).filter(p => p.isActive).length
        });
        
        if (report.recentAnomalies.length > 0) {
            console.warn('🟨 OSTATNIE ANOMALIE:', report.recentAnomalies.slice(-3));
        }
    }

    /**
     * Instrukcje dla selektywnego monitorowania
     */
    displaySelectiveInstructions() {
        console.info('');
        console.info('📝 INSTRUKCJE SELEKTYWNEGO MONITOROWANIA ANOMALII:');
        console.info('');
        console.info('🔴 1. TESTOWANIE AREA SELECTION (monitorowane):');
        console.info('   ✋ PRAWY przycisk + przeciągnij = śledzone w real-time');
        console.info('   🟨 Pusty obszar = ANOMALIA wykryta automatycznie');
        console.info('   🟢 Obszar z komponentami = SUCCESS');
        console.info('');
        console.info('🔵 2. TESTOWANIE COMPONENT CLICKS (monitorowane):');
        console.info('   🖱️ Klik na komponencie = śledzone');
        console.info('   🟨 Klik na pustym miejscu = ANOMALIA');
        console.info('');
        console.info('🔶 3. TESTOWANIE RAPID CLICKS (monitorowane):');
        console.info('   🖱️ Szybkie wielokrotne klikanie = ANOMALIA (< 200ms)');
        console.info('');
        console.info('⌨️ 4. KEYBOARD EVENTS (śledzone):');
        console.info('   ⌨️ Combo klawiszy są logowane');
        console.info('');
        console.info('🔎 5. SPRAWDZENIE WYNIKÓW:');
        console.info('   📊 window.hmiMonitor.getAnomalyReport()');
        console.info('   🔍 window.hmiDemo.displayMonitoringStatus()');
        console.info('   🚫 window.hmiDemo.stopSelectiveMonitoring()');
        console.info('   📋 window.hmiDemo.scanCanvasComponents()');
        console.info('');
        console.info('🔥 TYLKO ZAREJESTROWANE PARAMETRY SĄ ŚLEDZONE!');
        console.info('');
    }

    /**
     * Zatrzymaj selektywne monitorowanie anomalii
     */
    stopSelectiveMonitoring() {
        if (!this.isActive) {
            console.warn('⚠️ Monitoring nie jest aktywny');
            return null;
        }
        
        // Zatrzymaj monitoring
        const finalReport = this.monitor.stopMonitoring();
        this.isActive = false;
        
        // Wyczyść interval
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        
        console.info('🛑 Selektywne monitorowanie zatrzymane');
        
        const enhancedReport = {
            ...finalReport,
            canvasComponents: this.canvasComponents.size,
            registeredParameters: Array.from(this.monitor.monitoringRegistry.keys()),
            instructions: 'Selektywny monitoring zakończony - sprawdź anomalie powyżej'
        };
        
        console.info('📋 KOŃCOWY RAPORT MONITOROWANIA:', enhancedReport);
        return enhancedReport;
    }
    
    /**
     * Pobierz raport anomalii (kompatybilność)
     */
    getDetailedReport() {
        if (!this.monitor) {
            return { error: 'Monitor nie został zainicjalizowany' };
        }
        
        return this.monitor.getAnomalyReport();
    }
}

// Automatyczna inicjalizacja gdy strona się załaduje
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}

async function initializeDemo() {
    console.info('🎯 Przygotowywanie demonstracji wzorców HMI...');

    // Poczekaj na załadowanie aplikacji
    setTimeout(async () => {
        const demo = new HMIPatternDemo();
        const result = await demo.startFullDemo();

        console.info('✅ Demonstracja gotowa! Sprawdź instrukcje powyżej.');
        console.info('🔧 Dostępne funkcje:', {
            'window.hmiDemo.getDetailedReport()': 'Szczegółowy raport',
            'window.hmiDetector.getDetectionSummary()': 'Status detektora',
            'window.hmiDemo.stopDemo()': 'Zatrzymaj demo'
        });

    }, 2000);
}

// Eksport dla testów
export default HMIPatternDemo;
