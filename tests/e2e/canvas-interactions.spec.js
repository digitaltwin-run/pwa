// tests/e2e/canvas-interactions.spec.js
import { test, expect } from '@playwright/test';

test.describe('Digital Twin IDE Canvas Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for IDE to load
    await page.waitForSelector('#svg-canvas');
    await page.waitForFunction(() => window.componentManager && window.canvasSelectionManager);
  });

  test('should load IDE with all required managers', async ({ page }) => {
    // Verify core managers are loaded
    const managersLoaded = await page.evaluate(() => {
      return {
        componentManager: !!window.componentManager,
        canvasSelectionManager: !!window.canvasSelectionManager,
        propertiesManager: !!window.propertiesManager,
        canvasPropertiesManager: !!window.canvasPropertiesManager
      };
    });
    
    expect(managersLoaded.componentManager).toBe(true);
    expect(managersLoaded.canvasSelectionManager).toBe(true);
    expect(managersLoaded.propertiesManager).toBe(true);
    expect(managersLoaded.canvasPropertiesManager).toBe(true);
  });

  test('should place component on canvas via drag and drop', async ({ page }) => {
    // Drag LED component from library to canvas
    const ledComponent = page.locator('[data-component="led"]');
    const canvas = page.locator('#svg-canvas');
    
    // Perform drag and drop
    await ledComponent.dragTo(canvas, { 
      targetPosition: { x: 400, y: 300 } 
    });
    
    // Wait for component to appear on canvas
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Verify component was placed
    const placedComponents = await canvas.locator('.draggable-component[data-id]').count();
    expect(placedComponents).toBeGreaterThan(0);
    
    // Verify component has proper attributes
    const component = canvas.locator('.draggable-component[data-id]').first();
    await expect(component).toHaveAttribute('data-id');
    await expect(component).toHaveAttribute('data-svg-url');
    await expect(component).toHaveClass(/draggable-component/);
  });

  test('should select component with mouse click', async ({ page }) => {
    // First place a component
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 400, y: 300 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Click to select component
    const component = page.locator('.draggable-component[data-id]').first();
    await component.click();
    
    // Verify selection state
    await expect(component).toHaveClass(/selected/);
    
    // Verify properties panel shows component properties
    const propertiesPanel = page.locator('.properties-section');
    await expect(propertiesPanel).toContainText('LED');
  });

  test('should support multi-selection with Ctrl+click', async ({ page }) => {
    // Place two components
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 300, y: 200 } }
    );
    
    await page.locator('[data-component="pump"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 500, y: 200 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Select first component
    const firstComponent = page.locator('.draggable-component[data-id]').first();
    await firstComponent.click();
    
    // Ctrl+click second component
    const secondComponent = page.locator('.draggable-component[data-id]').nth(1);
    await secondComponent.click({ modifiers: ['Control'] });
    
    // Verify both are selected
    const selectedComponents = await page.locator('.draggable-component.selected').count();
    expect(selectedComponents).toBe(2);
    
    // Verify multi-selection properties panel
    const propertiesPanel = page.locator('.properties-section');
    await expect(propertiesPanel).toContainText('Zaznaczone komponenty: 2');
  });

  test('should change grid colors in properties panel', async ({ page }) => {
    // Click on canvas to show canvas properties
    await page.locator('#svg-canvas').click({ position: { x: 100, y: 100 } });
    
    // Wait for canvas properties to load
    await page.waitForSelector('[data-testid="canvas-properties"]');
    
    // Change main grid color
    const mainGridColorInput = page.locator('[data-testid="main-grid-color"]');
    await mainGridColorInput.fill('#ff0000');
    
    // Verify grid lines updated
    const gridLines = page.locator('.grid .main-grid-line');
    await expect(gridLines.first()).toHaveAttribute('stroke', '#ff0000');
    
    // Change small grid color
    const smallGridColorInput = page.locator('[data-testid="small-grid-color"]');
    await smallGridColorInput.fill('#00ff00');
    
    // Verify small grid lines updated
    const smallGridLines = page.locator('.grid .small-grid-line');
    await expect(smallGridLines.first()).toHaveAttribute('stroke', '#00ff00');
  });

  test('should change canvas background color', async ({ page }) => {
    // Click on canvas
    await page.locator('#svg-canvas').click({ position: { x: 100, y: 100 } });
    
    // Change background color
    const bgColorInput = page.locator('[data-testid="canvas-background-color"]');
    await bgColorInput.fill('#f0f0f0');
    
    // Verify canvas background updated
    const canvas = page.locator('#svg-canvas');
    await expect(canvas).toHaveCSS('background-color', 'rgb(240, 240, 240)');
  });

  test('should copy and paste components', async ({ page }) => {
    // Place a component
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 400, y: 300 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Select and copy component
    const component = page.locator('.draggable-component[data-id]').first();
    await component.click();
    await page.keyboard.press('Control+c');
    
    // Paste component
    await page.keyboard.press('Control+v');
    
    // Verify two components exist
    const componentCount = await page.locator('.draggable-component[data-id]').count();
    expect(componentCount).toBe(2);
  });

  test('should delete selected components with Delete key', async ({ page }) => {
    // Place components
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 300, y: 200 } }
    );
    
    await page.locator('[data-component="pump"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 500, y: 200 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Select all components
    await page.keyboard.press('Control+a');
    
    // Delete with Delete key
    await page.keyboard.press('Delete');
    
    // Verify components are removed
    const componentCount = await page.locator('.draggable-component[data-id]').count();
    expect(componentCount).toBe(0);
  });

  test('should zoom canvas in and out', async ({ page }) => {
    // Click zoom in button
    const zoomInButton = page.locator('[data-testid="zoom-in"]');
    await zoomInButton.click();
    
    // Verify zoom level increased
    const zoomLevel = await page.locator('[data-testid="zoom-level"]').textContent();
    expect(parseFloat(zoomLevel)).toBeGreaterThan(1.0);
    
    // Click zoom out button
    const zoomOutButton = page.locator('[data-testid="zoom-out"]');
    await zoomOutButton.click();
    await zoomOutButton.click(); // Reset to 100%
    
    // Verify zoom reset
    const resetZoomLevel = await page.locator('[data-testid="zoom-level"]').textContent();
    expect(parseFloat(resetZoomLevel)).toBe(1.0);
  });

  test('should export SVG correctly', async ({ page }) => {
    // Place a component
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 400, y: 300 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Start download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.locator('[data-testid="export-svg"]').click();
    
    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.svg$/);
    
    // Verify download content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test('should show console errors for debugging', async ({ page }) => {
    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Perform actions that might cause errors
    await page.locator('[data-component="led"]').dragTo(
      page.locator('#svg-canvas'), 
      { targetPosition: { x: 400, y: 300 } }
    );
    
    await page.waitForSelector('.draggable-component[data-id]');
    
    // Click component to select
    await page.locator('.draggable-component[data-id]').first().click();
    
    // Wait a bit for any async errors
    await page.waitForTimeout(1000);
    
    // Check for critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('translation') && !error.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
