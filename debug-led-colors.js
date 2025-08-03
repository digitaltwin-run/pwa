// Debug LED Colors - Sprawdzenie dlaczego kolory LED nie działają

console.log('🔍 Debugging LED Colors...');

// 1. Znajdź LED na canvas
const ledElement = document.querySelector('[data-id="comp-2"]') || 
                   document.querySelector('[data-id*="led"]') || 
                   document.querySelector('g:has(.led-core)');

console.log('LED Element:', ledElement);

if (ledElement) {
    // 2. Sprawdź czy ma klasę led-core
    const ledCore = ledElement.querySelector('.led-core');
    console.log('LED Core element:', ledCore);
    console.log('Current fill:', ledCore?.getAttribute('fill'));
    
    // 3. Test ręcznej zmiany koloru
    console.log('🧪 Testing manual color change...');
    if (ledCore) {
        ledCore.setAttribute('fill', '#3498db');
        console.log('✅ Manual color change applied');
    }
    
    // 4. Test przez system updateSvgColor
    console.log('🧪 Testing updateSvgColor...');
    if (window.updateSvgColor) {
        // Najpierw wybierz LED
        if (window.componentManager) {
            window.componentManager.setSelectedComponent({element: ledElement});
        }
        
        // Teraz spróbuj zmienić kolor
        window.updateSvgColor('.led-core', 'fill', '#ff0000');
        console.log('✅ updateSvgColor called with .led-core');
        
        // Sprawdź czy się zmieniło
        setTimeout(() => {
            console.log('New fill after updateSvgColor:', ledCore?.getAttribute('fill'));
        }, 100);
    }
    
    // 5. Sprawdź mapowanie właściwości
    console.log('🗺️ Checking property mapping...');
    if (window.refreshPropertiesMapping) {
        window.refreshPropertiesMapping();
    }
    
} else {
    console.error('❌ LED element not found on canvas');
    console.log('Available elements:', document.querySelectorAll('[data-id]'));
}
