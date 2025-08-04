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

        // Generuj HTML dla każdej grupy kolorów - kompaktowo
        let html = '<div class="colors-section-compact">';
        
        Object.values(colorGroups).forEach(group => {
            if (Object.keys(group.colors).length === 0) return;

            html += `<div class="color-group-compact">`;
            html += `<div class="color-group-title">${group.name}</div>`;

            // Dodaj kontrolki dla każdego koloru w grupie - kompaktowo
            Object.entries(group.colors).forEach(([type, color]) => {
                const inputId = `color-${group.name}-${type}`;
                html += `
                    <div class="color-control">
                        <label for="${inputId}" class="color-label">${type}</label>
                        <input type="color" 
                               id="${inputId}" 
                               value="${color}" 
                               class="color-input-compact"
                               onchange="window.updateSvgColor('${group.name}', '${type}', this.value)">
                        <span class="color-value">${color}</span>
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

        // Handle both direct element and object with element property
        const svgElement = selectedComponent.element || selectedComponent;
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
                // Selektor bez prefiksu - prawdopodobnie nazwa klasy
                // Najpierw spróbuj jako selektor klasy CSS
                elements = svgElement.querySelectorAll(`.${selector}`);
                
                // Jeśli nie znaleziono, spróbuj jako selektor tagu
                if (elements.length === 0) {
                    elements = svgElement.getElementsByTagName(selector);
                }
                
                // Jeśli nadal nie znaleziono, spróbuj jako bezpośredni selektor CSS
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
            // Stwórz flagę informującą czy zmiana została zastosowana
            let colorApplied = false;
            
            // Specjalna obsługa dla elementów tekstowych
            const isTextElement = element.tagName.toLowerCase() === 'text';
            
            // Sprawdź czy element jest animowany (LED, pump, itp.)
            const isAnimatedElement = this.isAnimatedElement(element, svgElement);
            
            if (type === 'fill' || type === 'stroke') {
                // Dla animowanych elementów, unikaj nadpisywania style CSS
                if (isAnimatedElement && type === 'fill') {
                    // Tylko ustaw atrybut, nie style CSS (aby nie kolidować z animacją)
                    element.setAttribute(type, color);
                    colorApplied = true;
                    
                    // Zaktualizuj również metadane komponentu, aby animacja używała nowego koloru
                    this.updateAnimationColor(svgElement, color);
                } else {
                    // Dla nieanimowanych elementów lub stroke, użyj pełnej logiki
                    element.setAttribute(type, color);
                    colorApplied = true;
                    
                    // Zaktualizuj również w stylu, jeśli nie jest animowany
                    if (!isAnimatedElement) {
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
                    }
                }
                
                // Dodatkowe zabezpieczenie dla przeglądarek, które mogą ignorować zmianę fill dla tekstu
                if (isTextElement) {
                    // Spróbuj ustawić kolor przez CSS (tylko dla tekstu, nie animowanych elementów)
                    element.style.color = color;
                    // Ustaw dodatkowy atrybut dla SVG
                    element.setAttribute('fill', color);
                }
                
                console.log(`Updated ${type} for element ${element.tagName} (${element.id || element.className || 'no-id'}) to ${color} (animated: ${isAnimatedElement})`);
            }
        });

        // Zaktualizuj metadane komponentu
        this.updateColorInMetadata(componentId, selector, type, color);

        console.log(`Updated ${type} color for ${selector} to ${color} (found ${elements.length} elements)`);
    }

    // Sprawdź czy element jest animowany (LED, pump, itp.)
    isAnimatedElement(element, svgElement) {
        // Sprawdź klasy elementów, które są zwykle animowane
        const animatedClasses = ['led-core', 'pump-rotor', 'valve-handle', 'sensor-indicator'];
        const elementClass = element.getAttribute('class') || '';
        
        // Sprawdź czy element ma klasę animowaną
        if (animatedClasses.some(cls => elementClass.includes(cls))) {
            return true;
        }
        
        // Sprawdź czy rodzicowski SVG ma aktywne interwały (LED mruga)
        if (svgElement && svgElement.blinkInterval) {
            return element.classList.contains('led-core');
        }
        
        return false;
    }

    // Zaktualizuj kolor animacji w metadanych komponentu
    updateAnimationColor(svgElement, color) {
        if (!svgElement) return;
        
        // Zaktualizuj metadane LED
        const metadataElement = svgElement.querySelector('metadata component');
        if (metadataElement) {
            const colorElement = metadataElement.querySelector('parameters color');
            if (colorElement) {
                colorElement.textContent = color;
                console.log(`🎨 Updated animation color in metadata to ${color}`);
                
                // Wymuś odświeżenie animacji LED poprzez zmianę parametru
                const event = new CustomEvent('metadata-updated', {
                    detail: { svgElement, parameter: 'color', value: color }
                });
                document.dispatchEvent(event);
            }
        }
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
