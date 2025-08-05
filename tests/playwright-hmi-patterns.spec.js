/**
 * Playwright HMI Pattern Testing - Automated Anomaly Detection
 * 
 * INTEGRACJA PLAYWRIGHT + DEKLARATYWNE WZORCE:
 * - Automatyczne generowanie zdarzeń HMI
 * - Obserwacja logów w czasie rzeczywistym
 * - Wykrywanie anomalii poprzez porównanie wzorców
 * - Cross-platform testing
 */

import { test, expect } from '@playwright/test';

class PlaywrightHMITester {
    constructor(page) {
        this.page = page;
        this.detector = null;
        this.patterns = null;
        this.logs = [];
        this.startTime = Date.now();
    }

    /**
     * Inicjalizuj HMI detection system na stronie
     */
    async initializeHMIDetection() {
        // Wprowadź deklaratywny detektor do strony
        await this.page.addScriptTag({
            path: './js/utils/declarative-hmi-detector.js',
            type: 'module'
        });

        await this.page.addScriptTag({
            path: './js/utils/hmi-pattern-examples.js', 
            type: 'module'
        });

        // Inicjalizuj detektory
        await this.page.evaluate(() => {
            return new Promise(async (resolve) => {
                const { DeclarativeHMIDetector } = await import('./js/utils/declarative-hmi-detector.js');
                const { HMIPatternExamples } = await import('./js/utils/hmi-pattern-examples.js');
                
                window.hmiDetector = new DeclarativeHMIDetector('playwright-test-session');
                window.hmiPatterns = new HMIPatternExamples(window.hmiDetector);
                
                // Zarejestruj wszystkie wzorce
                window.hmiPatterns.registerAllPatterns();
                window.hmiPatterns.startAllDetections();
                
                resolve(true);
            });
        });

        console.log('🎯 HMI Detection initialized in browser');
    }

    /**
     * Symuluj wzorzec: Zaznaczenie obszaru prawym przyciskiem myszy
     * Dokładnie jak w żądaniu: startx, starty, stopx, stopy + spatial query
     */
    async simulateAreaSelectionPattern() {
        console.log('🎯 Testing: Area Selection with Right Click');

        // Znajdź canvas
        const canvas = await this.page.locator('svg#main-canvas');
        await expect(canvas).toBeVisible();

        // Pobierz rozmiar canvas
        const canvasBox = await canvas.boundingBox();
        
        // Pozycje startowe i końcowe (jak w wzorcu)
        const startx = canvasBox.x + 100;
        const starty = canvasBox.y + 100;
        const stopx = canvasBox.x + 300;
        const stopy = canvasBox.y + 250;

        // Wykonaj wzorzec zgodnie z deklaracją:
        // 1. hmi.mouse.button.right.press.down
        await this.page.mouse.move(startx, starty);
        await this.page.mouse.down({ button: 'right' });
        
        // 2. hmi.mouse.move (przeciąganie)
        await this.page.mouse.move(stopx, stopy, { steps: 10 });
        
        // 3. hmi.mouse.button.right.press.up
        await this.page.mouse.up({ button: 'right' });
        
        // Czekaj na reakcję aplikacji
        await this.page.waitForTimeout(1000);

        // Sprawdź czy wzorzec został wykryty
        const patternResult = await this.page.evaluate(() => {
            return window.hmiDetector?.getDetectionSummary();
        });

        // Sprawdź czy są komponenty w obszarze (spatial query)
        const hasComponentsInArea = await this.page.evaluate(([x1, y1, x2, y2]) => {
            const components = document.querySelectorAll('[data-id]');
            let count = 0;
            
            for (let component of components) {
                const rect = component.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                if (centerX >= x1 && centerX <= x2 && centerY >= y1 && centerY <= y2) {
                    count++;
                }
            }
            
            return { found: count > 0, count };
        }, [Math.min(startx, stopx), Math.min(starty, stopy), Math.max(startx, stopx), Math.max(starty, stopy)]);

        return {
            pattern: 'area-selection-right-click',
            coordinates: { startx, starty, stopx, stopy },
            detectionResult: patternResult,
            spatialQuery: hasComponentsInArea,
            success: patternResult?.activePatterns?.length > 0 || hasComponentsInArea.found
        };
    }

