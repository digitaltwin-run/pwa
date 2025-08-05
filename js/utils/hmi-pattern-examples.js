/**
 * HMI Pattern Examples - Declarative Definitions
 * 
 * WZORCE ZGODNE Z ŻĄDANYM FORMATEM:
 * - pattern.push(hmi.mouse.button.right.press.down)
 * - startx = hmi.mouse.position.x
 * - spatial queries: gui.canvas.hasComponents.between(x1,y1,x2,y2)
 */

import DeclarativeHMIDetector from './declarative-hmi-detector.js';

export class HMIPatternExamples {
    constructor(detector) {
        this.detector = detector;
        this.patternIds = new Map();
    }

    /**
     * WZORZEC 1: Zaznaczenie obszaru prawym przyciskiem myszy
     * Dokładnie jak w żądaniu użytkownika
     */
    registerAreaSelectionPattern() {
        const patternId = this.detector.registerPattern('area-selection-right-click', function(pattern) {
            // Rozpoczęcie zaznaczania prawym przyciskiem
            pattern.push(this.hmi.mouse.button.right.press.down);
            
            // Zapisz pozycję startową
            let startx = this.hmi.mouse.position.x;
            let starty = this.hmi.mouse.position.y;
            
            // Ruch myszy (przeciąganie)
            pattern.push(this.hmi.mouse.move);
            
            // Zakończenie zaznaczania
            pattern.push(this.hmi.mouse.button.right.press.up);
            
            // Zapisz pozycję końcową
            let stopx = this.hmi.mouse.position.x;
            let stopy = this.hmi.mouse.position.y;
            
            // Sprawdź czy komponenty zostały zaznaczone
            pattern.push(this.gui.canvas.components.selected);
            
            // Sprawdź czy są komponenty w obszarze
            pattern.push(this.gui.canvas.hasComponents.between(startx, starty, stopx, stopy));
        });

        this.patternIds.set('area-selection', patternId);
        return patternId;
    }

    /**
     * WZORZEC 2: Przeciągnij i upuść komponent
     */
    registerDragDropPattern() {
        const patternId = this.detector.registerPattern('drag-drop-component', function(pattern) {
            // Rozpoczęcie przeciągania lewym przyciskiem
            pattern.push(this.hmi.mouse.button.left.press.down);
            
            // Pozycja startowa
            let startx = this.hmi.mouse.position.x;
            let starty = this.hmi.mouse.position.y;
            
            // Ruch myszy podczas przeciągania
            pattern.push(this.hmi.mouse.move);
            
            // Zakończenie przeciągania
            pattern.push(this.hmi.mouse.button.left.press.up);
            
            // Pozycja końcowa
            let stopx = this.hmi.mouse.position.x;
            let stopy = this.hmi.mouse.position.y;
            
            // Sprawdź czy komponent został przesunięty
            pattern.push(this.gui.canvas.components.selected);
        });

        this.patternIds.set('drag-drop', patternId);
        return patternId;
    }

    /**
     * WZORZEC 3: Kopiowanie i wklejanie Ctrl+C, Ctrl+V
     */
    registerCopyPastePattern() {
        const patternId = this.detector.registerPattern('copy-paste-workflow', function(pattern) {
            // Zaznacz komponent
            pattern.push(this.hmi.mouse.button.left.click);
            
            // Sprawdź że został zaznaczony
            pattern.push(this.gui.canvas.components.selected);
            
            // Kopiuj Ctrl+C
            pattern.push(this.hmi.keyboard.combo(['Control', 'c']));
            
            // Wklej Ctrl+V
            pattern.push(this.hmi.keyboard.combo(['Control', 'v']));
            
            // Sprawdź czy liczba komponentów wzrosła
            pattern.push(this.gui.canvas.selection.count);
        });

        this.patternIds.set('copy-paste', patternId);
        return patternId;
    }

