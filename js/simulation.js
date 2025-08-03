// Digital Twin IDE - Simulation Module

export class SimulationManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
        this.simulationInterval = null;
        this.isRunning = false;
    }

    // Uruchom symulację
    startSimulation() {
        if (this.isRunning) {
            console.log("Symulacja już działa");
            return;
        }

        this.isRunning = true;
        this.simulationInterval = setInterval(() => {
            this.updateSimulation();
        }, 1000); // Aktualizuj co sekundę

        this.updateSimulationUI();
        console.log("Symulacja uruchomiona");
    }

    // Zatrzymaj symulację
    stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        this.isRunning = false;
        this.updateSimulationUI();
        console.log("Symulacja zatrzymana");
    }

    // Aktualizuj symulację
    updateSimulation() {
        const components = this.componentManager.getAllComponents();
        
        components.forEach(comp => {
            if (comp.metadata && comp.metadata.parameters) {
                this.simulateComponent(comp);
            }
        });

        this.refreshSimulationList();
    }

    // Symuluj pojedynczy komponent
    simulateComponent(componentData) {
        const { element, metadata, id } = componentData;
        
        // Symuluj różne typy komponentów
        const componentType = this.getComponentType(element);
        
        switch (componentType) {
            case 'sensor':
                this.simulateSensor(componentData);
                break;
            case 'motor':
                this.simulateMotor(componentData);
                break;
            case 'gauge':
                this.simulateGauge(componentData);
                break;
            case 'display':
                this.simulateDisplay(componentData);
                break;
            default:
                this.simulateGeneric(componentData);
        }
    }

    // Określ typ komponentu na podstawie URL lub metadanych
    getComponentType(element) {
        const svgUrl = element.getAttribute('data-svg-url') || '';
        
        if (svgUrl.includes('sensor')) return 'sensor';
        if (svgUrl.includes('motor')) return 'motor';
        if (svgUrl.includes('gauge')) return 'gauge';
        if (svgUrl.includes('display')) return 'display';
        
        return 'generic';
    }

    // Symuluj czujnik (temperatura, wilgotność, etc.)
    simulateSensor(componentData) {
        const { metadata, id } = componentData;
        
        if (!metadata.simulation) {
            metadata.simulation = {};
        }

        // Generuj losową wartość temperatury (20-30°C)
        const temperature = (20 + Math.random() * 10).toFixed(1);
        metadata.simulation.temperature = temperature;
        metadata.simulation.lastUpdate = new Date().toLocaleTimeString();
        
        // Aktualizuj tekst w SVG jeśli istnieje
        const textElements = componentData.element.querySelectorAll('text');
        textElements.forEach(text => {
            if (text.textContent.includes('°C') || text.textContent.includes('temp')) {
                text.textContent = `${temperature}°C`;
            }
        });
    }

    // Symuluj silnik
    simulateMotor(componentData) {
        const { metadata, id } = componentData;
        
        if (!metadata.simulation) {
            metadata.simulation = {};
        }

        // Symuluj obroty silnika
        const rpm = Math.floor(1000 + Math.random() * 2000);
        metadata.simulation.rpm = rpm;
        metadata.simulation.status = rpm > 1500 ? 'running' : 'idle';
        metadata.simulation.lastUpdate = new Date().toLocaleTimeString();

        // Wizualna animacja - obracanie
        const currentTransform = componentData.element.getAttribute('transform') || '';
        const rotation = (Date.now() / 100) % 360; // Wolny obrót
        
        if (metadata.simulation.status === 'running') {
            const x = parseFloat(componentData.element.getAttribute('x')) || 0;
            const y = parseFloat(componentData.element.getAttribute('y')) || 0;
            const width = parseFloat(componentData.element.getAttribute('width')) || 100;
            const height = parseFloat(componentData.element.getAttribute('height')) || 100;
            
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            
            componentData.element.setAttribute('transform', 
                `rotate(${rotation} ${centerX} ${centerY})`);
        }
    }

    // Symuluj miernik
    simulateGauge(componentData) {
        const { metadata, id } = componentData;
        
        if (!metadata.simulation) {
            metadata.simulation = {};
        }

        // Generuj wartość dla miernika (0-100)
        const value = (Math.random() * 100).toFixed(0);
        metadata.simulation.value = value;
        metadata.simulation.unit = '%';
        metadata.simulation.lastUpdate = new Date().toLocaleTimeString();
    }

    // Symuluj wyświetlacz
    simulateDisplay(componentData) {
        const { element, metadata, id } = componentData;
        if (!element || !metadata) return;

        // Symuluj temperaturę sensora (waha się między 20-30°C)
        const temperature = 20 + Math.random() * 10;
        
        // Zaktualizuj tekst w elemencie SVG
        const valueElement = element.querySelector('#value, text[id="value"]');
        if (valueElement) {
            valueElement.textContent = `${temperature.toFixed(1)}°C`;
        }
        
        // Zaktualizuj metadane z nową temperaturą
        const updatedMetadata = { ...metadata };
        if (!updatedMetadata.parameters) updatedMetadata.parameters = {};
        updatedMetadata.parameters.value = temperature.toFixed(1);
        
        // Użyj funkcji z componentManager do aktualizacji metadanych
        this.componentManager.updateXMLMetadata(element, updatedMetadata);
        metadata.simulation.lastUpdate = new Date().toLocaleTimeString();

        // Aktualizuj tekst w SVG
        const textElements = componentData.element.querySelectorAll('text');
        textElements.forEach(text => {
            text.textContent = message;
        });
    }

    // Symuluj komponent ogólny
    simulateGeneric(componentData) {
        const { metadata, id } = componentData;
        
        if (!metadata.simulation) {
            metadata.simulation = {};
        }

        metadata.simulation.status = 'active';
        metadata.simulation.lastUpdate = new Date().toLocaleTimeString();
    }

    // Odśwież listę symulacji w UI
    refreshSimulationList() {
        const simulationList = document.getElementById('simulation-list');
        if (!simulationList) return;

        const components = this.componentManager.getAllComponents();
        let html = '';

        if (components.length === 0) {
            html = '<p><i>Brak komponentów do symulacji</i></p>';
        } else {
            components.forEach(comp => {
                const sim = comp.metadata?.simulation;
                if (sim) {
                    html += `<div style="margin: 5px 0; padding: 5px; background: #333; border-radius: 3px;">`;
                    html += `<strong>${comp.id}</strong><br>`;
                    
                    Object.keys(sim).forEach(key => {
                        if (key !== 'lastUpdate') {
                            html += `${key}: ${sim[key]} `;
                        }
                    });
                    
                    html += `<br><small>Ostatnia aktualizacja: ${sim.lastUpdate}</small>`;
                    html += `</div>`;
                }
            });
        }

        simulationList.innerHTML = html;
    }

    // Aktualizuj UI przycisków symulacji
    updateSimulationUI() {
        const startBtn = document.querySelector('button[onclick="startSimulation()"]');
        const stopBtn = document.querySelector('button[onclick="stopSimulation()"]');
        
        if (startBtn) {
            startBtn.disabled = this.isRunning;
            startBtn.style.opacity = this.isRunning ? '0.5' : '1';
        }
        
        if (stopBtn) {
            stopBtn.disabled = !this.isRunning;
            stopBtn.style.opacity = !this.isRunning ? '0.5' : '1';
        }
    }
}

// Globalne funkcje dla wywołań z HTML
window.startSimulation = function() {
    if (window.simulationManager) {
        window.simulationManager.startSimulation();
    }
};

window.stopSimulation = function() {
    if (window.simulationManager) {
        window.simulationManager.stopSimulation();
    }
};
