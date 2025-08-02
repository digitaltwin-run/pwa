// Digital Twin IDE - Connections Module

export class ConnectionManager {
    constructor(componentManager, svgCanvas) {
        this.componentManager = componentManager;
        this.svgCanvas = svgCanvas;
        this.isConnectionMode = false;
        this.connectionStart = null;
    }

    // Przełącz tryb łączenia komponentów
    toggleConnectionMode() {
        this.isConnectionMode = !this.isConnectionMode;
        const btn = document.querySelector('button[onclick="toggleConnectionMode()"]');
        
        if (this.isConnectionMode) {
            btn.style.background = '#e74c3c';
            btn.textContent = '❌ Anuluj łączenie';
            document.body.style.cursor = 'crosshair';
            console.log("Tryb łączenia włączony");
        } else {
            btn.style.background = '#8e44ad';
            btn.textContent = '🔗 Łącz komponenty';
            document.body.style.cursor = 'default';
            this.connectionStart = null;
            console.log("Tryb łączenia wyłączony");
        }
    }

    // Rozpocznij połączenie od wybranego komponentu
    startConnection(svgElement) {
        if (!this.isConnectionMode) return;

        const componentId = svgElement.getAttribute('data-id');
        
        if (!this.connectionStart) {
            // Pierwszy komponent
            this.connectionStart = {
                element: svgElement,
                id: componentId
            };
            
            svgElement.style.outline = '3px solid #e74c3c';
            console.log(`Rozpoczęto połączenie od: ${componentId}`);
            
        } else if (this.connectionStart.id !== componentId) {
            // Drugi komponent - utwórz połączenie
            this.createConnection(this.connectionStart, {
                element: svgElement,
                id: componentId
            });
            
            // Resetuj
            this.connectionStart.element.style.outline = '';
            this.connectionStart = null;
            
        } else {
            console.log("Nie można połączyć komponentu z samym sobą");
        }
    }

    // Utwórz wizualne połączenie między komponentami
    createConnection(comp1, comp2) {
        const el1 = comp1.element;
        const el2 = comp2.element;
        
        // Oblicz pozycje środków komponentów
        const x1 = parseFloat(el1.getAttribute('x')) + (parseFloat(el1.getAttribute('width')) || 100) / 2;
        const y1 = parseFloat(el1.getAttribute('y')) + (parseFloat(el1.getAttribute('height')) || 100) / 2;
        const x2 = parseFloat(el2.getAttribute('x')) + (parseFloat(el2.getAttribute('width')) || 100) / 2;
        const y2 = parseFloat(el2.getAttribute('y')) + (parseFloat(el2.getAttribute('height')) || 100) / 2;
        
        // Utwórz linię
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "#2c3e50");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("marker-end", "url(#arrow)");
        line.setAttribute("data-connection", "true");
        line.setAttribute("data-from", comp1.id);
        line.setAttribute("data-to", comp2.id);
        
        // Dodaj możliwość usunięcia połączenia
        line.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (confirm('Usunąć to połączenie?')) {
                    line.remove();
                }
                e.stopPropagation();
            }
        });
        
        line.style.cursor = 'pointer';
        line.setAttribute("title", `Połączenie: ${comp1.id} → ${comp2.id}\nCtrl+klik aby usunąć`);
        
        this.svgCanvas.appendChild(line);
        
        console.log(`Utworzono połączenie: ${comp1.id} → ${comp2.id}`);
    }

    // Aktualizuj pozycje połączeń gdy komponent się przesuwa
    updateConnectionsForComponent(componentId) {
        const lines = this.svgCanvas.querySelectorAll(`line[data-from="${componentId}"], line[data-to="${componentId}"]`);
        
        lines.forEach(line => {
            const fromId = line.getAttribute('data-from');
            const toId = line.getAttribute('data-to');
            
            const fromComponent = this.componentManager.getComponent(fromId);
            const toComponent = this.componentManager.getComponent(toId);
            
            if (fromComponent && toComponent) {
                const el1 = fromComponent.element;
                const el2 = toComponent.element;
                
                const x1 = parseFloat(el1.getAttribute('x')) + (parseFloat(el1.getAttribute('width')) || 100) / 2;
                const y1 = parseFloat(el1.getAttribute('y')) + (parseFloat(el1.getAttribute('height')) || 100) / 2;
                const x2 = parseFloat(el2.getAttribute('x')) + (parseFloat(el2.getAttribute('width')) || 100) / 2;
                const y2 = parseFloat(el2.getAttribute('y')) + (parseFloat(el2.getAttribute('height')) || 100) / 2;
                
                line.setAttribute("x1", x1);
                line.setAttribute("y1", y1);
                line.setAttribute("x2", x2);
                line.setAttribute("y2", y2);
            }
        });
    }

    // Usuń wszystkie połączenia związane z komponentem
    removeConnectionsForComponent(componentId) {
        const lines = this.svgCanvas.querySelectorAll(`line[data-from="${componentId}"], line[data-to="${componentId}"]`);
        lines.forEach(line => line.remove());
    }
}

// Globalna funkcja dla wywołań z HTML
window.toggleConnectionMode = function() {
    if (window.connectionManager) {
        window.connectionManager.toggleConnectionMode();
    }
};
