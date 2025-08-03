# 🧪 Digital Twin IDE - Przewodnik Testowania

## Przegląd Systemu Testów

Digital Twin IDE zawiera kompletny system testowania składający się z testów wizualnych UI oraz testów funkcjonalnych. System został zaprojektowany do weryfikacji wszystkich kluczowych funkcjonalności środowiska.

## 📋 Struktura Testów

### 1. **Testy Wizualne UI** (`tests/ui-tests.html`)
Interaktywne testy interfejsu użytkownika uruchamiane w przeglądarce:

#### **Kategorie testów:**
- **Ładowanie i Inicjalizacja**
  - ✅ Ładowanie komponentów z `components.json`
  - ✅ Inicjalizacja canvas SVG
  
- **Drag & Drop**
  - ✅ Przeciąganie komponentów z biblioteki
  - ✅ Umieszczanie na canvas
  
- **System Właściwości**
  - ✅ Wyświetlanie panelu właściwości
  - ✅ Zarządzanie kolorami SVG
  - ✅ Automatyczne mapowanie właściwości
  
- **System Interakcji**
  - ✅ Tworzenie interakcji między komponentami
  - ✅ Definowanie zdarzeń i akcji
  
- **Symulacja**
  - ✅ Uruchamianie symulacji czasu rzeczywistego
  - ✅ Zachowania komponentów

### 2. **Testy Funkcjonalne** (`tests/functional-tests.js`)
Automatyczne testy wszystkich funkcjonalności systemu:

#### **Moduły testowe:**
- **ComponentManagement**: Zarządzanie komponentami
- **PropertiesSystem**: System właściwości
- **InteractionsSystem**: System interakcji
- **SimulationSystem**: Silnik symulacji
- **DragDropSystem**: Przeciąganie i upuszczanie
- **UISystem**: Interfejs użytkownika

## 🚀 Uruchamianie Testów

### Metoda 1: Testy Wizualne UI
1. Otwórz aplikację Digital Twin IDE w przeglądarce
2. Otwórz nową kartę i przejdź do `/tests/ui-tests.html`
3. Kliknij **"🚀 Uruchom Wszystkie Testy"**
4. Obserwuj wyniki w czasie rzeczywistym

### Metoda 2: Testy Funkcjonalne (Konsola)
```javascript
// Uruchom wszystkie testy funkcjonalne
await runFunctionalTests();

// Eksportuj raport testów do JSON
exportTestReport();

// Uruchom konkretny test
await functionalTester.testComponentManagement();
```

### Metoda 3: Integracja z Aplikacją
```javascript
// Dodaj do app.js lub main.js
import { FunctionalTester } from './tests/functional-tests.js';

// W trybie deweloperskim
if (window.location.hostname === 'localhost') {
    const tester = new FunctionalTester();
    window.addEventListener('load', async () => {
        console.log('🧪 Tryb deweloperski - dostępne testy funkcjonalne');
        console.log('Użyj: await runFunctionalTests()');
    });
}
```

## 📊 Interpretacja Wyników

### Status Testów
- **🟢 PASS**: Test przeszedł pomyślnie
- **🔴 FAIL**: Test nie przeszedł - sprawdź szczegóły błędu
- **🟡 PENDING**: Test oczekuje na wykonanie

### Raport Funkcjonalny
```json
{
  "timestamp": "2025-08-03T11:12:50.000Z",
  "totalTests": 24,
  "passedTests": 22,
  "failedTests": 2,
  "details": {
    "componentManagement": {
      "total": 4,
      "passed": 4,
      "failed": 0
    }
  }
}
```

## 🔧 Rozwiązywanie Problemów

### Najczęstsze Problemy

#### 1. **Testy UI nie ładują się**
```javascript
// Sprawdź czy aplikacja jest uruchomiona
// Upewnij się, że jesteś na tym samym serwerze co główna aplikacja
```

#### 2. **Błędy w testach funkcjonalnych**
```javascript
// Sprawdź w konsoli przeglądarki błędy inicjalizacji
console.error('Sprawdź czy wszystkie moduły są załadowane');

// Zweryfikuj dostępność globalnych obiektów
console.log('ComponentManager:', window.componentManager);
console.log('PropertiesManager:', window.propertiesManager);
```

#### 3. **Testy symulacji nie przechodzą**
```javascript
// Upewnij się, że symulacja nie jest już uruchomiona
simulationManager.stopSimulation();

// Zresetuj stan przed testem
simulationManager.reset();
```

## 🎯 Najlepsze Praktyki

### 1. **Przed Commitami**
```bash
# Uruchom wszystkie testy
# Sprawdź wskaźnik powodzenia > 95%
# Eksportuj raport testów
```

### 2. **Rozwój Nowych Funkcji**
```javascript
// 1. Napisz test dla nowej funkcjonalności
// 2. Zaimplementuj funkcję
// 3. Upewnij się, że wszystkie testy przechodzą
// 4. Dodaj test do suite'a
```

### 3. **Debugowanie**
```javascript
// Użyj testów jednostkowych do izolacji problemów
await functionalTester.testComponentManagement();

// Włącz dodatkowe logowanie
localStorage.setItem('debug', 'true');
```

## 📈 Metryki Jakości

### Docelowe Wskaźniki
- **Ogólny wskaźnik powodzenia**: ≥ 95%
- **Testy krytyczne (Core)**: 100%
- **Testy UI**: ≥ 90%
- **Testy integracyjne**: ≥ 95%

### Monitoring Wydajności
```javascript
// Czas wykonania testów
const startTime = performance.now();
await runFunctionalTests();
const duration = performance.now() - startTime;
console.log(`⏱️ Testy wykonane w: ${duration.toFixed(2)}ms`);
```

## 🔄 CI/CD Integration

### GitHub Actions (planowane)
```yaml
name: Digital Twin IDE Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Run functional tests
        run: npm run test:functional
      - name: Generate test report
        run: npm run test:report
```

## 📝 Dodawanie Nowych Testów

### 1. Test UI
```html
<!-- Dodaj do ui-tests.html -->
<div class="test-case">
    <h3>🆕 Nowa Funkcjonalność</h3>
    <span class="test-status status-pending" id="status-new">PENDING</span>
    <p>Opis testu nowej funkcjonalności</p>
    <div class="test-actions">
        <button onclick="testNewFeature()">Uruchom Test</button>
    </div>
    <div class="test-results" id="results-new"></div>
</div>
```

### 2. Test Funkcjonalny
```javascript
// Dodaj do functional-tests.js
async testNewFeature() {
    console.log('🧪 Test: Nowa funkcjonalność...');
    const results = {
        featureInit: false,
        featureExecution: false,
        featureCleanup: false
    };

    try {
        // Logika testowa
        results.featureInit = true;
    } catch (error) {
        console.error('❌ Błąd w teście nowej funkcjonalności:', error);
    }

    this.testResults.set('newFeature', results);
    return results;
}
```

## 📞 Wsparcie

W przypadku problemów z testami:
1. Sprawdź konsolę przeglądarki pod kątem błędów
2. Zweryfikuj czy wszystkie zależności są załadowane
3. Uruchom testy w trybie debugowania
4. Sprawdź dokumentację konkretnego modułu

---
**Aktualizacja**: 2025-08-03  
**Wersja**: 1.0  
**Autor**: Digital Twin Team
