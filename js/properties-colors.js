// Digital Twin IDE - Properties Colors Module

export class ColorManager {
    constructor(componentManager) {
        this.componentManager = componentManager;
    }

    // Generuj sekcję kolorów SVG
    generateColorsSection(svgElement) {
        if (!svgElement) return '';

        const colorGroups = {};

        // Znajdź wszystkie elementy z atrybutami class lub className
        const elementsWithClasses = svgElement.querySelectorAll('[class], [className]');

        elementsWithClasses.forEach(element => {
            const classes = element.getAttribute('class') || element.getAttribute('className') || '';
            const classNames = classes.split(/\s+/).filter(name => name.trim() !== '');

            classNames.forEach(className => {
                if (!colorGroups[className]) {
                    colorGroups[className] = {
                        name: className,
                        colors: {}
                    };
                }

                const colors = {};
                
                // Sprawdź atrybuty fill i stroke
                const fill = element.getAttribute('fill');
                const stroke = element.getAttribute('stroke');
                
                if (fill && fill !== 'none') {
                    colors.fill = fill;
                }
                
                if (stroke && stroke !== 'none') {
                    colors.stroke = stroke;
                }

                // Sprawdź style inline
                const style = element.getAttribute('style');
                if (style) {
                    const fillMatch = style.match(/fill:\s*([^;]+)/);
                    const strokeMatch = style.match(/stroke:\s*([^;]+)/);
                    
                    if (fillMatch && fillMatch[1] && fillMatch[1].trim() !== 'none') {
                        colors.fill = fillMatch[1].trim();
                    }
                    
                    if (strokeMatch && strokeMatch[1] && strokeMatch[1].trim() !== 'none') {
                        colors.stroke = strokeMatch[1].trim();
                    }
                }

                // Dodaj kolory do grupy
                Object.assign(colorGroups[className].colors, colors);
            });
        });

        // Generuj HTML dla każdej grupy kolorów
        let html = '<div class="colors-section">';
        html += '<h5>Kolory SVG:</h5>';

        Object.values(colorGroups).forEach(group => {
            if (Object.keys(group.colors).length === 0) return;

            html += `<div class="color-group" style="margin-bottom: 15px; padding: 10px; border: 1px solid #eee; border-radius: 4px;">`;
            html += `<h6 style="margin: 0 0 10px 0;">${group.name}</h6>`;

            // Dodaj kontrolki dla każdego koloru w grupie
            Object.entries(group.colors).forEach(([type, color]) => {
                const inputId = `color-${group.name}-${type}`;
                html += `
                    <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <label for="${inputId}" style="min-width: 80px; margin-right: 10px;">
                            ${type}:
                        </label>
                        <input type="color" 
                               id="${inputId}" 
                               value="${color}" 
                               style="width: 40px; height: 30px; padding: 0; border: 1px solid #ccc;"
                               onchange="window.updateSvgColor('${group.name}', '${type}', this.value)">
                        <span style="margin-left: 5px; font-family: monospace; font-size: 12px;">${color}</span>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += '</div>';
        return html;
    }

    // Aktualizuj kolor w SVG i metadanych
    updateSvgColor(selector, type, color) {
        const selectedComponent = this.componentManager.getSelectedComponent();
        if (!selectedComponent) return;

        const svgElement = selectedComponent.element;
        if (!svgElement) return;

        // Pobierz ID komponentu
        const componentId = svgElement.getAttribute('data-id');
        if (!componentId) return;

        // Znajdź elementy pasujące do selektora
        let elements = [];
        try {
            // Specjalna obsługa dla selektorów button-*
            if (selector.startsWith('button-')) {
                // Dla przycisków, szukaj elementów z klasą lub atrybutem data-part
                elements = Array.from(svgElement.querySelectorAll(`[class*="${selector}"], [data-part="${selector}"]`));

                // Jeśli nie znaleziono, spróbuj znaleźć elementy z częściową nazwą klasy
                if (elements.length === 0) {
                    const allElements = svgElement.querySelectorAll('*');
                    elements = Array.from(allElements).filter(el => {
                        const className = el.getAttribute('class');
                        const dataPart = el.getAttribute('data-part');
                        return (className && className.includes(selector)) || 
                               (dataPart && dataPart.includes(selector));
                    });
                }

                // Jeśli nadal nie znaleziono, spróbuj znaleźć elementy z id zawierającym nazwę selektora
                if (elements.length === 0) {
                    const allElements = svgElement.querySelectorAll('*');
                    elements = Array.from(allElements).filter(el => {
                        const id = el.getAttribute('id');
                        return id && id.includes(selector.replace('button-', ''));
                    });
                }
            } else if (selector.startsWith('.')) {
                // Selektor klasy
                elements = svgElement.querySelectorAll(selector);
            } else if (selector.startsWith('#')) {
                // Selektor ID
                const el = svgElement.querySelector(selector);
                if (el) elements = [el];
            } else {
                // Selektor tagu
                elements = svgElement.getElementsByTagName(selector);
                // Jeśli nie znaleziono elementów, spróbuj jako selektor CSS
                if (elements.length === 0) {
                    elements = svgElement.querySelectorAll(selector);
                }
            }
        } catch (e) {
            console.error(`Error finding elements with selector ${selector}:`, e);
            return;
        }

        if (elements.length === 0) {
            console.warn(`No elements found for selector: ${selector}`);
            // Ostatnia szansa - spróbuj znaleźć dowolne elementy, które mogą pasować do selektora
            try {
                const allElements = svgElement.querySelectorAll('*');
                const selectorParts = selector.split('-');
                elements = Array.from(allElements).filter(el => {
                    // Sprawdź wszystkie atrybuty elementu
                    for (const attr of el.attributes) {
                        if (attr.value && typeof attr.value === 'string' && 
                            selectorParts.some(part => attr.value.includes(part))) {
                            return true;
                        }
                    }
                    return false;
                });
                console.log(`Found ${elements.length} elements using fallback method for ${selector}`);
            } catch (e) {
                console.error('Error in fallback selector method:', e);
            }
        }

        // Zaktualizuj kolory w elementach SVG
        Array.from(elements).forEach(element => {
            if (type === 'fill' || type === 'stroke') {
                // Najpierw spróbuj ustawić atrybut bezpośrednio
                element.setAttribute(type, color);

                // Zaktualizuj również w stylu, jeśli istnieje
                let style = element.getAttribute('style') || '';

                // Usuń stary kolor z atrybutu style
                style = style.replace(new RegExp(`${type}\\s*:\\s*[^;]*;?`, 'g'), '').trim();

                // Dodaj nowy kolor do atrybutu style
                if (style) {
                    // Upewnij się, że style kończy się średnikiem
                    if (!style.endsWith(';')) style += ';';
                    style = `${style} ${type}:${color};`;
                } else {
                    style = `${type}:${color};`;
                }

                // Ustaw zaktualizowany styl
                element.setAttribute('style', style);

                console.log(`Updated ${type} for element:`, element);
            }
        });

        // Zaktualizuj metadane komponentu
        this.updateColorInMetadata(componentId, selector, type, color);

        console.log(`Updated ${type} color for ${selector} to ${color} (found ${elements.length} elements)`);
    }

    // Aktualizuj kolor w metadanych komponentu
    updateColorInMetadata(componentId, selector, type, color) {
        const componentData = this.componentManager.getComponent(componentId);
        if (!componentData || !componentData.element) return;

        const svgElement = componentData.element;
        const metadataElement = svgElement.querySelector('metadata component');
        if (!metadataElement) return;

        // Znajdź lub utwórz sekcję colors w metadanych
        let colorsElement = metadataElement.querySelector('colors');
        if (!colorsElement) {
            colorsElement = document.createElementNS(null, 'colors');
            metadataElement.appendChild(colorsElement);
        }

        // Znajdź lub utwórz element color dla selektora
        let colorElement = Array.from(colorsElement.children).find(el => 
            el.getAttribute('selector') === selector
        );
        
        if (!colorElement) {
            colorElement = document.createElementNS(null, 'color');
            colorElement.setAttribute('selector', selector);
            colorsElement.appendChild(colorElement);
        }

        // Zaktualizuj atrybut koloru
        colorElement.setAttribute(type, color);

        // Zaktualizuj również metadane w pamięci
        if (!componentData.metadata.colors) {
            componentData.metadata.colors = {};
        }
        if (!componentData.metadata.colors[selector]) {
            componentData.metadata.colors[selector] = {};
        }
        componentData.metadata.colors[selector][type] = color;
    }
}
