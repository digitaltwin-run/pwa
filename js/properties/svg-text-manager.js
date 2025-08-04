/**
 * SVG Text Manager - obsługuje edycję tekstów w SVG komponentach
 */
class SVGTextManager {
    constructor() {
        this.textElements = new Map();
        this.initialize();
    }

    initialize() {
        console.log('🔤 SVGTextManager initialized');
    }

    // Generuj sekcję edycji tekstów dla danego SVG elementu
    generateTextSection(svgElement) {
        if (!svgElement) return '';

        const textElements = this.extractTextElements(svgElement);
        
        if (textElements.length === 0) {
            return '';
        }

        let html = `
            <div class="property-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-size: 13px; color: #495057; font-weight: 500;" data-i18n="properties.texts">Teksty:</label>
        `;

        textElements.forEach((textEl, index) => {
            const currentText = textEl.textContent || '';
            const textId = textEl.id || `text-${index}`;
            const label = this.getTextLabel(textEl, index);
            
            // Pobierz aktualne wartości x i y
            const currentX = textEl.getAttribute('x') || '0';
            const currentY = textEl.getAttribute('y') || '0';
            
            // Pobierz aktualne wartości czcionki
            const currentFontFamily = textEl.getAttribute('font-family') || textEl.style.fontFamily || 'Arial, sans-serif';
            const currentFontSize = textEl.getAttribute('font-size') || textEl.style.fontSize || '12';

            // Upewnij się, że svgElement ma identyfikator, jeśli nie - użyj data atrybutów lub generuj unikalny
            const svgId = svgElement.id || svgElement.getAttribute('data-id') || `svg-element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Jeśli element SVG nie miał id, tymczasowo przypisz wygenerowane
            if (!svgElement.id) {
                svgElement.id = svgId;
                console.log(`⚠️ SVG element bez ID - przypisano tymczasowe: ${svgId}`);
            }
            
            html += `
                <div style="margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
                    <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #6c757d; font-weight: 500;">${label}:</label>
                    <input type="text" 
                           value="${currentText}"
                           oninput="window.svgTextManager?.updateTextContent('${svgId}', '${textId}', this.value)"
                           style="width: 100%; padding: 6px 8px; border: 1px solid #ced4da; border-radius: 3px; font-size: 12px; font-family: inherit; margin-bottom: 8px;">
                    
                    <div style="display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 2px; font-size: 11px; color: #6c757d;" data-i18n="properties.position_x">X:</label>
                            <input type="number" 
                                   value="${currentX}"
                                   oninput="window.svgTextManager?.updateTextPosition('${svgId}', '${textId}', this.value, null)"
                                   style="width: 100%; padding: 4px 6px; border: 1px solid #ced4da; border-radius: 3px; font-size: 11px;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 2px; font-size: 11px; color: #6c757d;" data-i18n="properties.position_y">Y:</label>
                            <input type="number" 
                                   value="${currentY}"
                                   oninput="window.svgTextManager?.updateTextPosition('${svgId}', '${textId}', null, this.value)"
                                   style="width: 100%; padding: 4px 6px; border: 1px solid #ced4da; border-radius: 3px; font-size: 11px;">
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; gap: 10px;">
                        <div style="flex: 2;">
                            <label style="display: block; margin-bottom: 2px; font-size: 11px; color: #6c757d;" data-i18n="properties.font_family">Czcionka:</label>
                            <select oninput="window.svgTextManager?.updateTextFont('${svgId}', '${textId}', this.value, null)"
                                    style="width: 100%; padding: 4px 6px; border: 1px solid #ced4da; border-radius: 3px; font-size: 11px;">
                                <option value="Arial, sans-serif" ${currentFontFamily.includes('Arial') ? 'selected' : ''}>Arial</option>
                                <option value="Helvetica, sans-serif" ${currentFontFamily.includes('Helvetica') ? 'selected' : ''}>Helvetica</option>
                                <option value="Times, serif" ${currentFontFamily.includes('Times') ? 'selected' : ''}>Times</option>
                                <option value="Courier, monospace" ${currentFontFamily.includes('Courier') ? 'selected' : ''}>Courier</option>
                                <option value="Verdana, sans-serif" ${currentFontFamily.includes('Verdana') ? 'selected' : ''}>Verdana</option>
                                <option value="Georgia, serif" ${currentFontFamily.includes('Georgia') ? 'selected' : ''}>Georgia</option>
                                <option value="Trebuchet MS, sans-serif" ${currentFontFamily.includes('Trebuchet') ? 'selected' : ''}>Trebuchet MS</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; margin-bottom: 2px; font-size: 11px; color: #6c757d;" data-i18n="properties.font_size">Rozmiar:</label>
                            <input type="number" 
                                   value="${currentFontSize.replace('px', '')}"
                                   min="8" max="72" step="1"
                                   oninput="window.svgTextManager?.updateTextFont('${svgId}', '${textId}', null, this.value)"
                                   style="width: 100%; padding: 4px 6px; border: 1px solid #ced4da; border-radius: 3px; font-size: 11px;">
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    // Wyciągnij wszystkie elementy <text> z SVG
    extractTextElements(svgElement) {
        if (!svgElement) return [];
        
        // Znajdź wszystkie elementy <text> w SVG
        const textElements = svgElement.querySelectorAll('text');
        return Array.from(textElements);
    }

    // Określ etykietę dla elementu text na podstawie id lub pozycji
    getTextLabel(textElement, index) {
        const id = textElement.id;
        
        // Mapowanie popularnych id na polskie nazwy
        const labelMap = {
            'label': 'Etykieta',
            'title': 'Tytuł', 
            'value': 'Wartość',
            'name': 'Nazwa',
            'text': 'Tekst',
            'description': 'Opis'
        };

        if (id && labelMap[id.toLowerCase()]) {
            return labelMap[id.toLowerCase()];
        }

        if (id) {
            return id.charAt(0).toUpperCase() + id.slice(1);
        }

        return `Tekst ${index + 1}`;
    }

    // Aktualizuj zawartość tekstu w SVG
    updateTextContent(svgElementId, textElementId, newContent) {
        try {
            // Sprawdzenie czy svgElementId nie jest pusty
            if (!svgElementId) {
                console.error('Empty SVG element ID provided');
                return;
            }
            
            // Sprawdzenie czy textElementId nie jest pusty
            if (!textElementId) {
                console.error('Empty text element ID provided');
                return;
            }

            const svgElement = document.getElementById(svgElementId);
            if (!svgElement) {
                console.error('SVG element not found:', svgElementId);
                return;
            }

            // Znajdź element text po ID
            let textElement = svgElement.querySelector(`#${textElementId}`);
            
            // Jeśli nie znaleziono po ID, spróbuj znaleźć wszystkie text elementy
            if (!textElement) {
                const textElements = svgElement.querySelectorAll('text');
                textElement = Array.from(textElements).find(el => 
                    el.id === textElementId || el.getAttribute('data-text-id') === textElementId
                );
                
                // Jako ostateczność, jeśli textElementId ma format "text-X", spróbuj znaleźć element po indeksie
                if (!textElement && textElementId.startsWith('text-')) {
                    const index = parseInt(textElementId.split('-')[1], 10);
                    if (!isNaN(index) && textElements[index]) {
                        textElement = textElements[index];
                    }
                }
            }

            if (textElement) {
                textElement.textContent = newContent;
                console.log(`✅ Updated text in ${svgElementId}/${textElementId}: "${newContent}"`);
                
                // Wywołaj event informujący o zmianie
                this.dispatchTextUpdateEvent(svgElementId, textElementId, newContent);
            } else {
                console.error('Text element not found:', textElementId, 'in', svgElementId);
            }
        } catch (error) {
            console.error('Error updating text content:', error);
        }
    }
    
    // Aktualizuj pozycję tekstu (współrzędne x, y) w SVG
    updateTextPosition(svgElementId, textElementId, newX, newY) {
        try {
            // Sprawdzenie czy svgElementId nie jest pusty
            if (!svgElementId) {
                console.error('Empty SVG element ID provided');
                return;
            }
            
            // Sprawdzenie czy textElementId nie jest pusty
            if (!textElementId) {
                console.error('Empty text element ID provided');
                return;
            }

            // Sprawdź czy przekazano przynajmniej jedną współrzędną
            if (newX === null && newY === null) {
                console.error('No coordinates provided for update');
                return;
            }

            const svgElement = document.getElementById(svgElementId);
            if (!svgElement) {
                console.error('SVG element not found:', svgElementId);
                return;
            }

            // Znajdź element text po ID
            let textElement = svgElement.querySelector(`#${textElementId}`);
            
            // Jeśli nie znaleziono po ID, spróbuj znaleźć wszystkie text elementy
            if (!textElement) {
                const textElements = svgElement.querySelectorAll('text');
                textElement = Array.from(textElements).find(el => 
                    el.id === textElementId || el.getAttribute('data-text-id') === textElementId
                );
                
                // Jako ostateczność, jeśli textElementId ma format "text-X", spróbuj znaleźć element po indeksie
                if (!textElement && textElementId.startsWith('text-')) {
                    const index = parseInt(textElementId.split('-')[1], 10);
                    if (!isNaN(index) && textElements[index]) {
                        textElement = textElements[index];
                    }
                }
            }

            if (textElement) {
                // Aktualizuj tylko przekazaną współrzędną (x lub y lub obie)
                if (newX !== null) {
                    textElement.setAttribute('x', newX);
                }
                if (newY !== null) {
                    textElement.setAttribute('y', newY);
                }
                
                console.log(`✅ Updated position of ${svgElementId}/${textElementId}: x=${newX !== null ? newX : 'unchanged'}, y=${newY !== null ? newY : 'unchanged'}`);
                
                // Wywołaj event informujący o zmianie pozycji
                const event = new CustomEvent('svg-text-position-updated', {
                    detail: {
                        svgElementId,
                        textElementId,
                        x: newX !== null ? newX : textElement.getAttribute('x'),
                        y: newY !== null ? newY : textElement.getAttribute('y'),
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            } else {
                console.error('Text element not found:', textElementId, 'in', svgElementId);
            }
        } catch (error) {
            console.error('Error updating text position:', error);
        }
    }

    // Aktualizuj właściwości czcionki w elemencie tekstowym SVG
    updateTextFont(svgElementId, textElementId, newFontFamily, newFontSize) {
        try {
            // Sprawdzenie czy svgElementId nie jest pusty
            if (!svgElementId) {
                console.error('Empty SVG element ID provided');
                return;
            }
            
            // Sprawdzenie czy textElementId nie jest pusty
            if (!textElementId) {
                console.error('Empty text element ID provided');
                return;
            }

            const svgElement = document.getElementById(svgElementId);
            if (!svgElement) {
                console.error('SVG element not found:', svgElementId);
                return;
            }

            // Znajdź element text po ID (używając tej samej logiki co w innych metodach)
            let textElement = svgElement.querySelector(`#${textElementId}`);
            
            if (!textElement) {
                const textElements = svgElement.querySelectorAll('text');
                textElement = Array.from(textElements).find(el => 
                    el.id === textElementId || el.getAttribute('data-text-id') === textElementId
                );
                
                if (!textElement && textElementId.startsWith('text-')) {
                    const index = parseInt(textElementId.split('-')[1], 10);
                    if (!isNaN(index) && textElements[index]) {
                        textElement = textElements[index];
                    }
                }
            }

            if (textElement) {
                // Aktualizuj tylko przekazaną właściwość czcionki
                if (newFontFamily !== null && newFontFamily !== undefined) {
                    textElement.setAttribute('font-family', newFontFamily);
                    textElement.style.fontFamily = newFontFamily;
                }
                if (newFontSize !== null && newFontSize !== undefined) {
                    const fontSize = newFontSize.toString();
                    textElement.setAttribute('font-size', fontSize);
                    textElement.style.fontSize = fontSize + 'px';
                }
                
                console.log(`✅ Updated font of ${svgElementId}/${textElementId}: family=${newFontFamily !== null ? newFontFamily : 'unchanged'}, size=${newFontSize !== null ? newFontSize : 'unchanged'}`);
                
                // Wywołaj event informujący o zmianie czcionki
                const event = new CustomEvent('svg-text-font-updated', {
                    detail: {
                        svgElementId,
                        textElementId,
                        fontFamily: newFontFamily !== null ? newFontFamily : textElement.getAttribute('font-family'),
                        fontSize: newFontSize !== null ? newFontSize : textElement.getAttribute('font-size'),
                        timestamp: new Date().toISOString()
                    }
                });
                document.dispatchEvent(event);
            } else {
                console.error('Text element not found:', textElementId, 'in', svgElementId);
            }
        } catch (error) {
            console.error('Error updating text font:', error);
        }
    }

    // Wywołaj event informujący o zmianie tekstu
    dispatchTextUpdateEvent(svgElementId, textElementId, newContent) {
        const event = new CustomEvent('svg-text-updated', {
            detail: {
                svgElementId,
                textElementId,
                newContent,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // Pobierz wszystkie teksty z SVG elementu jako obiekt
    getTextContents(svgElement) {
        const textElements = this.extractTextElements(svgElement);
        const textContents = {};

        textElements.forEach((textEl, index) => {
            const id = textEl.id || `text-${index}`;
            textContents[id] = textEl.textContent || '';
        });

        return textContents;
    }

    // Ustaw wszystkie teksty w SVG elemencie z obiektu
    setTextContents(svgElement, textContents) {
        Object.entries(textContents).forEach(([textId, content]) => {
            this.updateTextContent(svgElement.id, textId, content);
        });
    }
}

// Export dla ES6 modularnego systemu
export { SVGTextManager };

// CommonJS fallback dla kompatybilności
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGTextManager;
}

// Globalny dostęp dla kompatybilności
window.SVGTextManager = SVGTextManager;