    /**
     * WZORZEC 4: Multi-selekcja z Ctrl+Click
     */
    registerMultiSelectPattern() {
        const patternId = this.detector.registerPattern('multi-select-ctrl-click', function(pattern) {
            // Pierwszy klik - zaznacz pierwszy komponent
            pattern.push(this.hmi.mouse.button.left.click);
            pattern.push(this.gui.canvas.components.selected);
            
            // Ctrl+Click na drugi komponent
            pattern.push(this.hmi.keyboard.key.down('Control'));
            pattern.push(this.hmi.mouse.button.left.click);
            pattern.push(this.hmi.keyboard.key.up('Control'));
            
            // Sprawdź czy zaznaczono więcej komponentów
            pattern.push(this.gui.canvas.selection.count);
        });

        this.patternIds.set('multi-select', patternId);
        return patternId;
    }

    /**
     * WZORZEC 5: Usuwanie komponentów klawiszem Delete
     */
    registerDeletePattern() {
        const patternId = this.detector.registerPattern('delete-components', function(pattern) {
            // Zaznacz komponenty
            pattern.push(this.gui.canvas.components.selected);
            
            // Naciśnij Delete
            pattern.push(this.hmi.keyboard.key.press('Delete'));
            
            // Sprawdź czy komponenty zostały usunięte
            pattern.push(this.gui.canvas.selection.count);
        });

        this.patternIds.set('delete', patternId);
        return patternId;
    }

    /**
     * WZORZEC 6: Zmiana właściwości w panelu
     */
    registerPropertyChangePattern() {
        const patternId = this.detector.registerPattern('property-change', function(pattern) {
            // Zaznacz komponent
            pattern.push(this.hmi.mouse.button.left.click);
            pattern.push(this.gui.canvas.components.selected);
            
            // Panel właściwości musi być widoczny
            pattern.push(this.gui.properties.panel.visible);
            
            // Kliknij w kontrolkę w panelu właściwości
            pattern.push(this.hmi.mouse.button.left.click);
            
            // Sprawdź czy właściwości się zmieniły
            pattern.push(this.gui.canvas.components.selected);
        });

        this.patternIds.set('property-change', patternId);
        return patternId;
    }

    /**
     * Zarejestruj wszystkie wzorce
     */
    registerAllPatterns() {
        const registered = [
            this.registerAreaSelectionPattern(),
            this.registerDragDropPattern(), 
            this.registerCopyPastePattern(),
            this.registerMultiSelectPattern(),
            this.registerDeletePattern(),
            this.registerPropertyChangePattern()
        ];

        console.info(`🎯 Registered ${registered.length} HMI patterns`);
        return registered;
    }

    /**
     * Uruchom wykrywanie wszystkich wzorców
     */
    startAllDetections() {
        const started = [];
        
        this.patternIds.forEach((patternId, name) => {
            if (this.detector.startDetection(patternId)) {
                started.push(name);
            }
        });

        console.info(`🔍 Started detection for: ${started.join(', ')}`);
        return started;
    }

    /**
     * Sprawdź status wszystkich wykrywań
     */
    getDetectionStatus() {
        const summary = this.detector.getDetectionSummary();
        
        return {
            ...summary,
            registeredPatterns: Array.from(this.patternIds.keys()),
            patternDetails: Array.from(this.patternIds.entries()).map(([name, id]) => ({
                name: name,
                id: id,
                active: summary.activePatterns.some(p => p.name.includes(name))
            }))
        };
    }
}

/**
 * DEMONSTRACJA UŻYCIA
 */
export async function demonstratePatternUsage() {
    console.info('🎯 Demonstrating Declarative HMI Pattern Usage');
    
    // Inicjalizuj detektor
    const detector = new DeclarativeHMIDetector('demo-session');
    
    // Stwórz przykłady wzorców
    const examples = new HMIPatternExamples(detector);
    
    // Zarejestruj wszystkie wzorce
    examples.registerAllPatterns();
    
    // Uruchom wykrywanie
    examples.startAllDetections();
    
    // Pokaż status
    setTimeout(() => {
        const status = examples.getDetectionStatus();
        console.info('📊 Pattern Detection Status:', status);
    }, 1000);
    
    return { detector, examples };
}

// Global dla łatwego dostępu
if (typeof window !== 'undefined') {
    window.HMIPatternExamples = HMIPatternExamples;
    window.demonstratePatternUsage = demonstratePatternUsage;
}

export default HMIPatternExamples;
