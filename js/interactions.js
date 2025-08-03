/**
 * Digital Twin IDE - Component Interactions Module
 * 
 * System interakcji między komponentami SVG oparty na deklaratywnym DSL.
 * Umożliwia definiowanie powiązań między komponentami bezpośrednio w metadanych XML.
 */

// Singleton do zarządzania interakcjami między komponentami
export class InteractionsManager {
    constructor(componentManager, svgCanvas) {
        this.componentManager = componentManager;
        this.svgCanvas = svgCanvas;
        this.bindings = new Map(); // Mapa wszystkich aktywnych powiązań
        this.eventListeners = new Map(); // Mapa nasłuchiwaczy zdarzeń
        
        // Inicjalizacja
        this.init();
    }

    /**
     * Inicjalizacja menedżera interakcji
     */
    init() {
        console.log('Component interactions system initialized');
        
        // Nasłuchiwanie na dodanie nowych komponentów
        this.svgCanvas.addEventListener('component-added', (e) => {
            const componentId = e.detail.componentId;
            const svgElement = e.detail.element;
            this.processComponentInteractions(componentId, svgElement);
        });
        
        // Nasłuchiwanie na usunięcie komponentów
        this.svgCanvas.addEventListener('component-removed', (e) => {
            const componentId = e.detail.componentId;
            this.removeComponentBindings(componentId);
        });
        
        // Inicjalne przetworzenie istniejących komponentów
        this.processExistingComponents();
    }

    /**
     * Przetwarza istniejące komponenty na canvasie
     */
    processExistingComponents() {
        const components = this.componentManager.getAllComponents();
        for (const [id, component] of Object.entries(components)) {
            if (component.element) {
                this.processComponentInteractions(id, component.element);
            }
        }
    }

    /**
     * Przetwarza interakcje zdefiniowane w metadanych komponentu
     * @param {string} componentId - ID komponentu
     * @param {SVGElement} svgElement - Element SVG komponentu
     */
    processComponentInteractions(componentId, svgElement) {
        // Pobierz metadane komponentu
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return;
        
        // Sprawdź, czy komponent ma zdefiniowane interakcje
        const interactionsElement = metadataElement.querySelector('interactions');
        if (!interactionsElement) return;
        
        // Pobierz wszystkie powiązania (bindings)
        const bindingElements = interactionsElement.querySelectorAll('binding');
        if (!bindingElements || bindingElements.length === 0) return;
        
        // Przetwórz każde powiązanie
        Array.from(bindingElements).forEach(binding => {
            this.registerBinding(componentId, svgElement, binding);
        });
    }

