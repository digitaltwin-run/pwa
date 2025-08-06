// Bezpośredni loader komponentów - bez cache issues
(async function loadComponentsNow() {
    console.log('🔧 Direct component loader starting...');
    
    // Znajdź element lewej kolumny
    const componentLibrary = document.getElementById('component-library');
    if (!componentLibrary) {
        console.error('Component library element not found!');
        return;
    }
    
    try {
        // Załaduj komponenty z components.json
        const response = await fetch('/components.json?t=' + Date.now());
        const data = await response.json();
        
        if (data.components && Array.isArray(data.components)) {
            console.log(`📦 Loaded ${data.components.length} components`);
            
            // Wyczyść "Loading components..."
            componentLibrary.innerHTML = '';
            
            // Stwórz listę komponentów
            const componentsList = document.createElement('div');
            componentsList.className = 'direct-components-list';
            componentsList.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 10px;
            `;
            
            data.components.forEach(component => {
                const item = document.createElement('div');
                item.className = 'direct-component-item';
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 13px;
                `;
                
                // Określ ikonę
                const type = component.svg ? component.svg.split('/').pop().replace('.svg', '').toLowerCase() : 'unknown';
                const iconMap = {
                    'gauge': '📊', 'led': '💡', 'pump': '⚙️', 'valve': '🔧', 
                    'motor': '🔄', 'display': '📺', 'button': '🔘', 'counter': '🔢',
                    'relay': '⚡', 'sensor': '🌡️', 'switch': '🔀', 'toggle': '⏬',
                    'slider': '🎚️', 'knob': '🎛️'
                };
                const icon = iconMap[type] || '🔧';
                
                item.innerHTML = `
                    <span style="font-size: 16px;">${icon}</span>
                    <span style="flex: 1; color: #333; font-weight: 500;">${component.name}</span>
                    <span style="font-size: 12px; color: #999;">➕</span>
                `;
                
                // Hover effect
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#f5f5f5';
                    item.style.transform = 'translateX(2px)';
                });
                
                item.addEventListener('mouseleave', () => {
                    item.style.background = 'white';
                    item.style.transform = 'translateX(0)';
                });
                
                // Click to add component
                item.addEventListener('click', () => {
                    console.log(`Adding component: ${component.name}`);
                    
                    // Show notification
                    const notification = document.createElement('div');
                    notification.textContent = `Kliknięto: ${component.name}`;
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
                    setTimeout(() => notification.remove(), 2000);
                });
                
                // Drag support
                item.draggable = true;
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'component-template',
                        id: component.id,
                        name: component.name,
                        svg: component.svg
                    }));
                    item.style.opacity = '0.5';
                });
                
                item.addEventListener('dragend', () => {
                    item.style.opacity = '1';
                });
                
                componentsList.appendChild(item);
            });
            
            componentLibrary.appendChild(componentsList);
            console.log(`✅ Rendered ${data.components.length} components successfully!`);
            
        } else {
            throw new Error('Invalid components.json format');
        }
    } catch (error) {
        console.error('❌ Error loading components:', error);
        componentLibrary.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                <p>❌ Błąd ładowania komponentów</p>
                <small>${error.message}</small>
            </div>
        `;
    }
})();
