# 🚀 Digital Twin PWA - Advanced SVG IDE

A progressive web application for creating and simulating digital twins using interactive SVG components. Now with comprehensive automation, Docker support, and advanced testing capabilities.

## ✨ Key Features

### 🎨 Visual Component Design
- **Drag & Drop Interface** - Intuitive component placement
- **SVG Component Library** - Pre-built industrial components (motors, buttons, LEDs, switches, gauges, sensors)
- **Real-time Visual Feedback** - Instant component updates and interactions
- **Responsive Canvas** - Scalable design workspace
- **Color Management System** - CSS-class based theming with automatic property extraction

### ⚙️ Smart Property Management
- **Automatic Property Mapping** - Heuristic SVG metadata extraction
- **Dynamic Type Detection** - Intelligent component type recognition
- **Interactive Property Panels** - Real-time component configuration
- **Variable System** - Automatic extraction for interaction bindings

### 🔗 Advanced Interaction System
- **Component Interactions** - Define complex relationships between components
- **Event-driven Architecture** - Trigger-based component communication
- **Property Binding** - Dynamic value connections with type validation
- **Simulation Ready** - Real-time interaction testing and debugging

### 🧪 Comprehensive Testing Suite
- **E2E Testing** - Puppeteer-based automated browser testing
- **Performance Auditing** - Lighthouse integration for PWA validation
- **Accessibility Testing** - WCAG compliance verification
- **Visual Regression Testing** - Screenshot comparison and validation
- **Docker Testing Environment** - Isolated, reproducible test execution

### 📱 PWA Features (In Development)
- **Offline Mode** - Service Worker with intelligent caching strategies
- **Push Notifications** - Real-time updates and collaboration alerts
- **App Installation** - Native app-like experience
- **Background Sync** - Offline data synchronization

### 🌐 Collaboration Features (Planned)
- **Real-time Collaboration** - WebSocket-based multi-user editing
- **WebRTC Integration** - Peer-to-peer communication
- **Version Control** - Change tracking and conflict resolution
- **Team Workspaces** - Shared project environments

### 🌍 Internationalization (Planned)
- **Multi-language Support** - i18next integration
- **Dynamic Language Switching** - Runtime language changes
- **Localized Components** - Culturally appropriate UI elements
- **RTL Support** - Right-to-left language compatibility

## 🚀 Quick Start

### Using Makefile (Recommended)
```bash
# Show all available commands
make help

# Initial setup
make setup

# Start development server
make dev

# Run all tests
make test

# Docker environment
make docker-up
```

### Manual Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

### Prerequisites
- **Node.js 18+** - For build tools and testing
- **Docker & Docker Compose** - For containerized testing (optional)
- **Modern Browser** - Chrome, Firefox, Safari, Edge with ES6+ support

## 🧪 Testing & Quality Assurance

### Test Types
- **Unit Tests** - Individual component and function testing
- **Integration Tests** - Module interaction and data flow testing
- **E2E Tests** - Full user journey automation with Puppeteer
- **Performance Tests** - Lighthouse auditing and Core Web Vitals
- **Accessibility Tests** - WCAG compliance and screen reader compatibility
- **Visual Regression Tests** - UI consistency validation

### Running Tests
```bash
# All tests
make test

# Specific test types
make test-e2e           # End-to-end browser tests
make test-lighthouse    # Performance and PWA audit
make test-accessibility # WCAG compliance check
make test-docker        # Tests in Docker environment

# Development
make test-watch         # Watch mode for development
make test-coverage      # Coverage reporting
```

### Test Reports
Generated reports available in `test-results/`:
- **Coverage Report** - `coverage/index.html`
- **Lighthouse Audit** - `lighthouse-report.html`
- **E2E Test Results** - `puppeteer-report.html`
- **Accessibility Report** - `accessibility-report.html`

## 🐳 Docker Development

### Docker Services
- **digitaltwin-app** - Main application server
- **test-runner** - Automated testing environment
- **selenium-chrome** - Browser automation for E2E tests
- **nginx** - Production-ready web server

### Docker Commands
```bash
# Build and start all services
make docker-up

# Run tests in containerized environment
make docker-test

# View logs
make docker-logs

# Clean up
make docker-down
```

## 📊 Code Quality & Automation

### Quality Tools
- **ESLint** - JavaScript linting and style enforcement
- **Prettier** - Code formatting and consistency
- **Jest** - Unit and integration testing framework
- **Lighthouse** - Performance and PWA auditing
- **Axe-core** - Accessibility testing

### Automation Commands
```bash
# Code quality
make lint               # Run ESLint
make format             # Format with Prettier
make validate           # Project structure validation

# Reports and analysis
make report             # Comprehensive test report
make lighthouse         # Performance audit
make bundle-analysis    # Bundle size analysis

# Utilities
make debug              # System information
make health-check       # Application health status
make backup             # Create project backup
```

## 🏗️ Architecture

### Core System
- **`app.js`** - Main application initialization and module coordination
- **`properties-core.js`** - Central properties management system
- **`properties-mapper.js`** - Automatic SVG property extraction and heuristic mapping
- **`properties-colors.js`** - Advanced color management with CSS class targeting
- **`properties-metadata.js`** - Metadata processing and validation
- **`properties-interactions.js`** - Component interaction definitions and event handling
- **`dragdrop.js`** - Advanced drag and drop with collision detection
- **`components.js`** - Component library management and loading

