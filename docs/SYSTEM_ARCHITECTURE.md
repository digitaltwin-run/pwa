# 🏗️ Digital Twin PWA - System Architecture & Component Specification

## 📋 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Component Specifications](#-component-specifications) 
3. [Data Flow & Operation Principles](#-data-flow--operation-principles)
4. [Module Dependencies](#-module-dependencies)
5. [Event System](#-event-system)

---

## 🏗️ System Architecture

### High-Level Architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    🌐 Digital Twin PWA Architecture                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   🎨 Frontend    │    │  ⚙️ Core Engine  │    │  📡 Services     │        │
│  │                 │    │                 │    │                 │        │
│  │ • Canvas UI     │◄──►│ • App Manager   │◄──►│ • PWA Manager   │        │
│  │ • Properties    │    │ • ComponentMgr  │    │ • Collaboration │        │
│  │ • Interactions  │    │ • DragDrop      │    │ • I18N Manager  │        │
│  │ • Library       │    │ • PropertiesMgr │    │ • Export/Import │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│           │                       │                       │                │
│           └───────────────────────┼───────────────────────┘                │
│                                   │                                        │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐  │
│  │                    📊 Data Layer                                      │  │
│  │                                 │                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │ Components  │  │ Metadata    │  │ Interactions│  │ Properties  │   │  │
│  │  │ Library     │  │ Storage     │  │ Bindings    │  │ Mapping     │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Module Structure (ASCII)

```
🎯 DigitalTwinApp (Main Controller)
│
├── 🎨 UI Layer
│   ├── ComponentLibrary ──── Displays available SVG components
│   ├── SVGCanvas ─────────── Interactive drawing workspace
│   ├── PropertiesPanel ──── Component configuration interface
│   └── InteractionsPanel ── Event/action binding interface
│
├── ⚙️ Core Managers
│   ├── ComponentManager ──── Component lifecycle & storage
│   ├── DragDropManager ───── Drag & drop functionality
│   ├── PropertiesManager ─── Property mapping & updates
│   ├── InteractionsManager ─ Event binding & simulation
│   ├── ComponentScaler ───── Zoom/scale functionality
│   └── GridManager ──────── Canvas grid & snapping
│
├── 📡 Service Layer
│   ├── PWAManager ────────── Service Worker, notifications
│   ├── CollaborationMgr ──── Real-time multi-user features
│   ├── I18nManager ───────── Internationalization
│   └── ExportManager ────── Project import/export
│
└── 🔧 Utilities
    ├── PropertiesMapper ──── SVG metadata extraction
    ├── MetadataManager ───── Component metadata handling
    ├── ColorManager ────── CSS class-based color theming
    └── ConnectionManager ── Component interconnections
```

### Data Flow Architecture (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           📊 Data Flow Diagram                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User Action ──────┐                                                       │
│                    │                                                       │
│                    ▼                                                       │
│  ┌─────────────────────────────────────────┐                              │
│  │            🎯 Event Handler             │                              │
│  │  • Click, Drag, Input, Selection        │                              │
│  └─────────────────┬───────────────────────┘                              │
│                    │                                                       │
│                    ▼                                                       │
│  ┌─────────────────────────────────────────┐                              │
│  │         ⚙️ Component Manager            │                              │
│  │  • Validate action                      │                              │
│  │  • Update component data                │                              │
│  │  • Trigger side effects                 │                              │
│  └─────────────────┬───────────────────────┘                              │
│                    │                                                       │
│          ┌─────────┼─────────┐                                             │
│          ▼         ▼         ▼                                             │
│  ┌─────────────┐ ┌───────┐ ┌─────────────┐                                │
│  │ 📊 Data     │ │ 🎨 UI │ │ 📡 Services │                                │
│  │ • Metadata  │ │ • DOM │ │ • PWA       │                                │
│  │ • Storage   │ │ • CSS │ │ • Collab    │                                │
│  │ • State     │ │ • SVG │ │ • Export    │                                │
│  └─────────────┘ └───────┘ └─────────────┘                                │
│          │         │         │                                             │
│          └─────────┼─────────┘                                             │
│                    │                                                       │
│                    ▼                                                       │
│  ┌─────────────────────────────────────────┐                              │
│  │            🔄 State Update              │                              │
│  │  • Visual feedback                      │                              │
│  │  • Property panel refresh               │                              │
│  │  • Canvas re-render                     │                              │
│  └─────────────────────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Specifications

### Available SVG Components

| Component | Type | Icon | Properties | Events | Use Cases |
|-----------|------|------|------------|--------|-----------|
| **Button** | Input | 🔘 | color, label, isPressed | click, press, release | User interactions, controls |
| **LED** | Output | 💡 | color, isOn, brightness, isBlinking | on, off, blink | Status indicators, alarms |
| **Switch** | Input | 🔄 | isOn, label, switchType | toggle, on, off, change | Binary state control |
| **Motor** | Actuator | ⚙️ | speed, direction, isRunning | start, stop, speedChange | Motion control, automation |
| **Sensor** | Input | 📡 | value, unit, threshold, isActive | change, threshold, alert | Data monitoring, feedback |
| **Gauge** | Display | 📊 | value, min, max, unit, label | change, min, max | Measurement display |
| **Display** | Output | 📺 | text, backgroundColor, textColor | change, update, clear | Information output |
| **Slider** | Input | 🎚️ | value, min, max, step | change, min, max | Continuous value input |
| **Knob** | Input | 🎛️ | value, min, max, angle | change, rotate | Rotary control input |
| **Relay** | Switch | 🔌 | isOn, voltage, current | on, off, toggle | Electrical switching |
| **Valve** | Control | 🚰 | isOpen, flowRate, pressure | open, close, change | Fluid control systems |
| **Tank** | Container | 🪣 | level, capacity, fluid | fill, empty, overflow | Storage visualization |
| **Pipe** | Connector | 🔗 | flowRate, pressure, diameter | flow, pressure, block | System connections |

### Component Property Types

```
📋 Property Type System:
│
├── 🔤 String Properties
│   ├── label ────────── Display text
│   ├── unit ─────────── Measurement unit
│   └── description ──── Component description
│
├── 🔢 Numeric Properties  
│   ├── value ────────── Current value
│   ├── min/max ──────── Value bounds
│   ├── step ─────────── Increment size
│   └── threshold ────── Alert level
│
├── 🎨 Visual Properties
│   ├── color ────────── Primary color
│   ├── backgroundColor ─ Background color
│   ├── borderColor ──── Border color
│   └── opacity ──────── Transparency
│
├── ✅ Boolean Properties
│   ├── isOn ─────────── Power/active state
│   ├── isVisible ────── Display visibility
│   ├── isEnabled ────── Interaction enabled
│   └── isBlinking ───── Animation state
│
└── 📐 Transform Properties
    ├── x, y ─────────── Position coordinates
    ├── width, height ── Dimensions
    ├── scale ────────── Zoom factor (0.1-5.0)
    └── rotation ────── Angle in degrees
```

### Component Events System

```
🎯 Event Categories:
│
├── 🖱️ User Events
│   ├── click ────────── Mouse click
│   ├── hover ────────── Mouse over
│   ├── drag ─────────── Drag operation
│   └── select ───────── Component selection
│
├── 📊 State Events
│   ├── change ───────── Value modification
│   ├── on/off ───────── Binary state change
│   ├── min/max ──────── Threshold reached
│   └── error ────────── Error condition
│
├── ⏱️ Timing Events
│   ├── start ────────── Operation begins
│   ├── stop ─────────── Operation ends
│   ├── timeout ──────── Time limit exceeded
│   └── interval ────── Periodic trigger
│
└── 🔗 System Events
    ├── connected ────── Component linked
    ├── disconnected ── Link broken  
    ├── updated ──────── Data refreshed
    └── ready ────────── Initialization complete
```

---

## 🔄 Data Flow & Operation Principles

### 1. Application Initialization Flow

```
🚀 Application Startup Sequence:
│
1. ⚙️ DigitalTwinApp.init()
   │
   ├── 📋 Load configuration (config.json)
   ├── 🏗️ Initialize GridManager
   ├── 📦 Create core managers:
   │   ├── ComponentManager
   │   ├── DragDropManager  
   │   ├── PropertiesManager
   │   ├── InteractionsManager
   │   ├── ComponentScaler
   │   └── ExportManager
   │
2. 🌐 Initialize services:
   │   ├── PWAManager (Service Worker)
   │   ├── CollaborationManager (WebSocket)
   │   └── I18nManager (Translations)
   │
3. 📚 Load component library:
   │   ├── Fetch components.json
   │   ├── Parse SVG metadata
   │   ├── Extract properties/events
   │   └── Populate UI library
   │
4. 🎨 Setup user interface:
   │   ├── Initialize canvas
   │   ├── Setup event listeners
   │   ├── Configure properties panel
   │   └── Enable drag & drop
   │
5. ✅ Application ready
```

### 2. Component Lifecycle

```
📦 Component Lifecycle:
│
┌─────────────────┐
│   📁 Library    │ ──── User selects component
│   Component     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   🎯 Drag       │ ──── User drags to canvas
│   Operation     │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   🏗️ Create     │ ──── Generate unique ID
│   Instance      │      Parse metadata
│                 │      Apply position
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   📊 Register   │ ──── Add to ComponentManager
│   Component     │      Enable interactions
│                 │      Setup event listeners
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   🎨 Render     │ ──── Add to SVG canvas
│   on Canvas     │      Apply styling
│                 │      Enable selection
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   ⚡ Active     │ ──── Ready for user interaction
│   Component     │      Properties configurable
│                 │      Events can be bound
└─────────────────┘
```

### 3. Property Management Flow

```
⚙️ Property Management System:
│
User Interaction ────┐
                     │
                     ▼
┌─────────────────────────────────────┐
│        🎛️ Properties Panel         │
│  • Component selected               │
│  • Properties extracted from SVG   │
│  • UI controls generated           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       📊 PropertiesManager         │
│  • Input validation                 │
│  • Type conversion                  │
│  • Update component data            │
└─────────────────┬───────────────────┘
                  │
          ┌───────┼───────┐
          ▼       ▼       ▼
┌─────────────┐ ┌───────┐ ┌─────────────┐
│ 🎨 Visual   │ │ 📋 SVG│ │ 💾 Storage  │
│ Update      │ │ Attrs │ │ Metadata    │
│ • Colors    │ │ • x,y │ │ • JSON      │
│ • Styles    │ │ • size│ │ • LocalData │
└─────────────┘ └───────┘ └─────────────┘
          │       │       │
          └───────┼───────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         🔄 Canvas Update           │
│  • DOM manipulation                │
│  • Style recalculation             │
│  • Event re-binding                │
└─────────────────────────────────────┘
```

### 4. Scaling/Zoom Operation

```
🔍 Component Scaling Process:
│
User Input ──────┐ (Slider, Input, Buttons)
                 │
                 ▼
┌─────────────────────────────────────┐
│       📐 ComponentScaler           │
│  • Validate scale value (10%-500%) │
│  • Clamp to safe bounds            │
│  • Parse existing transform        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      🎯 Transform Update           │
│  • Modify SVG transform attribute  │
│  • Preserve other transformations  │
│  • Update: transform="scale(X)"    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      💾 Metadata Storage           │
│  • Save scale in component data    │
│  • Update properties panel         │
│  • Trigger visual feedback         │
└─────────────────────────────────────┘
                  │
                  ▼
         🎨 Visual Result:
         • Component scaled with aspect ratio preserved
         • Live dimension feedback in properties
         • Smooth visual transition
```

### 5. Interaction System Flow

```
🔗 Component Interaction System:
│
Component A ──────┐
(Source)          │
                  ▼
┌─────────────────────────────────────┐
│     🎯 Event Trigger               │
│  • User action (click, change...)  │
│  • System event (timer, sensor...) │
│  • External trigger (API, sync...) │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│    ⚡ InteractionsManager          │
│  • Match event to bindings         │
│  • Validate conditions             │
│  • Execute action mappings         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      🎭 Action Execution           │
│  • Property updates                │
│  • Visual state changes            │
│  • Cascade effects                 │
└─────────────────┬───────────────────┘
                  │
                  ▼
Component B ──────┘
(Target)

Example: Button Click → LED On
button.click → led.isOn = true → LED visual update
```

---

## 🔧 Module Dependencies

### Dependency Graph (ASCII)

```
📦 Module Dependency Tree:
│
🎯 DigitalTwinApp (Root)
│
├── Required Dependencies:
│   ├── 📦 ComponentManager ─── Core component lifecycle
│   ├── 🎨 DragDropManager ──── Canvas interactions
│   ├── ⚙️ PropertiesManager ── Property handling
│   └── 🔗 InteractionsManager  Event bindings
│
├── Optional Services:
│   ├── 🔍 ComponentScaler ──── Zoom functionality
│   ├── 📡 PWAManager ───────── Offline features
│   ├── 🌐 CollaborationMgr ──── Multi-user support
│   ├── 🌍 I18nManager ──────── Internationalization
│   └── 📤 ExportManager ────── Project save/load
│
└── Utility Modules:
    ├── 🗺️ PropertiesMapper ──── SVG metadata extraction
    ├── 📋 MetadataManager ───── Component data handling
    ├── 🎨 ColorManager ──────── Theme & styling
    ├── 🔗 ConnectionManager ──── Component linking
    └── 📐 GridManager ────────── Canvas grid system
```

### Import Structure

```javascript
// 🎯 Main Application
import { DigitalTwinApp } from './app.js';

// ⚙️ Core Managers
import { ComponentManager } from './components.js';
import { DragDropManager } from './dragdrop.js';
import { PropertiesManager } from './properties-core.js';
import { InteractionsManager } from './interactions.js';
import { ComponentScaler } from './component-scaler.js';

// 📡 Services
import { PWAManager } from './pwa-manager.js';
import { CollaborationManager } from './collaboration-manager.js';
import { I18nManager } from './i18n-manager.js';
import { ExportManager } from './export.js';

// 🔧 Utilities
import { PropertiesMapper } from './properties-mapper.js';
import { MetadataManager } from './properties-metadata.js';
import { ColorManager } from './properties-colors.js';
import { GridManager } from './grid.js';
```

---

## ⚡ Event System

### Event Flow Architecture

```
🎯 Event System Overview:
│
┌─────────────────────────────────────────────────────────────┐
│                     Event Sources                          │
├─────────────────────────────────────────────────────────────┤
│  👆 User Actions    📊 System Events    🌐 External APIs   │
│  • Mouse clicks    • Value changes     • WebSocket msgs    │
│  • Keyboard input  • State updates     • HTTP responses    │
│  • Touch gestures  • Timer events      • Service workers   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Event Processing                           │
├─────────────────────────────────────────────────────────────┤
│  🎯 Event Router                                           │
│  • Capture events                                          │
│  • Identify source component                               │
│  • Route to appropriate handler                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                Action Handlers                             │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ Component Updates   🎨 Visual Changes   💾 Data Sync   │
│  • Property changes    • Color updates     • Local storage │
│  • State transitions   • Animation         • Server sync   │
│  • Metadata updates    • Style refresh     • Backup save   │
└─────────────────────────────────────────────────────────────┘
```

### Event Categories & Examples

| Category | Event Type | Source | Target | Example |
|----------|------------|--------|--------|---------|
| **User** | click | Button | LED | Button click → LED on |
| **User** | drag | Component | Canvas | Move component position |
| **User** | input | Slider | Motor | Slider change → Motor speed |
| **System** | change | Sensor | Display | Sensor value → Display update |
| **System** | threshold | Gauge | Alarm | Gauge max → Alarm trigger |
| **System** | timer | Scheduler | Components | Timer → Blink animation |
| **Network** | sync | Collaboration | Canvas | Remote user → Local update |
| **Network** | message | WebSocket | UI | Server → Status notification |

---

## 🔧 System Configuration

### Application Configuration Structure

```json
{
  "canvas": {
    "width": 1200,
    "height": 800,
    "backgroundColor": "#ffffff",
    "grid": {
      "enabled": true,
      "size": 5,
      "color": "#e0e0e0",
      "snapToGrid": true
    }
  },
  "components": {
    "defaultScale": 1.0,
    "minScale": 0.1,
    "maxScale": 5.0,
    "autoSave": true,
    "animationDuration": 300
  },
  "collaboration": {
    "enabled": true,
    "websocketUrl": "ws://localhost:8080",
    "maxUsers": 10,
    "autoReconnect": true
  },
  "pwa": {
    "offlineMode": true,
    "pushNotifications": false,
    "backgroundSync": true,
    "updatePrompt": true
  }
}
```

---

## 📊 Performance Characteristics

### System Metrics

| Metric | Target | Current | Notes |
|--------|--------|---------|--------|
| **Component Load Time** | <100ms | ~50ms | SVG parsing + rendering |
| **Property Update** | <16ms | ~8ms | 60fps smooth updates |
| **Drag Response** | <16ms | ~10ms | Real-time positioning |
| **Scale Operation** | <50ms | ~20ms | Transform calculation |
| **Canvas Render** | <100ms | ~60ms | Full canvas redraw |
| **Memory Usage** | <50MB | ~35MB | Component instances |
| **Network Sync** | <200ms | ~150ms | Collaboration updates |

### Scalability Limits

```
📊 System Capacity:
│
├── 📦 Components per Canvas: ~200 (optimal), ~500 (max)
├── 👥 Concurrent Users: ~10 (optimal), ~25 (max)  
├── 🔗 Interactions per Component: ~20 (optimal), ~50 (max)
├── 📋 Properties per Component: ~30 (optimal), ~100 (max)
└── 💾 Project Size: ~5MB (optimal), ~20MB (max)
```

---

## 🚀 Extension Points

### Plugin Architecture

```
🔌 Extension System:
│
├── 📦 Component Plugins
│   ├── Custom SVG components
│   ├── Specialized properties
│   └── Domain-specific behaviors
│
├── 🎨 Theme Plugins  
│   ├── Color schemes
│   ├── Icon sets
│   └── Layout templates
│
├── 📡 Service Plugins
│   ├── External APIs
│   ├── Data sources
│   └── Export formats
│
└── 🔗 Integration Plugins
    ├── Industrial protocols
    ├── IoT platforms
    └── Simulation engines
```

This architecture provides a solid foundation for building complex digital twin applications while maintaining modularity, scalability, and extensibility.
