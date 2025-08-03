// Digital Twin IDE - Properties Interactions Module

export class InteractionsManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
    }

    // Generuj sekcję interakcji dla komponentu
    generateInteractionsSection(componentData) {
        if (!componentData || !componentData.element) return '';

        const interactions = this.getComponentInteractions(componentData.element);
        let html = '<div class="interactions-section" style="margin-top: 20px;">';
        html += '<h5>Interakcje:</h5>';

        interactions.forEach((interaction, index) => {
            html += `<div class="interaction" style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`;
            html += `<h6>Interakcja ${index + 1}</h6>`;

            // Wybór zdarzenia
            html += `<label>Zdarzenie:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'event', this.value)">`;
            html += this.generateEventOptions(interaction.event, componentData.metadata?.type);
            html += `</select><br>`;

            // Wybór akcji
            html += `<label>Akcja:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'action', this.value)">`;
            html += `<option value="set" ${interaction.action === 'set' ? 'selected' : ''}>Ustaw wartość</option>`;
            html += `<option value="toggle" ${interaction.action === 'toggle' ? 'selected' : ''}>Przełącz</option>`;
            html += `<option value="increment" ${interaction.action === 'increment' ? 'selected' : ''}>Zwiększ</option>`;
            html += `<option value="decrement" ${interaction.action === 'decrement' ? 'selected' : ''}>Zmniejsz</option>`;
            html += `</select><br>`;

            // Komponent docelowy
            html += `<label>Komponent docelowy:</label>`;
            html += `<select onchange="updateInteraction('${componentData.id}', ${index}, 'target', this.value)">`;
            html += this.generateTargetOptions(interaction.target);
            html += `</select><br>`;

            // Właściwość
            html += `<label>Właściwość:</label>`;
            html += `<input type="text" value="${interaction.property || ''}" 
                           onchange="updateInteraction('${componentData.id}', ${index}, 'property', this.value)"><br>`;

            // Wartość
            html += `<label>Wartość:</label>`;
            html += `<input type="text" value="${interaction.value || ''}" 
                           onchange="updateInteraction('${componentData.id}', ${index}, 'value', this.value)"><br>`;

            // Przycisk usuwania
            html += `<button onclick="removeInteraction('${componentData.id}', ${index})" 
                           style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px;">
                       ❌ Usuń
                     </button>`;

            html += `</div>`;
        });

        // Przycisk dodawania nowej interakcji
        html += `<button onclick="addInteraction('${componentData.id}')" 
                       class="btn btn-primary" style="margin-top: 10px;">
                   ➕ Dodaj interakcję
                 </button>`;

        html += '</div>';
        return html;
    }

    // Generuj opcje dla zdarzeń w zależności od typu komponentu
    generateEventOptions(selectedEvent, componentType) {
        const commonEvents = [
            { value: 'click', label: 'Kliknięcie' },
            { value: 'hover', label: 'Najechanie' },
            { value: 'change', label: 'Zmiana' }
        ];

        const buttonEvents = [
            { value: 'press', label: 'Naciśnięcie' },
            { value: 'release', label: 'Zwolnienie' }
        ];

        const sensorEvents = [
            { value: 'threshold', label: 'Przekroczenie progu' },
            { value: 'update', label: 'Aktualizacja wartości' }
        ];

        let events = [...commonEvents];
        
        if (componentType === 'button') {
            events.push(...buttonEvents);
        } else if (componentType === 'sensor') {
            events.push(...sensorEvents);
        }

        let html = '<option value="">Wybierz zdarzenie</option>';
        events.forEach(event => {
            const selected = event.value === selectedEvent ? 'selected' : '';
            html += `<option value="${event.value}" ${selected}>${event.label}</option>`;
        });

        return html;
    }

    // Generuj opcje dla wyboru komponentu docelowego
    generateTargetOptions(selectedTargetId) {
        const components = this.componentManager.getAllComponents();
        let html = '<option value="">Wybierz komponent</option>';

        components.forEach(comp => {
            const selected = comp.id === selectedTargetId ? 'selected' : '';
            const name = comp.metadata?.name || comp.id;
            html += `<option value="${comp.id}" ${selected}>${name}</option>`;
        });

        return html;
    }

    // Pobierz interakcje z metadanych komponentu
    getComponentInteractions(svgElement) {
        if (!svgElement) return [];

        try {
            const metadataAttr = svgElement.getAttribute('data-metadata');
            if (metadataAttr) {
                const metadata = JSON.parse(metadataAttr);
                return metadata.interactions || [];
            }

            // Fallback: sprawdź XML metadata
            const metadataElement = svgElement.querySelector('metadata component');
            if (metadataElement) {
                const interactionsElement = metadataElement.querySelector('interactions');
                if (interactionsElement) {
                    const interactions = [];
                    Array.from(interactionsElement.children).forEach(interactionEl => {
                        interactions.push({
                            event: interactionEl.getAttribute('event') || '',
                            action: interactionEl.getAttribute('action') || '',
                            target: interactionEl.getAttribute('target') || '',
                            property: interactionEl.getAttribute('property') || '',
                            value: interactionEl.getAttribute('value') || ''
                        });
                    });
                    return interactions;
                }
            }
        } catch (e) {
            console.error('Error parsing interactions metadata:', e);
        }

        return [];
    }

    // Dodaj nową interakcję do komponentu
    addInteraction(id) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        interactions.push({
            event: '',
            action: 'set',
            target: '',
            property: '',
            value: ''
        });

        this.updateInteractionsInMetadata(id, interactions);

        // Odśwież panel właściwości
        if (window.propertiesManager) {
            window.propertiesManager.showProperties(componentData.element);
        }
    }

    // Aktualizuj interakcję komponentu
    updateInteraction(id, index, property, value) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= 0 && index < interactions.length) {
            interactions[index][property] = value;
            this.updateInteractionsInMetadata(id, interactions);
        }
    }

    // Usuń interakcję z komponentu
    removeInteraction(id, index) {
        const componentData = this.componentManager.getComponent(id);
        if (!componentData) return;

        const interactions = this.getComponentInteractions(componentData.element);
        if (index >= 0 && index < interactions.length) {
            interactions.splice(index, 1);
            this.updateInteractionsInMetadata(id, interactions);

            // Odśwież panel właściwości
            if (window.propertiesManager) {
                window.propertiesManager.showProperties(componentData.element);
            }
        }
    }

    // Aktualizuj interakcje w metadanych komponentu
    updateInteractionsInMetadata(componentId, interactions) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData || !componentData.element) return;

        const svgElement = componentData.element;

        // Aktualizuj w data-metadata
        const metadataAttr = svgElement.getAttribute('data-metadata');
        let metadata = {};
        
        try {
            if (metadataAttr) {
                metadata = JSON.parse(metadataAttr);
            }
        } catch (e) {
            console.error('Error parsing metadata:', e);
        }

        metadata.interactions = interactions;
        svgElement.setAttribute('data-metadata', JSON.stringify(metadata));

        // Aktualizuj w pamięci komponentu
        if (!componentData.metadata) componentData.metadata = {};
        componentData.metadata.interactions = interactions;

        // Aktualizuj XML metadata jeśli istnieje
        const metadataElement = svgElement.querySelector('metadata component');
        if (metadataElement) {
            let interactionsElement = metadataElement.querySelector('interactions');
            if (!interactionsElement) {
                interactionsElement = document.createElementNS(null, 'interactions');
                metadataElement.appendChild(interactionsElement);
            }

            // Wyczyść istniejące interakcje
            while (interactionsElement.firstChild) {
                interactionsElement.removeChild(interactionsElement.firstChild);
            }

            // Dodaj nowe interakcje
            interactions.forEach(interaction => {
                const interactionEl = document.createElementNS(null, 'interaction');
                interactionEl.setAttribute('event', interaction.event);
                interactionEl.setAttribute('action', interaction.action);
                interactionEl.setAttribute('target', interaction.target);
                interactionEl.setAttribute('property', interaction.property);
                interactionEl.setAttribute('value', interaction.value);
                interactionsElement.appendChild(interactionEl);
            });
        }
    }

    // Wykonaj interakcję
    executeInteraction(interaction, sourceComponent) {
        if (!interaction.target || !interaction.action) return;

        const targetComponent = this.componentManager.getComponent(interaction.target);
        if (!targetComponent) return;

        const { action, property, value } = interaction;

        switch (action) {
            case 'set':
                this.setComponentProperty(targetComponent, property, value);
                break;
            case 'toggle':
                this.toggleComponentProperty(targetComponent, property);
                break;
            case 'increment':
                this.incrementComponentProperty(targetComponent, property, parseFloat(value) || 1);
                break;
            case 'decrement':
                this.incrementComponentProperty(targetComponent, property, -(parseFloat(value) || 1));
                break;
        }
    }

    // Ustaw właściwość komponentu
    setComponentProperty(component, property, value) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        component.metadata.parameters[property] = value;

        // Zaktualizuj w SVG
        if (component.element && window.propertiesManager?.metadataManager) {
            window.propertiesManager.metadataManager.applyParameterToSVG(
                component.element, 
                `parameters.${property}`, 
                value
            );
        }
    }

    // Przełącz właściwość boolean komponentu
    toggleComponentProperty(component, property) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = component.metadata.parameters[property];
        const newValue = !currentValue;
        
        this.setComponentProperty(component, property, newValue);
    }

    // Zwiększ/zmniejsz właściwość liczbową komponentu
    incrementComponentProperty(component, property, increment) {
        if (!component.metadata) component.metadata = {};
        if (!component.metadata.parameters) component.metadata.parameters = {};

        const currentValue = parseFloat(component.metadata.parameters[property]) || 0;
        const newValue = currentValue + increment;
        
        this.setComponentProperty(component, property, newValue);
    }
}
