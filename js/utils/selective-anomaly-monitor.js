/**
 * Selektywny System Monitorowania Anomalii
 * 
 * KLUCZOWE FUNKCJE:
 * 1. Rejestr monitorowanych zdarzeń - tylko wybrane parametry są śledzone
 * 2. Real-time detection bez zapisywania całego stanu
 * 3. Deklaratywny kod JS z pattern matching
 * 4. Minimalne zużycie pamięci - tylko monitorowane dane
 */

class SelectiveAnomalyMonitor {
    constructor(sessionId = 'monitor-' + Date.now()) {
        this.sessionId = sessionId;
        
        // REJESTR MONITOROWANIA - tylko te zdarzenia są śledzone
        this.monitoringRegistry = new Map();
        
        // Aktualne śledzone parametry (tylko te z rejestru)
        this.trackedParameters = new Map();
        
        // Wykryte anomalie (krótka historia)
        this.detectedAnomalies = [];
        this.maxAnomaliesHistory = 50; // Limit historii
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Status systemu
        this.isActive = false;
        
        console.info('🔍 Selektywny Monitor Anomalii zainicjalizowany:', sessionId);
    }

    /**
     * Rejestracja parametru do monitorowania
     * @param {string} parameterId - ID parametru
     * @param {Object} config - Konfiguracja monitorowania
     */
    registerParameter(parameterId, config) {
        const monitorConfig = {
            id: parameterId,
            type: config.type, // 'mouse', 'keyboard', 'component', 'canvas'
            events: config.events || [], // Które zdarzenia śledzić
            conditions: config.conditions || [], // Warunki anomalii
            threshold: config.threshold || null, // Próg wykrywania
            onAnomaly: config.onAnomaly || null, // Callback na anomalię
            lastValue: null,
            lastUpdate: null,
            anomalyCount: 0
        };
        
        this.monitoringRegistry.set(parameterId, monitorConfig);
        this.trackedParameters.set(parameterId, null);
        
        console.info(`📋 Zarejestrowano parametr do monitorowania: ${parameterId}`, monitorConfig);
        return parameterId;
    }

    /**
     * Rozpoczęcie monitorowania
     */
    startMonitoring() {
        if (this.isActive) {
            console.warn('⚠️ Monitoring już aktywny');
            return;
        }
        
        this.isActive = true;
        this.setupEventListeners();
        
        console.info('🚀 Selektywny monitoring rozpoczęty');
        console.info(`📊 Monitorowane parametry: ${this.monitoringRegistry.size}`);
    }

    /**
     * Zatrzymanie monitorowania
     */
    stopMonitoring() {
        this.isActive = false;
        this.removeEventListeners();
        
        console.info('🛑 Monitoring zatrzymany');
        return this.getAnomalyReport();
    }

    /**
     * Konfiguracja event listeners dla monitorowanych parametrów
     */
    setupEventListeners() {
        // Mouse events (tylko jeśli są monitorowane)
        if (this.hasParameterType('mouse')) {
            const mouseHandler = (e) => this.handleMouseEvent(e);
            document.addEventListener('mousedown', mouseHandler);
            document.addEventListener('mouseup', mouseHandler);
            document.addEventListener('mousemove', mouseHandler);
            
            this.eventListeners.set('mouse', () => {
                document.removeEventListener('mousedown', mouseHandler);
                document.removeEventListener('mouseup', mouseHandler);
                document.removeEventListener('mousemove', mouseHandler);
            });
        }

        // Keyboard events (tylko jeśli są monitorowane)
        if (this.hasParameterType('keyboard')) {
            const keyHandler = (e) => this.handleKeyboardEvent(e);
            document.addEventListener('keydown', keyHandler);
            document.addEventListener('keyup', keyHandler);
            
            this.eventListeners.set('keyboard', () => {
                document.removeEventListener('keydown', keyHandler);
                document.removeEventListener('keyup', keyHandler);
            });
        }

        // Component events (tylko jeśli są monitorowane)
        if (this.hasParameterType('component')) {
            const componentHandler = (e) => this.handleComponentEvent(e);
            document.addEventListener('click', componentHandler);
            
            this.eventListeners.set('component', () => {
                document.removeEventListener('click', componentHandler);
            });
        }
    }