    /**
     * Rejestruje pojedyncze powiązanie między komponentami
     * @param {string} sourceId - ID komponentu źródłowego
     * @param {SVGElement} sourceElement - Element SVG komponentu źródłowego
     * @param {Element} bindingElement - Element XML definicji powiązania
     */
    registerBinding(sourceId, sourceElement, bindingElement) {
        // Pobierz atrybuty powiązania
        let targetId = bindingElement.getAttribute('targetId');
        const eventName = bindingElement.getAttribute('event');
        const actionName = bindingElement.getAttribute('action');
        const parameter = bindingElement.getAttribute('parameter');
        const condition = bindingElement.getAttribute('condition');
        
        if (!targetId || !eventName || !actionName) {
            console.warn(`Incomplete binding definition in component ${sourceId}`);
            return;
        }
        
        // Sprawdź, czy targetId jest faktycznym data-id komponentu SVG
        // Jeśli nie, spróbuj znaleźć komponent o odpowiednim ID w metadanych
        const targetElement = document.querySelector(`[data-id="${targetId}"]`);
        if (!targetElement) {
            // Spróbuj znaleźć komponent po ID z metadanych
            const components = this.componentManager.getAllComponents();
            for (const comp of components) {
                if (comp.element && comp.metadata && comp.metadata.id === targetId) {
                    // Znaleziono komponent - użyj jego data-id zamiast ID z metadanych
                    const actualTargetId = comp.element.getAttribute('data-id');
                    if (actualTargetId) {
                        console.log(`Converting metadata ID ${targetId} to SVG data-id ${actualTargetId}`);
                        targetId = actualTargetId;
                        // Aktualizuj atrybut w XML
                        bindingElement.setAttribute('targetId', targetId);
                        break;
                    }
                }
            }
        }
        
        // Utwórz unikalny klucz dla tego powiązania
        const bindingKey = `${sourceId}:${eventName}:${targetId}:${actionName}`;
        
        // Jeśli powiązanie już istnieje, usuń je najpierw
        if (this.bindings.has(bindingKey)) {
            this.removeBinding(bindingKey);
        }
        
        // Utwórz funkcję obsługi zdarzenia
        const eventHandler = (event) => {
            // Sprawdź warunek, jeśli istnieje
            if (condition) {
                try {
                    const sourceMetadata = this.parseComponentMetadata(sourceElement);
                    const conditionResult = this.evaluateCondition(condition, sourceMetadata);
                    if (!conditionResult) return;
                } catch (error) {
                    console.error(`Error evaluating condition for binding ${bindingKey}:`, error);
                    return;
                }
            }
            
            // Pobierz komponent docelowy
            const targetComponent = this.componentManager.getComponent(targetId);
            if (!targetComponent || !targetComponent.element) {
                console.warn(`Target component ${targetId} not found for binding ${bindingKey}`);
                return;
            }
            
            // Wykonaj akcję na komponencie docelowym
            this.executeAction(targetComponent.element, actionName, parameter, event);
        };
        
        // Zarejestruj nasłuchiwacz zdarzenia
        sourceElement.addEventListener(`component-event-${eventName}`, eventHandler);
        
        // Zapisz powiązanie
        this.bindings.set(bindingKey, {
            sourceId,
            targetId,
            eventName,
            actionName,
            parameter,
            condition,
            handler: eventHandler
        });
        
        // Zapisz nasłuchiwacz dla późniejszego usunięcia
        if (!this.eventListeners.has(sourceId)) {
            this.eventListeners.set(sourceId, []);
        }
        this.eventListeners.get(sourceId).push({
            element: sourceElement,
            event: `component-event-${eventName}`,
            handler: eventHandler
        });
        
        console.log(`Registered binding: ${sourceId} [${eventName}] -> ${targetId} [${actionName}]`);
    }

    /**
     * Usuwa pojedyncze powiązanie
     * @param {string} bindingKey - Klucz powiązania do usunięcia
     */
    removeBinding(bindingKey) {
        const binding = this.bindings.get(bindingKey);
        if (!binding) return;
        
        // Znajdź i usuń nasłuchiwacz zdarzenia
        const listeners = this.eventListeners.get(binding.sourceId) || [];
        const listenerIndex = listeners.findIndex(l => 
            l.event === `component-event-${binding.eventName}` && 
            l.handler === binding.handler
        );
        
        if (listenerIndex >= 0) {
            const listener = listeners[listenerIndex];
            listener.element.removeEventListener(listener.event, listener.handler);
            listeners.splice(listenerIndex, 1);
            
            if (listeners.length === 0) {
                this.eventListeners.delete(binding.sourceId);
            } else {
                this.eventListeners.set(binding.sourceId, listeners);
            }
        }
        
        // Usuń powiązanie z mapy
        this.bindings.delete(bindingKey);
        console.log(`Removed binding: ${bindingKey}`);
    }

    /**
     * Usuwa wszystkie powiązania dla danego komponentu
     * @param {string} componentId - ID komponentu
     */
    removeComponentBindings(componentId) {
        // Usuń powiązania, gdzie komponent jest źródłem
        const listeners = this.eventListeners.get(componentId) || [];
        listeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.delete(componentId);
        
        // Usuń powiązania z mapy
        for (const [key, binding] of this.bindings.entries()) {
            if (binding.sourceId === componentId || binding.targetId === componentId) {
                this.bindings.delete(key);
            }
        }
        
        console.log(`Removed all bindings for component ${componentId}`);
    }

