/**
 * Simple Component Loader - bezpośrednie ładowanie komponentów do lewej kolumny
 * Zastępuje skomplikowany ComponentsLibrarySidebar prostym rozwiązaniem
 */

import { ComponentIconLoader } from './utils/component-icon-loader.js';

class SimpleComponentLoader {
    constructor() {
        this.components = [];
        this.init();
    }

    async init() {
        console.log('[SimpleComponentLoader] Starting simple component loading...');
        
        // Znajdź element lewej kolumny
        const componentLibrary = document.getElementById('component-library');
        if (!componentLibrary) {
            console.error('[SimpleComponentLoader] Component library element not found!');
            return;
        }

        try {
            // Załaduj komponenty z components.json
            const response = await fetch('/components.json');
            const data = await response.json();
            
            if (data.components && Array.isArray(data.components)) {
                this.components = data.components;
                console.log(`[SimpleComponentLoader] Loaded ${this.components.length} components`);
                
                // Wyrenderuj komponenty
                this.renderComponents(componentLibrary);
            } else {
                throw new Error('Invalid components.json format');
            }
        } catch (error) {
            console.error('[SimpleComponentLoader] Error loading components:', error);
            componentLibrary.innerHTML = `
                <div class="error-state">
                    <p>❌ Błąd ładowania komponentów</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    async renderComponents(container) {
        console.log('[SimpleComponentLoader] Rendering components...');
        
        // Wyczyść kontener
        container.innerHTML = '';
        
        // Pokaż stan ładowania
        container.innerHTML = '<div class="loading-state">Ładowanie komponentów...</div>';
        
        try {
            // Stwórz listę komponentów
            const componentsList = document.createElement('div');
            componentsList.className = 'components-list';
            
            // Create all component items (in parallel)
            const itemPromises = this.components.map(component => this.createComponentItem(component));
            const items = await Promise.all(itemPromises);
            
            // Add all created items to the list
            items.forEach(item => componentsList.appendChild(item));
            
            // Clear loading state and append components list
            container.innerHTML = '';
            container.appendChild(componentsList);
            
            // Dodaj style
            this.addStyles();
            
            console.log(`[SimpleComponentLoader] Rendered ${this.components.length} components`);
        } catch (error) {
            console.error('[SimpleComponentLoader] Error rendering components:', error);
            container.innerHTML = `
                <div class="error-state">
                    <p>❌ Błąd renderowania komponentów</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    async createComponentItem(component) {
        const item = document.createElement('div');
        item.className = 'simple-component-item';
        item.dataset.componentId = component.id;
        item.dataset.componentName = component.name;
        item.dataset.svgPath = component.svg || '';
        item.draggable = true;
        
        // Określ ikonę na podstawie typu (asynchronicznie)
        const icon = await this.getComponentIcon(component);
        
        item.innerHTML = `
            <div class="component-header">
                <span class="component-icon">${icon}</span>
                <span class="component-name">${component.name}</span>
            </div>
            <div class="component-actions">
                <button class="add-btn" title="Dodaj do canvas">➕</button>
            </div>
        `;
        
        // Event listenery
        const addBtn = item.querySelector('.add-btn');
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addComponentToCanvas(component);
        });
        
        // Drag and drop
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'component-template',
                id: component.id,
                name: component.name,
                svg: component.svg
            }));
        });
        
        // Click to add
        item.addEventListener('click', () => {
            this.addComponentToCanvas(component);
        });
        
        return item;
    }

    async getComponentIcon(component) {
        const componentId = ComponentIconLoader.extractComponentId(component);
        
        // Get the component's icon element if it exists in the DOM
        const iconElement = document.querySelector(`.simple-component-item[data-component-id="${component.id}"] .component-icon`);
        
        // Pass callbacks to handle loading state if the element exists
        const options = {};
        if (iconElement) {
            options.onLoadStart = () => {
                iconElement.classList.add('loading-icon');
            };
            options.onLoadEnd = () => {
                iconElement.classList.remove('loading-icon');
            };
        }
        
        return await ComponentIconLoader.loadIcon(componentId, options);
    }

    addComponentToCanvas(component) {
        console.log(`[SimpleComponentLoader] Adding component: ${component.name}`);
        
        // Wyślijmy event dla innych części aplikacji
        const addEvent = new CustomEvent('add-component-to-canvas', {
            detail: {
                template: component,
                position: { x: 100, y: 100 }
            }
        });
        document.dispatchEvent(addEvent);
        
        // Pokazuj powiadomienie
        this.showNotification(`Dodano komponent: ${component.name}`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'simple-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    addStyles() {
        if (document.getElementById('simple-component-loader-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'simple-component-loader-styles';
        style.textContent = `
            .simple-component-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                margin: 4px 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                background: white;
                transition: all 0.2s;
            }
            
            .simple-component-item:hover {
                background: #f5f5f5;
                transform: translateX(2px);
            }
            
            .loading-icon {
                position: relative;
                opacity: 0.5;
            }
            
            .loading-icon::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 10px;
                height: 10px;
                margin-top: -5px;
                margin-left: -5px;
                border: 2px solid #4CAF50;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 0.8s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .loading-state {
                padding: 20px;
                text-align: center;
                color: #666;
                font-style: italic;
            }
            
            .component-header {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }
            
            .component-icon {
                font-size: 16px;
            }
            
            .component-name {
                font-size: 13px;
                font-weight: 500;
                color: #333;
            }
            
            .component-actions {
                display: flex;
                gap: 4px;
            }
            
            .add-btn {
                background: none;
                border: none;
                font-size: 14px;
                cursor: pointer;
                padding: 4px 6px;
                border-radius: 3px;
                transition: background 0.2s;
            }
            
            .add-btn:hover {
                background: rgba(76, 175, 80, 0.1);
            }
            
            .error-state {
                padding: 20px;
                text-align: center;
                color: #666;
            }
            
            .error-state p {
                margin: 0 0 8px 0;
            }
            
            .error-state small {
                font-size: 11px;
                color: #999;
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicjalizuj po załadowaniu DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SimpleComponentLoader();
    });
} else {
    new SimpleComponentLoader();
}

console.log('[SimpleComponentLoader] Module loaded');
