#!/usr/bin/env node

/**
 * Skrypt do migracji metadanych z elementu <metadata> do <script type="application/json" class="metadata">
 * Automatycznie konwertuje wszystkie pliki SVG w katalogu komponentów
 *
 * Użycie:
 *   node migrate-metadata.js
 */

const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
const glob = require('glob');

// Konfiguracja
const COMPONENTS_DIR = path.join(__dirname, 'components');

/**
 * Pomocnicza funkcja do znajdowania elementów z określonymi atrybutami
 * Zastępuje querySelector, który nie jest dostępny w @xmldom/xmldom
 *
 * @param {Document} doc - Dokument XML
 * @param {string} tagName - Nazwa znacznika do znalezienia
 * @param {Object} attributes - Obiekt z atrybutami do dopasowania
 * @returns {Element|null} - Znaleziony element lub null
 */
function findElementByAttributes(doc, tagName, attributes) {
    const elements = doc.getElementsByTagName(tagName);

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        let match = true;

        for (const [attr, value] of Object.entries(attributes)) {
            if (element.getAttribute(attr) !== value) {
                match = false;
                break;
            }
        }

        if (match) {
            return element;
        }
    }

    return null;
}

/**
 * Pomocnicza funkcja do znajdowania elementów zawierających ciąg tekstowy
 *
 * @param {Element} element - Element do przeszukania
 * @param {string} text - Tekst do znalezienia
 * @returns {boolean} - True jeśli tekst został znaleziony
 */
function containsText(element, text) {
    if (!element || !element.textContent) return false;
    return element.textContent.includes(text);
}

// Funkcja do konwersji pojedynczego pliku SVG
async function migrateComponentMetadata(filePath) {
    console.log(`Przetwarzanie: ${filePath}`);

    try {
        // Wczytaj plik SVG
        const svgContent = fs.readFileSync(filePath, 'utf8');

        // Parsuj dokument SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'text/xml');

        // Sprawdź, czy istnieje już nowy format metadanych
        const existingMetadataScript = findElementByAttributes(svgDoc, 'script', {
            'type': 'application/json',
            'id': 'metadata'
        });

        if (existingMetadataScript) {
            console.log(`  → Już używa nowego formatu metadanych`);
            return;
        }

        // Sprawdź, czy istnieje element metadata
        const metadataElements = svgDoc.getElementsByTagName('metadata');
        if (!metadataElements || metadataElements.length === 0) {
            console.log(`  → Brak elementu metadata do konwersji`);
            return;
        }

        const oldMetadataNode = metadataElements[0];

        // Pobierz zawartość metadanych
        const metadataContent = oldMetadataNode.textContent.trim();
        if (!metadataContent) {
            console.log(`  → Pusty element metadata, pomijanie`);
            return;
        }

        try {
            // Parsuj JSON aby upewnić się, że jest prawidłowy
            const metadata = JSON.parse(metadataContent);

            // Utwórz nowy element script
            const scriptNode = svgDoc.createElement('script');
            scriptNode.setAttribute('type', 'application/json');
            scriptNode.setAttribute('id', 'metadata');
            scriptNode.textContent = JSON.stringify(metadata, null, 4);

            // Znajdź węzeł rodzica elementu metadata
            const parentNode = oldMetadataNode.parentNode;

            // Wstaw nowy element script przed elementem metadata
            parentNode.insertBefore(scriptNode, oldMetadataNode);

            // Usuń stary element metadata
            parentNode.removeChild(oldMetadataNode);

            // Zaktualizuj również skrypt komponentu, jeśli używa querySelector('metadata')
            const scriptElements = svgDoc.getElementsByTagName('script');
            for (let i = 0; i < scriptElements.length; i++) {
                const scriptElement = scriptElements[i];
                if (scriptElement.getAttribute('type') !== 'application/json') {
                    let scriptContent = scriptElement.textContent;

                    if (scriptContent.includes('querySelector(\'metadata\')')) {
                        scriptContent = scriptContent.replace(
                            /querySelector\(['"]metadata['"]\)/g,
                            'querySelector(\'script[type="application/json"][class="metadata"]\')'
                        );
                        scriptElement.textContent = scriptContent;
                    }

                    if (scriptContent.includes('querySelector("metadata")')) {
                        scriptContent = scriptContent.replace(
                            /querySelector\("metadata"\)/g,
                            'querySelector(\'script[type="application/json"][class="metadata"]\')'
                        );
                        scriptElement.textContent = scriptContent;
                    }

                    // Również zaktualizuj odniesienia do atrybutu textContent w skryptach
                    if (scriptContent.includes('querySelector(\'metadata\').textContent')) {
                        scriptContent = scriptContent.replace(
                            /querySelector\(['"]metadata['"]\)\.textContent/g,
                            'querySelector(\'script[type="application/json"][class="metadata"]\').textContent'
                        );
                        scriptElement.textContent = scriptContent;
                    }
                }
            }

            // Serializuj zaktualizowany dokument SVG
            const serializer = new XMLSerializer();
            let updatedSvgContent = serializer.serializeToString(svgDoc);

            // Dodaj deklarację XML jeśli nie istnieje
            if (!updatedSvgContent.startsWith('<?xml')) {
                updatedSvgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + updatedSvgContent;
            }

            // Zapisz zaktualizowany plik
            fs.writeFileSync(filePath, updatedSvgContent, 'utf8');
            console.log(`  ✓ Skonwertowano do nowego formatu metadanych`);

        } catch (jsonError) {
            console.error(`  ✗ Błąd parsowania JSON w ${filePath}: ${jsonError.message}`);
        }

    } catch (error) {
        console.error(`  ✗ Błąd przetwarzania pliku ${filePath}: ${error.message}`);
    }
}

// Główna funkcja
async function main() {
    console.log(`Rozpoczynam migrację metadanych w katalogu: ${COMPONENTS_DIR}`);

    // Znajdź wszystkie pliki SVG w katalogu komponentów
    const svgFiles = glob.sync(path.join(COMPONENTS_DIR, '*.svg'));

    console.log(`Znaleziono ${svgFiles.length} plików SVG do przetworzenia`);

    // Przetwórz każdy plik SVG
    let successCount = 0;
    for (const file of svgFiles) {
        try {
            await migrateComponentMetadata(file);
            successCount++;
        } catch (error) {
            console.error(`Błąd przetwarzania ${file}: ${error.message}`);
        }
    }

    console.log(`\nMigracja zakończona: ${successCount}/${svgFiles.length} plików pomyślnie zaktualizowanych`);
}

// Uruchom skrypt
main().catch(error => {
    console.error(`Błąd krytyczny: ${error.message}`);
    process.exit(1);
});