    /**
     * Wykonuje akcję na komponencie docelowym
     * @param {SVGElement} targetElement - Element SVG komponentu docelowego
     * @param {string} actionName - Nazwa akcji do wykonania
     * @param {string} parameterName - Nazwa parametru (opcjonalnie)
     * @param {Event} sourceEvent - Zdarzenie źródłowe
     */
    executeAction(targetElement, actionName, parameterName, sourceEvent) {
        // Pobierz metadane komponentu docelowego
        const metadata = this.parseComponentMetadata(targetElement);
        const componentType = metadata?.type || '';
        
        // Pobierz wartość parametru, jeśli istnieje
        let parameterValue = null;
        if (parameterName && sourceEvent.detail) {
            parameterValue = sourceEvent.detail[parameterName];
        }
        
        // Wykonaj akcję w zależności od typu komponentu
        switch (componentType) {
            case 'motor':
                this.executeMotorAction(targetElement, actionName, parameterValue);
                break;
            case 'led':
                this.executeLedAction(targetElement, actionName, parameterValue);
                break;
            case 'counter':
                this.executeCounterAction(targetElement, actionName, parameterValue);
                break;
            case 'gauge':
                this.executeGaugeAction(targetElement, actionName, parameterValue);
                break;
            default:
                console.warn(`Unknown component type for action: ${componentType}`);
        }
    }

    /**
     * Wykonuje akcję na komponencie typu motor
     * @param {SVGElement} element - Element SVG silnika
     * @param {string} action - Nazwa akcji
     * @param {any} value - Wartość parametru
     */
    executeMotorAction(element, action, value) {
        // Aktualizuj metadane w zależności od akcji
        const metadataElement = element.querySelector('metadata component parameters');
        if (!metadataElement) return;
        
        switch (action) {
            case 'start':
                this.updateXmlMetadata(metadataElement, 'rotation', 'true');
                this.updateXmlMetadata(metadataElement, 'isActive', 'true');
                break;
            case 'stop':
                this.updateXmlMetadata(metadataElement, 'rotation', 'false');
                break;
            case 'setSpeed':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'speed', value.toString());
                }
                break;
            case 'toggle':
                const currentRotation = metadataElement.querySelector('rotation')?.textContent === 'true';
                this.updateXmlMetadata(metadataElement, 'rotation', (!currentRotation).toString());
                break;
        }
        
        // Wyzwól zdarzenie aktualizacji komponentu
        element.dispatchEvent(new CustomEvent('metadata-updated'));
    }

    /**
     * Wykonuje akcję na komponencie typu LED
     * @param {SVGElement} element - Element SVG diody LED
     * @param {string} action - Nazwa akcji
     * @param {any} value - Wartość parametru
     */
    executeLedAction(element, action, value) {
        // Aktualizuj metadane w zależności od akcji
        const metadataElement = element.querySelector('metadata component parameters');
        if (!metadataElement) return;
        
        switch (action) {
            case 'on':
                this.updateXmlMetadata(metadataElement, 'isOn', 'true');
                this.updateXmlMetadata(metadataElement, 'isBlinking', 'false');
                break;
            case 'off':
                this.updateXmlMetadata(metadataElement, 'isOn', 'false');
                this.updateXmlMetadata(metadataElement, 'isBlinking', 'false');
                break;
            case 'blink':
                this.updateXmlMetadata(metadataElement, 'isBlinking', 'true');
                this.updateXmlMetadata(metadataElement, 'isOn', 'true');
                break;
            case 'setColor':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'color', value.toString());
                }
                break;
            case 'toggle':
                const currentState = metadataElement.querySelector('isOn')?.textContent === 'true';
                this.updateXmlMetadata(metadataElement, 'isOn', (!currentState).toString());
                break;
        }
        
        // Wyzwól zdarzenie aktualizacji komponentu
        element.dispatchEvent(new CustomEvent('metadata-updated'));
    }

    /**
     * Wykonuje akcję na komponencie typu Counter
     * @param {SVGElement} element - Element SVG licznika
     * @param {string} action - Nazwa akcji
     * @param {any} value - Wartość parametru
     */
    executeCounterAction(element, action, value) {
        // Aktualizuj metadane w zależności od akcji
        const metadataElement = element.querySelector('metadata component parameters');
        if (!metadataElement) return;
        
        let currentValue = parseInt(metadataElement.querySelector('value')?.textContent || '0');
        
        switch (action) {
            case 'increment':
                currentValue++;
                this.updateXmlMetadata(metadataElement, 'value', currentValue.toString());
                break;
            case 'decrement':
                currentValue--;
                this.updateXmlMetadata(metadataElement, 'value', currentValue.toString());
                break;
            case 'reset':
                this.updateXmlMetadata(metadataElement, 'value', '0');
                break;
            case 'setValue':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'value', value.toString());
                }
                break;
        }
        
        // Wyzwól zdarzenie aktualizacji komponentu
        element.dispatchEvent(new CustomEvent('metadata-updated'));
    }

    /**
     * Wykonuje akcję na komponencie typu Gauge
     * @param {SVGElement} element - Element SVG wskaźnika
     * @param {string} action - Nazwa akcji
     * @param {any} value - Wartość parametru
     */
    executeGaugeAction(element, action, value) {
        // Aktualizuj metadane w zależności od akcji
        const metadataElement = element.querySelector('metadata component parameters');
        if (!metadataElement) return;
        
        switch (action) {
            case 'setValue':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'value', value.toString());
                }
                break;
            case 'setMin':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'min', value.toString());
                }
                break;
            case 'setMax':
                if (value !== null) {
                    this.updateXmlMetadata(metadataElement, 'max', value.toString());
                }
                break;
        }
        
        // Wyzwól zdarzenie aktualizacji komponentu
        element.dispatchEvent(new CustomEvent('metadata-updated'));
    }

    /**
     * Aktualizuje wartość parametru w metadanych XML
     * @param {Element} parametersElement - Element parameters w metadanych
     * @param {string} paramName - Nazwa parametru
     * @param {string} paramValue - Nowa wartość parametru
     */
    updateXmlMetadata(parametersElement, paramName, paramValue) {
        let paramElement = parametersElement.querySelector(paramName);
        
        if (!paramElement) {
            // Jeśli parametr nie istnieje, utwórz go
            paramElement = document.createElementNS(null, paramName);
            parametersElement.appendChild(paramElement);
        }
        
        paramElement.textContent = paramValue;
    }

    /**
     * Parsuje metadane komponentu
     * @param {SVGElement} svgElement - Element SVG komponentu
     * @returns {Object} Obiekt z metadanymi
     */
    parseComponentMetadata(svgElement) {
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return {};
        
        const result = {
            id: metadataElement.getAttribute('id') || '',
            name: metadataElement.getAttribute('name') || '',
            type: metadataElement.getAttribute('type') || '',
            parameters: {}
        };
        
        const parametersElement = metadataElement.querySelector('parameters');
        if (parametersElement) {
            // Pobierz wszystkie elementy parametrów
            Array.from(parametersElement.children).forEach(param => {
                const paramName = param.tagName;
                const paramValue = param.textContent;
                result.parameters[paramName] = paramValue;
            });
        }
        
        return result;
    }

    /**
     * Ewaluuje warunek dla powiązania
     * @param {string} condition - Warunek do ewaluacji
     * @param {Object} metadata - Metadane komponentu
     * @returns {boolean} Wynik ewaluacji warunku
     */
    evaluateCondition(condition, metadata) {
        // Proste warunki w postaci "paramName=value"
        if (condition.includes('=')) {
            const [paramName, expectedValue] = condition.split('=');
            const actualValue = metadata.parameters[paramName];
            return actualValue === expectedValue;
        }
        
        // Warunki w postaci "paramName"
        if (metadata.parameters[condition]) {
            const value = metadata.parameters[condition];
            return value === 'true' || value === '1';
        }
        
        return false;
    }
}

