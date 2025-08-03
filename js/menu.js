// Menu Interactions
class MenuManager {
    constructor() {
        this.simulationPanel = document.getElementById('simulation-panel');
        this.simulationMenuBtn = document.getElementById('simulation-menu');
        this.closeSimPanelBtn = document.getElementById('close-sim-panel');
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Toggle simulation panel when clicking the Simulation menu item
        if (this.simulationMenuBtn) {
            this.simulationMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSimulationPanel();
            });
        }

        // Close simulation panel when clicking the close button
        if (this.closeSimPanelBtn) {
            this.closeSimPanelBtn.addEventListener('click', () => {
                this.hideSimulationPanel();
            });
        }

        // Close panel when clicking outside of it
        document.addEventListener('click', (e) => {
            if (this.simulationPanel && this.simulationPanel.style.display === 'block') {
                const isClickInside = this.simulationPanel.contains(e.target);
                const isMenuButton = this.simulationMenuBtn && this.simulationMenuBtn.contains(e.target);
                
                if (!isClickInside && !isMenuButton) {
                    this.hideSimulationPanel();
                }
            }
        });
    }

    toggleSimulationPanel() {
        if (this.simulationPanel.style.display === 'block') {
            this.hideSimulationPanel();
        } else {
            this.showSimulationPanel();
        }
    }

    showSimulationPanel() {
        if (this.simulationPanel) {
            this.simulationPanel.style.display = 'block';
            // Add active class to menu item
            if (this.simulationMenuBtn) {
                this.simulationMenuBtn.classList.add('active');
            }
        }
    }

    hideSimulationPanel() {
        if (this.simulationPanel) {
            this.simulationPanel.style.display = 'none';
            // Remove active class from menu item
            if (this.simulationMenuBtn) {
                this.simulationMenuBtn.classList.remove('active');
            }
        }
    }
}

// Initialize menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on a page with the menu
    if (document.getElementById('simulation-menu')) {
        window.menuManager = new MenuManager();
    }
});