    /**
     * Symuluj wzorzec: Drag & Drop
     */
    async simulateDragDropPattern() {
        console.log('🎯 Testing: Drag & Drop Component');

        // Znajdź pierwszy komponent do przeciągnięcia
        const component = await this.page.locator('[data-id]').first();
        await expect(component).toBeVisible();

        const componentBox = await component.boundingBox();
        const startx = componentBox.x + componentBox.width / 2;
        const starty = componentBox.y + componentBox.height / 2;
        const stopx = startx + 150;
        const stopy = starty + 100;

        // Wykonaj wzorzec drag & drop:
        // 1. hmi.mouse.button.left.press.down
        await this.page.mouse.move(startx, starty);
        await this.page.mouse.down({ button: 'left' });
        
        // 2. hmi.mouse.move
        await this.page.mouse.move(stopx, stopy, { steps: 15 });
        
        // 3. hmi.mouse.button.left.press.up
        await this.page.mouse.up({ button: 'left' });
        
        await this.page.waitForTimeout(500);

        // Sprawdź rezultat
        const patternResult = await this.page.evaluate(() => {
            return window.hmiDetector?.getDetectionSummary();
        });

        // Sprawdź czy komponent został przesunięty
        const newComponentBox = await component.boundingBox();
        const moved = Math.abs(newComponentBox.x - componentBox.x) > 10 || 
                     Math.abs(newComponentBox.y - componentBox.y) > 10;

        return {
            pattern: 'drag-drop-component',
            coordinates: { startx, starty, stopx, stopy },
            detectionResult: patternResult,
            componentMoved: moved,
            displacement: {
                x: newComponentBox.x - componentBox.x,
                y: newComponentBox.y - componentBox.y
            },
            success: moved
        };
    }

    /**
     * Symuluj wzorzec: Copy-Paste (Ctrl+C, Ctrl+V)
     */
    async simulateCopyPastePattern() {
        console.log('🎯 Testing: Copy-Paste Workflow');

        // Zlicz komponenty przed operacją
        const initialCount = await this.page.locator('[data-id]').count();

        // Znajdź i zaznacz komponent
        const component = await this.page.locator('[data-id]').first();
        await component.click();
        
        await this.page.waitForTimeout(300);

        // Wykonaj Copy-Paste wzorzec:
        // 1. Ctrl+C (kopiuj)
        await this.page.keyboard.press('Control+c');
        await this.page.waitForTimeout(300);
        
        // 2. Ctrl+V (wklej)
        await this.page.keyboard.press('Control+v');
        await this.page.waitForTimeout(1500);

        // Sprawdź rezultat
        const finalCount = await this.page.locator('[data-id]').count();
        const newComponents = finalCount - initialCount;

        const patternResult = await this.page.evaluate(() => {
            return window.hmiDetector?.getDetectionSummary();
        });

        return {
            pattern: 'copy-paste-workflow',
            initialComponents: initialCount,
            finalComponents: finalCount,
            newComponents: newComponents,
            detectionResult: patternResult,
            success: newComponents > 0
        };
    }

    /**
     * Symuluj wzorzec: Multi-selekcja z Ctrl+Click
     */
    async simulateMultiSelectPattern() {
        console.log('🎯 Testing: Multi-Select with Ctrl+Click');

        const components = await this.page.locator('[data-id]');
        const componentCount = await components.count();
        
        if (componentCount < 2) {
            return { pattern: 'multi-select-ctrl-click', success: false, reason: 'Not enough components' };
        }

        // 1. Pierwszy klik (zaznacz pierwszy komponent)
        await components.nth(0).click();
        await this.page.waitForTimeout(200);

        // 2. Ctrl+Click na drugi komponent
        await this.page.keyboard.down('Control');
        await components.nth(1).click();
        await this.page.keyboard.up('Control');
        await this.page.waitForTimeout(300);

        // Sprawdź ile komponentów jest zaznaczonych
        const selectedCount = await this.page.locator('[data-id].selected').count();

        const patternResult = await this.page.evaluate(() => {
            return window.hmiDetector?.getDetectionSummary();
        });

        return {
            pattern: 'multi-select-ctrl-click',
            totalComponents: componentCount,
            selectedComponents: selectedCount,
            detectionResult: patternResult,
            success: selectedCount >= 2
        };
    }

    /**
     * Zbierz logi z przeglądarki
     */
    async collectBrowserLogs() {
        return await this.page.evaluate(() => {
            // Pobierz logi z advanced logger jeśli istnieje
            if (window.advancedLogger) {
                return window.advancedLogger.logs.slice(-10); // Ostatnie 10 logów
            }
            
            // Lub z console
            return window.console?.history || [];
        });
    }