/**
 * Rozszerzenie komponentów o obsługę zdarzeń DSL
 * Te funkcje są używane w skryptach SVG do wyzwalania zdarzeń
 */
export function extendComponentWithEvents(svgElement) {
    // Dodaj metodę do wyzwalania zdarzeń DSL
    svgElement.triggerComponentEvent = function(eventName, detail = {}) {
        const event = new CustomEvent(`component-event-${eventName}`, {
            detail: detail,
            bubbles: true
        });
        this.dispatchEvent(event);
        console.log(`Component ${this.getAttribute('data-id')} triggered event: ${eventName}`, detail);
    };
    
    return svgElement;
}

/**
 * Funkcja pomocnicza do modyfikacji skryptów SVG
 * Dodaje kod do wyzwalania zdarzeń DSL
 */
export function injectEventTriggers(scriptContent, componentType) {
    // Jeśli skrypt już zawiera kod do wyzwalania zdarzeń, nie modyfikuj go
    if (scriptContent.includes('triggerComponentEvent(')) {
        return scriptContent;
    }
    
    // Dodaj kod do wyzwalania zdarzeń w zależności od typu komponentu
    switch (componentType) {
        case 'button':
            return injectButtonEventTriggers(scriptContent);
        case 'switch':
            return injectSwitchEventTriggers(scriptContent);
        case 'slider':
            return injectSliderEventTriggers(scriptContent);
        case 'knob':
            return injectKnobEventTriggers(scriptContent);
        default:
            return scriptContent;
    }
}

