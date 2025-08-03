const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

class LighthouseTestRunner {
    constructor() {
        this.chrome = null;
        this.results = [];
        this.baseUrl = process.env.TARGET_URL || 'http://localhost:8080';
    }

    async setup() {
        console.log('🚀 Starting Lighthouse performance tests...');
        
        this.chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
        });
    }

    async runLighthouseAudit() {
        console.log('⚡ Running Lighthouse audit...');
        
        try {
            const options = {
                logLevel: 'info',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
                port: this.chrome.port,
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1
                }
            };

            const runnerResult = await lighthouse(this.baseUrl, options);
            const report = runnerResult.lhr;

            // Extract key metrics
            const metrics = {
                performance: Math.round(report.categories.performance.score * 100),
                accessibility: Math.round(report.categories.accessibility.score * 100),
                bestPractices: Math.round(report.categories['best-practices'].score * 100),
                seo: Math.round(report.categories.seo.score * 100),
                pwa: Math.round(report.categories.pwa.score * 100),
                
                // Core Web Vitals
                firstContentfulPaint: report.audits['first-contentful-paint'].displayValue,
                largestContentfulPaint: report.audits['largest-contentful-paint'].displayValue,
                cumulativeLayoutShift: report.audits['cumulative-layout-shift'].displayValue,
                totalBlockingTime: report.audits['total-blocking-time'].displayValue,
                speedIndex: report.audits['speed-index'].displayValue,
                
                // PWA specific
                serviceWorker: report.audits['service-worker'].score,
                offlineSupport: report.audits['works-offline'].score,
                installable: report.audits['installable-manifest'].score
            };

            this.addResult('Lighthouse Performance', 
                metrics.performance >= 90 ? 'PASS' : metrics.performance >= 70 ? 'WARN' : 'FAIL',
                `Score: ${metrics.performance}/100`);
                
            this.addResult('Lighthouse Accessibility', 
                metrics.accessibility >= 95 ? 'PASS' : metrics.accessibility >= 80 ? 'WARN' : 'FAIL',
                `Score: ${metrics.accessibility}/100`);
                
            this.addResult('Lighthouse Best Practices', 
                metrics.bestPractices >= 90 ? 'PASS' : metrics.bestPractices >= 70 ? 'WARN' : 'FAIL',
                `Score: ${metrics.bestPractices}/100`);
                
            this.addResult('Lighthouse SEO', 
                metrics.seo >= 90 ? 'PASS' : metrics.seo >= 70 ? 'WARN' : 'FAIL',
                `Score: ${metrics.seo}/100`);
                
            this.addResult('Lighthouse PWA', 
                metrics.pwa >= 90 ? 'PASS' : metrics.pwa >= 70 ? 'WARN' : 'FAIL',
                `Score: ${metrics.pwa}/100`);

            // Check specific failures
            const failedAudits = Object.entries(report.audits)
                .filter(([key, audit]) => audit.score !== null && audit.score < 0.9)
                .map(([key, audit]) => ({ key, title: audit.title, score: audit.score }));

            return { metrics, report, failedAudits };
            
        } catch (error) {
            this.addResult('Lighthouse Audit', 'FAIL', error.message);
            throw error;
        }
    }

    async testCoreWebVitals() {
        console.log('📊 Testing Core Web Vitals...');
        
        try {
            const result = await this.runLighthouseAudit();
            const metrics = result.metrics;
            
            // Core Web Vitals thresholds
            const lcpThreshold = 2500; // ms
            const clsThreshold = 0.1;
            const fidThreshold = 100; // ms (using TBT as proxy)
            
            const lcpValue = parseFloat(result.report.audits['largest-contentful-paint'].numericValue);
            const clsValue = parseFloat(result.report.audits['cumulative-layout-shift'].numericValue);
            const tbtValue = parseFloat(result.report.audits['total-blocking-time'].numericValue);
            
            this.addResult('Core Web Vitals - LCP', 
                lcpValue <= lcpThreshold ? 'PASS' : 'FAIL',
                `${lcpValue}ms (threshold: ${lcpThreshold}ms)`);
                
            this.addResult('Core Web Vitals - CLS', 
                clsValue <= clsThreshold ? 'PASS' : 'FAIL',
                `${clsValue} (threshold: ${clsThreshold})`);
                
            this.addResult('Core Web Vitals - TBT', 
                tbtValue <= fidThreshold ? 'PASS' : 'FAIL',
                `${tbtValue}ms (threshold: ${fidThreshold}ms)`);
                
        } catch (error) {
            this.addResult('Core Web Vitals', 'FAIL', error.message);
        }
    }

    async testPWAFeatures() {
        console.log('📱 Testing PWA features...');
        
        try {
            const result = await this.runLighthouseAudit();
            const report = result.report;
            
            // Check specific PWA audits
            const pwaAudits = {
                'service-worker': 'Service Worker',
                'works-offline': 'Offline Support', 
                'installable-manifest': 'Installable Manifest',
                'splash-screen': 'Splash Screen',
                'themed-omnibox': 'Themed Omnibox',
                'maskable-icon': 'Maskable Icon'
            };
            
            Object.entries(pwaAudits).forEach(([auditKey, auditName]) => {
                const audit = report.audits[auditKey];
                if (audit) {
                    this.addResult(`PWA - ${auditName}`, 
                        audit.score === 1 ? 'PASS' : 'FAIL',
                        audit.explanation || audit.title);
                }
            });
            
        } catch (error) {
            this.addResult('PWA Features', 'FAIL', error.message);
        }
    }

    addResult(testName, status, detail = null) {
        this.results.push({ testName, status, detail, timestamp: new Date().toISOString() });
        const statusIcon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
        console.log(`${statusIcon} ${testName}: ${status}${detail ? ` - ${detail}` : ''}`);
    }

    async generateReport() {
        const report = {
            testSuite: 'Lighthouse Performance & PWA Tests',
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passed: this.results.filter(r => r.status === 'PASS').length,
            warnings: this.results.filter(r => r.status === 'WARN').length,
            failed: this.results.filter(r => r.status === 'FAIL').length,
            results: this.results
        };
        
        await fs.writeFile(
            path.join(__dirname, '../test-results/lighthouse-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        return report;
    }

    async cleanup() {
        if (this.chrome) {
            await chromeLauncher.kill(this.chrome.pid);
        }
    }

    async run() {
        try {
            await this.setup();
            
            await this.runLighthouseAudit();
            await this.testCoreWebVitals();
            await this.testPWAFeatures();
            
            const report = await this.generateReport();
            
            console.log('\n📊 Lighthouse Summary:');
            console.log(`✅ Passed: ${report.passed}`);
            console.log(`⚠️ Warnings: ${report.warnings}`);
            console.log(`❌ Failed: ${report.failed}`);
            console.log(`📄 Report saved to: test-results/lighthouse-report.json`);
            
        } catch (error) {
            console.error('❌ Lighthouse tests failed:', error);
        } finally {
            await this.cleanup();
        }
    }
}

if (require.main === module) {
    const runner = new LighthouseTestRunner();
    runner.run().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('Lighthouse test runner failed:', error);
        process.exit(1);
    });
}

module.exports = LighthouseTestRunner;