    /**
     * Usunięcie event listeners
     */
    removeEventListeners() {
        this.eventListeners.forEach((removeHandler) => {
            removeHandler();
        });
        this.eventListeners.clear();
    }

    /**
     * Sprawdź czy parametr typu jest monitorowany
     */
    hasParameterType(type) {
        for (let config of this.monitoringRegistry.values()) {
            if (config.type === type) return true;
        }
        return false;
    }

    /**
     * Handle mouse events (tylko dla monitorowanych parametrów)
     */
    handleMouseEvent(event) {
        if (!this.isActive) return;

        const mouseParams = this.getParametersByType('mouse');
        if (mouseParams.length === 0) return;

        const mouseData = {
            type: event.type,
            button: event.button,
            x: event.clientX,
            y: event.clientY,
            timestamp: Date.now()
        };

        mouseParams.forEach(param => {
            this.updateParameter(param.id, mouseData);
            this.checkAnomalies(param.id, mouseData);
        });
    }

    /**
     * Handle keyboard events (tylko dla monitorowanych parametrów)
     */
    handleKeyboardEvent(event) {
        if (!this.isActive) return;

        const keyboardParams = this.getParametersByType('keyboard');
        if (keyboardParams.length === 0) return;

        const keyData = {
            type: event.type,
            key: event.key,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            timestamp: Date.now()
        };

        keyboardParams.forEach(param => {
            this.updateParameter(param.id, keyData);
            this.checkAnomalies(param.id, keyData);
        });
    }

    /**
     * Handle component events
     */
    handleComponentEvent(event) {
        if (!this.isActive) return;

        const componentParams = this.getParametersByType('component');
        if (componentParams.length === 0) return;

        const component = this.findComponentFromEvent(event);
        const componentData = {
            type: 'component_interaction',
            hasComponent: !!component,
            componentId: component?.getAttribute('data-id') || null,
            position: { x: event.clientX, y: event.clientY },
            timestamp: Date.now()
        };

        componentParams.forEach(param => {
            this.updateParameter(param.id, componentData);
            this.checkAnomalies(param.id, componentData);
        });
    }

    /**
     * Znajdź komponent z event
     */
    findComponentFromEvent(event) {
        let element = event.target;
        while (element) {
            if (element.getAttribute && element.getAttribute('data-id')) {
                return element;
            }
            element = element.parentElement;
        }
        return null;
    }

    /**
     * Pobierz parametry według typu
     */
    getParametersByType(type) {
        const params = [];
        for (let [id, config] of this.monitoringRegistry) {
            if (config.type === type) {
                params.push({ id, ...config });
            }
        }
        return params;
    }

    /**
     * Aktualizuj parametr (tylko monitorowane)
     */
    updateParameter(parameterId, data) {
        const config = this.monitoringRegistry.get(parameterId);
        if (!config) return;

        // Aktualizuj tylko jeśli zdarzenie jest w events filter
        if (config.events.length > 0 && !config.events.includes(data.type)) {
            return;
        }

        config.lastValue = data;
        config.lastUpdate = Date.now();
        this.trackedParameters.set(parameterId, data);
    }

    /**
     * Sprawdź anomalie dla parametru
     */
    checkAnomalies(parameterId, data) {
        const config = this.monitoringRegistry.get(parameterId);
        if (!config || !config.conditions) return;

        for (let condition of config.conditions) {
            const anomaly = this.evaluateCondition(condition, data, config);
            if (anomaly) {
                this.reportAnomaly({
                    parameterId,
                    condition: condition.name,
                    data,
                    anomaly,
                    timestamp: Date.now()
                });
                
                config.anomalyCount++;
                
                if (config.onAnomaly) {
                    config.onAnomaly(anomaly, data);
                }
            }
        }
    }

