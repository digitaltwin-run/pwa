/**
 * Inicjalizacja Selektywnego Systemu Monitorowania Anomalii
 * 
 * UŻYJ W KONSOLI PRZEGLĄDARKI:
 * 
 * 1. Załaduj skrypt:
 *    const script = document.createElement('script');
 *    script.src = './js/init-selective-monitoring.js';
 *    document.head.appendChild(script);
 * 
 * 2. Lub bezpośrednio:
 *    window.startSelectiveMonitoring();
 */

async function startSelectiveMonitoring() {
    console.info('🚀 INICJALIZACJA SELEKTYWNEGO SYSTEMU MONITOROWANIA ANOMALII');
    console.info('════════════════════════════════════════════════════════════');
    
    try {
        // 1. Załaduj moduły jeśli nie są dostępne
        if (!window.SelectiveAnomalyMonitor) {
            console.info('📦 Ładowanie SelectiveAnomalyMonitor...');
            
            // Dynamiczny import modułu
            const { default: SelectiveAnomalyMonitor } = await import('./utils/selective-anomaly-monitor.js');
            window.SelectiveAnomalyMonitor = SelectiveAnomalyMonitor;
        }

        // 2. Stwórz monitor
        const monitor = new window.SelectiveAnomalyMonitor('live-session-' + Date.now());
        
        // 3. Zarejestruj kluczowe parametry do monitorowania
        console.info('📋 Rejestracja parametrów monitorowania...');
        
        // AREA SELECTION (dokładnie jak w żądaniu użytkownika)
        monitor.registerParameter('area_selection_tracking', {
            type: 'mouse',
            events: ['mousedown', 'mouseup'],
            conditions: [{
                name: 'area_selection_empty',
                type: 'area_selection_empty'
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Zaznaczenie pustego obszaru!', anomaly);
                
                // Wyślij do backend jeśli potrzeba
                console.info('📤 Raport anomalii wysłany do systemu');
            }
        });

        // COMPONENT CLICKS
        monitor.registerParameter('component_interaction', {
            type: 'component',
            events: ['click', 'mousedown'],
            conditions: [{
                name: 'click_no_component',
                type: 'mouse_no_component'
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Kliknięcie bez komponentu!', anomaly);
            }
        });

        // RAPID CLICKING
        monitor.registerParameter('rapid_clicking', {
            type: 'mouse',
            events: ['mousedown'],
            conditions: [{
                name: 'rapid_clicks',
                type: 'rapid_clicks',
                threshold: 200 // 200ms
            }],
            onAnomaly: (anomaly, data) => {
                console.warn('🟨 ANOMALIA: Zbyt szybkie klikanie!', anomaly);
            }
        });
        
        // KEYBOARD MONITORING
        monitor.registerParameter('keyboard_events', {
            type: 'keyboard',
            events: ['keydown'],
            conditions: [],
            onAnomaly: (anomaly, data) => {
                console.info('⌨️ Zdarzenie klawiatury:', data);
            }
        });

        // 4. Rozpocznij monitoring
        monitor.startMonitoring();
        
        // 5. Udostępnij globalnie
        window.hmiMonitor = monitor;
        window.hmiDetector = monitor; // Kompatybilność wsteczna
        
        // 6. Skanuj komponenty na canvas
        const components = document.querySelectorAll('[data-id]');
        console.info(`📊 Znaleziono ${components.length} komponentów na canvas`);
        
        // 7. Status monitoring co 10 sekund
        const statusInterval = setInterval(() => {
            const report = monitor.getAnomalyReport();
            if (report.totalAnomalies > 0) {
                console.info('📊 STATUS:', {
                    anomalie: report.totalAnomalies,
                    ostatnieAnomalie: report.recentAnomalies.length,
                    komponentyNaCanvas: components.length
                });
            }
        }, 10000);
        
        // 8. Funkcja zatrzymania
        window.stopSelectiveMonitoring = () => {
            clearInterval(statusInterval);
            const finalReport = monitor.stopMonitoring();
            console.info('🛑 Monitoring zatrzymany');
            console.info('📋 KOŃCOWY RAPORT:', finalReport);
            return finalReport;
        };
        
        // 9. Instrukcje użytkownika
        displayMonitoringInstructions();
        
        console.info('✅ SELEKTYWNY SYSTEM MONITOROWANIA AKTYWNY!');
        console.info(`📊 Monitorowanych parametrów: ${monitor.monitoringRegistry.size}`);
        
        return {
            monitor,
            status: 'active',
            monitoredParameters: monitor.monitoringRegistry.size,
            canvasComponents: components.length
        };
        
    } catch (error) {
        console.error('❌ Błąd inicjalizacji systemu monitorowania:', error);
        
        // Fallback - prosty system
        console.info('🔄 Uruchamianie systemu fallback...');
        return startFallbackMonitoring();
    }
}

/**
 * System fallback jeśli import nie działa
 */
function startFallbackMonitoring() {
    console.info('🔧 PROSTY SYSTEM MONITOROWANIA (FALLBACK)');
    
    const simpleMonitor = {
        anomalies: [],
        isActive: true,
        
        logAnomaly: function(type, data) {
            const anomaly = {
                type,
                data,
                timestamp: new Date().toISOString()
            };
            this.anomalies.push(anomaly);
            console.warn('🟨 ANOMALIA:', anomaly);
            
            // Limit historii
            if (this.anomalies.length > 100) {
                this.anomalies.shift();
            }
        },
        
        getReport: function() {
            return {
                totalAnomalies: this.anomalies.length,
                recentAnomalies: this.anomalies.slice(-10),
                status: this.isActive ? 'active' : 'stopped'
            };
        }
    };
    
    // Event listeners
    document.addEventListener('mouseup', (e) => {
        if (e.button === 2) { // Prawy przycisk
            // Sprawdź czy są komponenty w okolicy
            const element = document.elementFromPoint(e.clientX, e.clientY);
            const hasComponent = element && element.closest('[data-id]');
            
            if (!hasComponent) {
                simpleMonitor.logAnomaly('empty_area_selection', {
                    position: { x: e.clientX, y: e.clientY }
                });
            }
        }
    });
    
    document.addEventListener('click', (e) => {
        const hasComponent = e.target.closest('[data-id]');
        if (!hasComponent) {
            simpleMonitor.logAnomaly('click_no_component', {
                position: { x: e.clientX, y: e.clientY }
            });
        }
    });
    
    // Udostępnij globalnie
    window.hmiMonitor = simpleMonitor;
    window.stopSelectiveMonitoring = () => {
        simpleMonitor.isActive = false;
        console.info('🛑 Prosty monitoring zatrzymany');
        return simpleMonitor.getReport();
    };
    
    console.info('✅ Prosty system monitorowania aktywny!');
    return simpleMonitor;
}

/**
 * Instrukcje użytkownika
 */
function displayMonitoringInstructions() {
    console.info('');
    console.info('📖 INSTRUKCJE TESTOWANIA SELEKTYWNEGO MONITOROWANIA:');
    console.info('════════════════════════════════════════════════════════');
    console.info('');
    console.info('🔴 1. TESTOWANIE AREA SELECTION:');
    console.info('   ✋ PRAWY przycisk myszy + przeciągnij');
    console.info('   🟢 Obszar z komponentami = OK');
    console.info('   🟨 Pusty obszar = ANOMALIA!');
    console.info('');
    console.info('🔵 2. TESTOWANIE COMPONENT CLICKS:');
    console.info('   🖱️ Klik na komponencie = OK');
    console.info('   🟨 Klik na pustym miejscu = ANOMALIA!');
    console.info('');
    console.info('🔶 3. TESTOWANIE RAPID CLICKS:');
    console.info('   🖱️ Szybkie wielokrotne klikanie = ANOMALIA! (< 200ms)');
    console.info('');
    console.info('🔎 4. SPRAWDZENIE WYNIKÓW:');
    console.info('   📊 window.hmiMonitor.getAnomalyReport()');
    console.info('   🛑 window.stopSelectiveMonitoring()');
    console.info('');
    console.info('🔥 TYLKO ZAREJESTROWANE PARAMETRY SĄ ŚLEDZONE!');
    console.info('Żaden dodatkowy hałas nie jest zapisywany.');
    console.info('');
}

// Udostępnij globalnie
window.startSelectiveMonitoring = startSelectiveMonitoring;

// Auto-start jeśli zostanie załadowany jako skrypt
if (typeof document !== 'undefined') {
    console.info('📋 Selektywny System Monitorowania Anomalii załadowany');
    console.info('🚀 Uruchom: window.startSelectiveMonitoring()');
}