### Testing Infrastructure
- **`tests/puppeteer-tests.js`** - E2E testing with virtual browser
- **`tests/lighthouse-tests.js`** - Performance and PWA auditing
- **`tests/functional-tests.js`** - Automated functional validation
- **`tests/ui-tests.html`** - Interactive visual testing interface

### Development Tools
- **`Makefile`** - Unified project automation and command interface
- **`Dockerfile` & `docker-compose.yml`** - Containerized development and testing
- **`package.json`** - NPM scripts and dependency management

## 📚 Documentation

- **[Testing Guide](docs/TESTING_GUIDE.md)** - Comprehensive testing documentation
- **[API Documentation](docs/API.md)** - Developer API reference
- **[Component Guide](docs/COMPONENTS.md)** - Component creation and customization
- **[Docker Guide](docs/DOCKER.md)** - Container setup and deployment
- **[PWA Guide](docs/PWA.md)** - Progressive Web App features
- **[Collaboration Guide](docs/COLLABORATION.md)** - Real-time features

## 🛠️ Technology Stack

### Frontend
- **JavaScript ES6+** - Modern JavaScript with modules
- **HTML5 & CSS3** - Semantic markup and modern styling
- **SVG** - Scalable vector graphics with embedded metadata
- **Service Worker** - PWA capabilities and offline support

### Testing & Automation
- **Puppeteer** - Headless browser automation
- **Jest** - Testing framework with coverage
- **Lighthouse** - Performance and PWA auditing
- **Docker** - Containerized development and testing
- **Make** - Build automation and task running

### Development Tools
- **ESLint + Prettier** - Code quality and formatting
- **Nodemon** - Development server with hot reload
- **Git Hooks** - Pre-commit validation
- **NPM Scripts** - Task automation and dependency management

## 🔧 Configuration

### Application Config (`config.json`)
```json
{
  "canvas": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#ffffff"
  },
  "appearance": {
    "theme": "default",
    "componentOutlineColor": "#007bff"
  },
  "testing": {
    "enabled": true,
    "autoRun": false
  }
}
```

### Environment Variables
```bash
NODE_ENV=development     # Enable development features
TESTING_MODE=true        # Enable testing tools
TARGET_URL=http://localhost:8080  # Test target URL
```

## 🚀 Deployment

### Staging Deployment
```bash
make deploy-staging
```

### Production Deployment
```bash
make deploy-prod        # Includes confirmation prompt
```

### CI/CD Integration
```bash
# CI pipeline commands
make ci-setup           # Setup CI environment
make ci-test            # Run CI test suite
make ci-build           # Build and validate
```

## 🤝 Contributing

### Development Workflow
1. **Fork** the repository
2. **Setup** development environment: `make setup`
3. **Create** feature branch: `git checkout -b feature/amazing-feature`
4. **Develop** with tests: `make test-watch`
5. **Validate** code quality: `make lint && make test`
6. **Submit** pull request with comprehensive description

### Code Standards
- **ESLint** configuration for consistent code style
- **Test coverage** minimum 80% for new features
- **Documentation** updates for all public APIs
- **Accessibility** compliance (WCAG 2.1 Level AA)

## 📈 Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 90+ / 100
- **Accessibility**: 95+ / 100
- **Best Practices**: 90+ / 100
- **SEO**: 90+ / 100
- **PWA**: 90+ / 100

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **FID** (First Input Delay): < 100ms

## 🎯 Roadmap

### 🔧 Core Features (In Progress)
- [x] **Automated Testing Suite** - Comprehensive test coverage
- [x] **Docker Development Environment** - Containerized workflow
- [x] **Advanced Property Mapping** - Heuristic SVG analysis
- [ ] **PWA Implementation** - Offline mode and push notifications
- [ ] **Real-time Collaboration** - WebSocket-based multi-user editing
- [ ] **Internationalization** - Multi-language support

### 🚀 Advanced Features (Planned)
- [ ] **Physics Simulation** - Realistic component behavior
- [ ] **Cloud Integration** - Save and sync projects
- [ ] **Mobile Optimization** - Touch-friendly interface
- [ ] **Component Marketplace** - Community component sharing
- [ ] **Code Generation** - Export to various platforms
- [ ] **Advanced Analytics** - Usage tracking and insights

### 🎨 UX Enhancements (Future)
- [ ] **Dark Mode Theme** - Alternative visual theme
- [ ] **Accessibility Improvements** - Enhanced screen reader support
- [ ] **Keyboard Shortcuts** - Power user productivity features
- [ ] **Context Menus** - Right-click functionality
- [ ] **Undo/Redo System** - Action history management

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🎉 Getting Started Today

```bash
# Quick start in 3 commands
make setup              # Install and configure
make dev                # Start development server
make test               # Verify everything works
```

**🌐 Open `http://localhost:8080` and start building your digital twin!**

*Built with ❤️ for the future of digital twin technology*

---

### 📞 Support & Community

- **Issues**: GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for questions and ideas
- **Documentation**: `/docs/` directory for detailed guides
- **Testing**: `make test` for comprehensive validation
