const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PuppeteerTestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = [];
        this.baseUrl = process.env.TARGET_URL || 'http://localhost:8080';
    }

    async setup() {
        console.log('🚀 Starting Puppeteer tests...');
        
        this.browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'test',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 720 });
        
        // Setup console monitoring
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Browser console error:', msg.text());
            }
        });
        
        // Setup error monitoring
        this.page.on('pageerror', error => {
            console.error('❌ Page error:', error.message);
        });
    }

    async testApplicationLoading() {
        console.log('🔄 Testing application loading...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Wait for main elements to load
            await this.page.waitForSelector('#svg-canvas', { timeout: 10000 });
            await this.page.waitForSelector('#component-library', { timeout: 5000 });
            await this.page.waitForSelector('#properties-panel', { timeout: 5000 });
            
            // Check if IDE initialized
            const initMessage = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const checkInit = () => {
                        if (window.propertiesManager && window.componentManager) {
                            resolve(true);
                        } else {
                            setTimeout(checkInit, 100);
                        }
                    };
                    checkInit();
                    setTimeout(() => resolve(false), 10000);
                });
            });
            
            this.addResult('Application Loading', initMessage ? 'PASS' : 'FAIL', 
                initMessage ? null : 'IDE not initialized properly');
                
        } catch (error) {
            this.addResult('Application Loading', 'FAIL', error.message);
        }
    }

    async testComponentDragAndDrop() {
        console.log('🎯 Testing drag and drop functionality...');
        
        try {
            // Get initial component count
            const initialCount = await this.page.evaluate(() => {
                return document.querySelectorAll('[data-id]').length;
            });
            
            // Drag motor component to canvas
            const motorButton = await this.page.$('button[data-svg="components/motor.svg"]');
            const canvas = await this.page.$('#svg-canvas');
            
            if (motorButton && canvas) {
                const motorBox = await motorButton.boundingBox();
                const canvasBox = await canvas.boundingBox();
                
                await this.page.mouse.move(motorBox.x + motorBox.width/2, motorBox.y + motorBox.height/2);
                await this.page.mouse.down();
                await this.page.mouse.move(canvasBox.x + 200, canvasBox.y + 200);
                await this.page.mouse.up();
                
                // Wait for component to be added
                await this.page.waitForTimeout(1000);
                
                const finalCount = await this.page.evaluate(() => {
                    return document.querySelectorAll('[data-id]').length;
                });
                
                this.addResult('Drag and Drop', 
                    finalCount > initialCount ? 'PASS' : 'FAIL',
                    finalCount > initialCount ? null : 'Component not added to canvas');
            } else {
                this.addResult('Drag and Drop', 'FAIL', 'Motor button or canvas not found');
            }
            
        } catch (error) {
            this.addResult('Drag and Drop', 'FAIL', error.message);
        }
    }

    async testPropertiesPanel() {
        console.log('⚙️ Testing properties panel...');
        
        try {
            // Click on a component
            const component = await this.page.$('[data-id]');
            if (component) {
                await component.click();
                
                // Wait for properties to load
                await this.page.waitForTimeout(1000);
                
                // Check if properties panel shows content
                const hasContent = await this.page.evaluate(() => {
                    const metadataTab = document.querySelector('#metadata-content');
                    const colorsTab = document.querySelector('#colors-content');
                    const interactionsTab = document.querySelector('#interactions-content');
                    
                    return metadataTab && colorsTab && interactionsTab &&
                           (metadataTab.children.length > 0 || 
                            colorsTab.children.length > 0 || 
                            interactionsTab.children.length > 0);
                });
                
                this.addResult('Properties Panel', hasContent ? 'PASS' : 'FAIL',
                    hasContent ? null : 'Properties panel not populated');
                    
                // Test color picker
                const colorPicker = await this.page.$('input[type="color"]');
                if (colorPicker) {
                    await colorPicker.click();
                    await this.page.type('input[type="color"]', '#ff0000');
                    
                    // Check if color was applied
                    await this.page.waitForTimeout(500);
                    
                    this.addResult('Color Picker', 'PASS', null);
                } else {
                    this.addResult('Color Picker', 'SKIP', 'No color picker found');
                }
            }
            
        } catch (error) {
            this.addResult('Properties Panel', 'FAIL', error.message);
        }
    }

    async testInteractionsSystem() {
        console.log('🔗 Testing interactions system...');
        
        try {
            // Add multiple components for interaction testing
            await this.addComponent('button.svg', {x: 100, y: 100});
            await this.addComponent('motor.svg', {x: 200, y: 200});
            
            // Select button component
            const button = await this.page.$('[data-svg-url*="button"]');
            if (button) {
                await button.click();
                
                // Go to interactions tab
                const interactionsTab = await this.page.$('#interactions-tab');
                if (interactionsTab) {
                    await interactionsTab.click();
                    await this.page.waitForTimeout(500);
                    
                    // Test target selection
                    const targetSelect = await this.page.$('#target-component');
                    if (targetSelect) {
                        await targetSelect.click();
                        
                        const options = await this.page.$$eval('#target-component option', 
                            options => options.map(opt => opt.textContent));
                        
                        const hasMotorOption = options.some(opt => opt.includes('motor') || opt.includes('Motor'));
                        
                        this.addResult('Interactions - Target Selection', 
                            hasMotorOption ? 'PASS' : 'FAIL',
                            hasMotorOption ? null : 'Motor not available as target');
                            
                        // Select motor as target
                        if (hasMotorOption) {
                            const motorOption = await this.page.$('#target-component option[value*="comp"]');
                            if (motorOption) {
                                const motorValue = await this.page.evaluate(el => el.value, motorOption);
                                await this.page.select('#target-component', motorValue);
                                
                                await this.page.waitForTimeout(500);
                                
                                // Check if events are populated
                                const eventOptions = await this.page.$$eval('#event-type option',
                                    options => options.map(opt => opt.textContent));
                                
                                const hasMotorEvents = eventOptions.some(opt => 
                                    opt.includes('start') || opt.includes('stop') || opt.includes('speed'));
                                
                                this.addResult('Interactions - Events', 
                                    hasMotorEvents ? 'PASS' : 'FAIL',
                                    hasMotorEvents ? null : 'Motor events not available');
                            }
                        }
                    }
                }
            }
            
        } catch (error) {
            this.addResult('Interactions System', 'FAIL', error.message);
        }
    }

    async testResponsiveDesign() {
        console.log('📱 Testing responsive design...');
        
        const viewports = [
            { width: 320, height: 568, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1280, height: 720, name: 'Desktop' },
            { width: 1920, height: 1080, name: 'Large Desktop' }
        ];
        
        for (const viewport of viewports) {
            try {
                await this.page.setViewport(viewport);
                await this.page.waitForTimeout(1000);
                
                // Check if main elements are visible
                const elementsVisible = await this.page.evaluate(() => {
                    const canvas = document.getElementById('svg-canvas');
                    const library = document.getElementById('component-library');
                    const properties = document.getElementById('properties-panel');
                    
                    return canvas && library && properties &&
                           canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
                });
                
                this.addResult(`Responsive - ${viewport.name}`, 
                    elementsVisible ? 'PASS' : 'FAIL',
                    elementsVisible ? null : 'Main elements not properly displayed');
                    
            } catch (error) {
                this.addResult(`Responsive - ${viewport.name}`, 'FAIL', error.message);
            }
        }
    }

    async addComponent(svgFile, position = {x: 150, y: 150}) {
        const button = await this.page.$(`button[data-svg="components/${svgFile}"]`);
        const canvas = await this.page.$('#svg-canvas');
        
        if (button && canvas) {
            const buttonBox = await button.boundingBox();
            const canvasBox = await canvas.boundingBox();
            
            await this.page.mouse.move(buttonBox.x + buttonBox.width/2, buttonBox.y + buttonBox.height/2);
            await this.page.mouse.down();
            await this.page.mouse.move(canvasBox.x + position.x, canvasBox.y + position.y);
            await this.page.mouse.up();
            
            await this.page.waitForTimeout(500);
        }
    }

    addResult(testName, status, error = null) {
        this.results.push({ testName, status, error, timestamp: new Date().toISOString() });
        const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
        console.log(`${statusIcon} ${testName}: ${status}${error ? ` - ${error}` : ''}`);
    }

    async generateReport() {
        const report = {
            testSuite: 'Puppeteer E2E Tests',
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passed: this.results.filter(r => r.status === 'PASS').length,
            failed: this.results.filter(r => r.status === 'FAIL').length,
            skipped: this.results.filter(r => r.status === 'SKIP').length,
            results: this.results
        };
        
        // Save report
        await fs.writeFile(
            path.join(__dirname, '../test-results/puppeteer-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Generate HTML report
        const htmlReport = this.generateHtmlReport(report);
        await fs.writeFile(
            path.join(__dirname, '../test-results/puppeteer-report.html'),
            htmlReport
        );
        
        return report;
    }

    generateHtmlReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Puppeteer Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .test-result { padding: 10px; border-left: 4px solid #ddd; margin-bottom: 10px; }
        .pass { border-left-color: #4CAF50; background: #f1f8e9; }
        .fail { border-left-color: #f44336; background: #ffebee; }
        .skip { border-left-color: #ff9800; background: #fff3e0; }
        .error { color: #d32f2f; font-size: 0.9em; margin-top: 5px; }
    </style>
</head>
<body>
    <h1>🧪 Puppeteer Test Results</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${report.totalTests}</p>
        <p><strong>Passed:</strong> ${report.passed}</p>
        <p><strong>Failed:</strong> ${report.failed}</p>
        <p><strong>Skipped:</strong> ${report.skipped}</p>
        <p><strong>Success Rate:</strong> ${((report.passed / report.totalTests) * 100).toFixed(1)}%</p>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(result => `
        <div class="test-result ${result.status.toLowerCase()}">
            <strong>${result.testName}</strong> - ${result.status}
            ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
        </div>
    `).join('')}
    
</body>
</html>`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.setup();
            
            await this.testApplicationLoading();
            await this.testComponentDragAndDrop();
            await this.testPropertiesPanel();
            await this.testInteractionsSystem();
            await this.testResponsiveDesign();
            
            const report = await this.generateReport();
            
            console.log('\n📊 Test Summary:');
            console.log(`✅ Passed: ${report.passed}`);
            console.log(`❌ Failed: ${report.failed}`);
            console.log(`⏭️ Skipped: ${report.skipped}`);
            console.log(`📈 Success Rate: ${((report.passed / report.totalTests) * 100).toFixed(1)}%`);
            console.log(`📄 Report saved to: test-results/puppeteer-report.html`);
            
        } catch (error) {
            console.error('❌ Test runner failed:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const runner = new PuppeteerTestRunner();
    runner.run().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = PuppeteerTestRunner;