    /**
     * Analiza anomalii na podstawie wyników wzorców
     */
    analyzeAnomalies(testResults) {
        const anomalies = [];
        
        testResults.forEach(result => {
            // Sprawdź czy wzorzec się powiódł
            if (!result.success) {
                anomalies.push({
                    type: 'pattern_failure',
                    pattern: result.pattern,
                    reason: result.reason || 'Pattern execution failed',
                    severity: 'high'
                });
            }
            
            // Sprawdź czy detektor wykrył wzorzec
            if (result.detectionResult && result.detectionResult.activePatterns.length === 0) {
                anomalies.push({
                    type: 'detection_failure', 
                    pattern: result.pattern,
                    reason: 'Pattern not detected by HMI detector',
                    severity: 'medium'
                });
            }
            
            // Sprawdź wydajność
            if (result.detectionResult && result.detectionResult.averageDuration > 5000) {
                anomalies.push({
                    type: 'performance_issue',
                    pattern: result.pattern,
                    reason: `Slow pattern detection: ${result.detectionResult.averageDuration}ms`,
                    severity: 'low'
                });
            }
        });
        
        return anomalies;
    }
}

// PLAYWRIGHT TESTY
test.describe('HMI Pattern Detection Tests', () => {
    let hmiTester;

    test.beforeEach(async ({ page }) => {
        hmiTester = new PlaywrightHMITester(page);
        
        // Otwórz PWA
        await page.goto('http://localhost:5005/');
        
        // Poczekaj na załadowanie
        await page.waitForLoadState('networkidle');
        
        // Inicjalizuj HMI detection
        await hmiTester.initializeHMIDetection();
    });

    test('Area Selection Pattern - Right Click Drag', async () => {
        const result = await hmiTester.simulateAreaSelectionPattern();
        
        console.log('📊 Area Selection Result:', result);
        
        // Assertions
        expect(result.spatialQuery.found).toBeTruthy();
        expect(result.coordinates.startx).toBeLessThan(result.coordinates.stopx);
        expect(result.coordinates.starty).toBeLessThan(result.coordinates.stopy);
        
        // Sprawdź czy wzorzec został wykryty
        if (!result.success) {
            console.warn('⚠️ Area selection pattern anomaly detected');
        }
    });

    test('Drag Drop Pattern', async () => {
        const result = await hmiTester.simulateDragDropPattern();
        
        console.log('📊 Drag Drop Result:', result);
        
        // Assertions
        expect(result.componentMoved).toBeTruthy();
        expect(Math.abs(result.displacement.x)).toBeGreaterThan(10);
        
        if (!result.success) {
            console.warn('⚠️ Drag drop pattern anomaly detected');
        }
    });

    test('Copy Paste Pattern', async () => {
        const result = await hmiTester.simulateCopyPastePattern();
        
        console.log('📊 Copy Paste Result:', result);
        
        // Assertions
        expect(result.newComponents).toBeGreaterThan(0);
        expect(result.finalComponents).toBeGreaterThan(result.initialComponents);
        
        if (!result.success) {
            console.warn('⚠️ Copy paste pattern anomaly detected');
        }
    });

    test('Multi Select Pattern', async () => {
        const result = await hmiTester.simulateMultiSelectPattern();
        
        console.log('📊 Multi Select Result:', result);
        
        // Assertions (jeśli mamy wystarczająco komponentów)
        if (result.totalComponents >= 2) {
            expect(result.selectedComponents).toBeGreaterThanOrEqual(2);
        }
        
        if (!result.success && result.totalComponents >= 2) {
            console.warn('⚠️ Multi select pattern anomaly detected');
        }
    });

    test('Full HMI Pattern Anomaly Detection', async () => {
        const testResults = [];
        
        // Uruchom wszystkie wzorce
        testResults.push(await hmiTester.simulateAreaSelectionPattern());
        testResults.push(await hmiTester.simulateDragDropPattern());
        testResults.push(await hmiTester.simulateCopyPastePattern());
        testResults.push(await hmiTester.simulateMultiSelectPattern());
        
        // Zbierz logi
        const browserLogs = await hmiTester.collectBrowserLogs();
        
        // Analiza anomalii
        const anomalies = hmiTester.analyzeAnomalies(testResults);
        
        console.log('📊 Complete Test Results:', {
            totalTests: testResults.length,
            successfulTests: testResults.filter(r => r.success).length,
            anomalies: anomalies.length,
            anomalyDetails: anomalies
        });
        
        // Zapisz wyniki do pliku
        const fs = require('fs');
        const reportPath = './test-results/hmi-pattern-report.json';
        
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            testResults: testResults,
            anomalies: anomalies,
            browserLogs: browserLogs
        }, null, 2));
        
        console.log(`📄 Report saved to: ${reportPath}`);
        
        // Test powinien się nie powieść jeśli są krytyczne anomalie
        const criticalAnomalies = anomalies.filter(a => a.severity === 'high');
        expect(criticalAnomalies.length).toBe(0);
    });
});

export { PlaywrightHMITester };