    /**
     * Ewaluacja warunków anomalii
     */
    evaluateCondition(condition, data, config) {
        try {
            switch (condition.type) {
                case 'mouse_no_component':
                    return data.type === 'mousedown' && !this.hasComponentAtPosition(data.x, data.y)
                        ? { type: 'no_component_at_click', position: { x: data.x, y: data.y } }
                        : null;

                case 'area_selection_empty':
                    if (data.type === 'mouseup' && data.button === 2) { // Prawy przycisk
                        const startPos = this.getLastParameterValue('area_selection_start');
                        if (startPos) {
                            const hasComponents = this.hasComponentsBetween(
                                startPos.x, startPos.y, data.x, data.y
                            );
                            return !hasComponents 
                                ? { type: 'empty_area_selection', area: { startPos, endPos: { x: data.x, y: data.y } } }
                                : null;
                        }
                    }
                    return null;

                case 'rapid_clicks':
                    if (data.type === 'mousedown') {
                        const lastClick = config.lastValue;
                        if (lastClick && (data.timestamp - lastClick.timestamp) < condition.threshold) {
                            return { type: 'rapid_clicking', interval: data.timestamp - lastClick.timestamp };
                        }
                    }
                    return null;

                default:
                    return null;
            }
        } catch (error) {
            console.error('❌ Błąd podczas ewaluacji warunków:', error);
            return null;
        }
    }

    /**
     * Sprawdź czy są komponenty w pozycji
     */
    hasComponentAtPosition(x, y) {
        const element = document.elementFromPoint(x, y);
        return element && element.closest('[data-id]') !== null;
    }

    /**
     * Sprawdź czy są komponenty między pozycjami
     */
    hasComponentsBetween(x1, y1, x2, y2) {
        const components = document.querySelectorAll('[data-id]');
        const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);

        for (let component of components) {
            const rect = component.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            if (centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY) {
                return true;
            }
        }
        return false;
    }

    /**
     * Pobierz ostatnią wartość parametru
     */
    getLastParameterValue(parameterId) {
        return this.trackedParameters.get(parameterId);
    }

    /**
     * Zgłoś anomalię
     */
    reportAnomaly(anomalyData) {
        // Dodaj do historii (z limitem)
        this.detectedAnomalies.push(anomalyData);
        if (this.detectedAnomalies.length > this.maxAnomaliesHistory) {
            this.detectedAnomalies.shift(); // Usuń najstarszą
        }

        console.warn('🚨 ANOMALIA WYKRYTA:', anomalyData);
        
        // Opcjonalnie wyślij do backend
        this.sendAnomalyReport(anomalyData);
    }

    /**
     * Wyślij raport anomalii do backend (throttled)
     */
    async sendAnomalyReport(anomalyData) {
        try {
            const payload = {
                sessionId: this.sessionId,
                anomaly: anomalyData,
                context: {
                    url: window.location.href,
                    timestamp: Date.now(),
                    trackedParameters: Object.fromEntries(this.trackedParameters)
                }
            };

            // Symulacja wysłania (zastąp prawdziwą implementacją)
            console.info('📤 Wysyłanie raportu anomalii:', payload);
            
        } catch (error) {
            console.error('❌ Błąd wysyłania raportu anomalii:', error);
        }
    }

    /**
     * Pobierz raport anomalii
     */
    getAnomalyReport() {
        return {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            monitoredParameters: this.monitoringRegistry.size,
            totalAnomalies: this.detectedAnomalies.length,
            recentAnomalies: this.detectedAnomalies.slice(-10),
            parameterStats: this.getParameterStats()
        };
    }

    /**
     * Statystyki parametrów
     */
    getParameterStats() {
        const stats = {};
        for (let [id, config] of this.monitoringRegistry) {
            stats[id] = {
                type: config.type,
                anomalyCount: config.anomalyCount,
                lastUpdate: config.lastUpdate,
                isActive: config.lastUpdate && (Date.now() - config.lastUpdate) < 5000
            };
        }
        return stats;
    }

    /**
     * Wyczyść historię anomalii (oszczędność pamięci)
     */
    clearAnomalyHistory() {
        const count = this.detectedAnomalies.length;
        this.detectedAnomalies = [];
        console.info(`🧹 Wyczyszczono historię: ${count} anomalii`);
    }
}

// Udostępnij globalnie
window.SelectiveAnomalyMonitor = SelectiveAnomalyMonitor;

export default SelectiveAnomalyMonitor;