/**
 * Dodaje kod do wyzwalania zdarzeń dla przycisku
 */
function injectButtonEventTriggers(scriptContent) {
    // Znajdź funkcję obsługi kliknięcia
    const pressPattern = /svgElement\.addEventListener\(['"]mousedown['"], function\s*\([^)]*\)\s*\{/;
    const releasePattern = /svgElement\.addEventListener\(['"]mouseup['"], function\s*\([^)]*\)\s*\{/;
    
    let modifiedScript = scriptContent;
    
    // Dodaj wyzwalanie zdarzenia press
    if (pressPattern.test(modifiedScript)) {
        modifiedScript = modifiedScript.replace(
            pressPattern,
            match => `${match}\n            svgElement.triggerComponentEvent('press');`
        );
    }
    
    // Dodaj wyzwalanie zdarzenia release
    if (releasePattern.test(modifiedScript)) {
        modifiedScript = modifiedScript.replace(
            releasePattern,
            match => `${match}\n            svgElement.triggerComponentEvent('release');`
        );
    }
    
    return modifiedScript;
}

/**
 * Dodaje kod do wyzwalania zdarzeń dla przełącznika
 */
function injectSwitchEventTriggers(scriptContent) {
    // Znajdź funkcję zmiany stanu
    const togglePattern = /function\s+toggleSwitch\s*\([^)]*\)\s*\{/;
    
    let modifiedScript = scriptContent;
    
    // Dodaj wyzwalanie zdarzeń on/off/toggle
    if (togglePattern.test(modifiedScript)) {
        modifiedScript = modifiedScript.replace(
            togglePattern,
            match => `${match}\n            const oldState = getMetadata(svgElement).parameters.state === 'true';
            const newState = !oldState;
            svgElement.triggerComponentEvent('toggle');
            svgElement.triggerComponentEvent(newState ? 'on' : 'off');`
        );
    }
    
    return modifiedScript;
}

/**
 * Dodaje kod do wyzwalania zdarzeń dla suwaka
 */
function injectSliderEventTriggers(scriptContent) {
    // Znajdź funkcję aktualizacji wartości
    const updatePattern = /function\s+updateSliderValue\s*\([^)]*\)\s*\{/;
    
    let modifiedScript = scriptContent;
    
    // Dodaj wyzwalanie zdarzeń change/min/max
    if (updatePattern.test(modifiedScript)) {
        modifiedScript = modifiedScript.replace(
            updatePattern,
            match => `${match}\n            const metadata = getMetadata(svgElement);
            const value = parseFloat(metadata.parameters.value || '0');
            const min = parseFloat(metadata.parameters.min || '0');
            const max = parseFloat(metadata.parameters.max || '100');
            
            svgElement.triggerComponentEvent('change', { value });
            
            if (value <= min) {
                svgElement.triggerComponentEvent('min');
            }
            if (value >= max) {
                svgElement.triggerComponentEvent('max');
            }`
        );
    }
    
    return modifiedScript;
}

/**
 * Dodaje kod do wyzwalania zdarzeń dla pokrętła
 */
function injectKnobEventTriggers(scriptContent) {
    // Podobnie jak dla suwaka
    const updatePattern = /function\s+updateKnobValue\s*\([^)]*\)\s*\{/;
    
    let modifiedScript = scriptContent;
    
    if (updatePattern.test(modifiedScript)) {
        modifiedScript = modifiedScript.replace(
            updatePattern,
            match => `${match}\n            const metadata = getMetadata(svgElement);
            const value = parseFloat(metadata.parameters.value || '0');
            const min = parseFloat(metadata.parameters.min || '0');
            const max = parseFloat(metadata.parameters.max || '100');
            
            svgElement.triggerComponentEvent('change', { value });
            
            if (value <= min) {
                svgElement.triggerComponentEvent('min');
            }
            if (value >= max) {
                svgElement.triggerComponentEvent('max');
            }`
        );
    }
    
    return modifiedScript;
}
