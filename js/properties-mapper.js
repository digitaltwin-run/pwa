// Digital Twin IDE - Properties Mapper (Refactored)
// Main coordinator for modular properties mapping system

import { MapperCore } from './properties/mapper-core.js';
import { ComponentDetector } from './properties/component-detector.js';
import { PropertyExtractor } from './properties/property-extractor.js';
import { VariableMapper } from './properties/variable-mapper.js';
import { InteractionManager } from './properties/interaction-manager.js';

export class PropertiesMapper {
    constructor(componentManager) {
        console.log('[PropertiesMapper] Initializing refactored properties mapper...');
        
        // Initialize core modules
        this.core = new MapperCore(componentManager);
        this.componentDetector = new ComponentDetector(this.core);
        this.variableMapper = new VariableMapper(this.core);
        this.interactionManager = new InteractionManager(this.core, this.componentDetector, this.variableMapper);
        
        // Store reference to component manager
        this.componentManager = componentManager;
        
        // Initialize the system
        this.initialize();
        
        console.log('[PropertiesMapper] Refactored properties mapper initialized successfully');
    }

    /**
     * Initialize the properties mapping system
     */
    initialize() {
        // Setup auto-refresh and event handling
        this.interactionManager.setupAutoRefresh();
        
        // Run initial scan
        this.core.initialize();
    }

    /**
     * Scan canvas properties - delegates to component detector
     */
    scanCanvasProperties() {
        return this.componentDetector.scanCanvasProperties();
    }

    /**
     * Extract element properties from SVG - delegates to component detector
     * @param {Element} svgElement - SVG element
     * @returns {Object} Extracted properties
     */
    extractElementPropertiesFromSvg(svgElement) {
        const componentData = this.componentManager?.getComponent(
            svgElement.getAttribute('data-id') || svgElement.id
        );
        return this.componentDetector.extractElementPropertiesFromSvg(svgElement, componentData);
    }

    /**
     * Extract element properties - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @param {Object} componentData - Component data
     * @returns {Object} Extracted properties
     */
    extractElementProperties(svgElement, componentData) {
        return PropertyExtractor.extractElementProperties(svgElement, componentData);
    }

    /**
     * Detect component type - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @param {Object} componentData - Component data
     * @returns {string} Component type
     */
    detectComponentType(svgElement, componentData) {
        return PropertyExtractor.detectComponentType(svgElement, componentData);
    }

    /**
     * Extract SVG attributes - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @returns {Object} SVG attributes
     */
    extractSvgAttributes(svgElement) {
        return PropertyExtractor.extractSvgAttributes(svgElement);
    }

    /**
     * Extract parameters - delegates to property extractor
     * @param {Object} componentData - Component data
     * @returns {Array} Parameters
     */
    extractParameters(componentData) {
        return PropertyExtractor.extractParameters(componentData);
    }

    /**
     * Detect parameter type - delegates to property extractor
     * @param {string} key - Parameter key
     * @param {Object} componentData - Component data
     * @returns {string} Parameter type
     */
    detectParameterType(key, componentData) {
        return PropertyExtractor.detectParameterType(key, componentData);
    }

    /**
     * Check if parameter is writable - delegates to property extractor
     * @param {string} key - Parameter key
     * @returns {boolean} Whether parameter is writable
     */
    isParameterWritable(key) {
        return PropertyExtractor.isParameterWritable(key);
    }

    /**
     * Get available events - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @returns {Array} Available events
     */
    getAvailableEvents(svgElement) {
        return PropertyExtractor.getAvailableEvents(svgElement);
    }

    /**
     * Extract states - delegates to property extractor
     * @param {Object} componentData - Component data
     * @returns {Array} States
     */
    extractStates(componentData) {
        return PropertyExtractor.extractStates(componentData);
    }

    /**
     * Extract colors - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @returns {Object} Colors
     */
    extractColors(svgElement) {
        return PropertyExtractor.extractColors(svgElement);
    }

    /**
     * Extract position - delegates to property extractor
     * @param {Element} svgElement - SVG element
     * @returns {Object} Position data
     */
    extractPosition(svgElement) {
        return PropertyExtractor.extractPosition(svgElement);
    }

    /**
     * Extract interactions - delegates to property extractor
     * @param {Object} componentData - Component data
     * @returns {Array} Interactions
     */
    extractInteractions(componentData) {
        return PropertyExtractor.extractInteractions(componentData);
    }

    /**
     * Add variables to map - delegates to variable mapper
     * @param {string} componentId - Component ID
     * @param {Object} properties - Component properties
     */
    addVariablesToMap(componentId, properties) {
        return this.variableMapper.addVariablesToMap(componentId, properties);
    }

    /**
     * Export to metadata JSON - delegates to variable mapper
     * @returns {Object} Metadata JSON
     */
    exportToMetadataJson() {
        return this.variableMapper.exportToMetadataJson();
    }

    /**
     * Get component types summary - delegates to variable mapper
     * @returns {Object} Component types summary
     */
    getComponentTypesSummary() {
        return this.variableMapper.getComponentTypesSummary();
    }

    /**
     * Get variables for action type - delegates to variable mapper
     * @param {string} actionType - Action type
     * @returns {Array} Available variables
     */
    getVariablesForActionType(actionType) {
        return this.variableMapper.getVariablesForActionType(actionType);
    }

    /**
     * Refresh interaction panels - delegates to interaction manager
     * @param {number} retryCount - Retry count
     */
    refreshInteractionPanels(retryCount = 0) {
        return this.interactionManager.refreshInteractionPanels(retryCount);
    }

    /**
     * Get available target components - delegates to variable mapper
     * @returns {Array} Available target components
     */
    getAvailableTargetComponents() {
        return this.variableMapper.getAvailableTargetComponents();
    }

    /**
     * Setup auto refresh - delegates to interaction manager
     */
    setupAutoRefresh() {
        return this.interactionManager.setupAutoRefresh();
    }

    /**
     * Force refresh - delegates to interaction manager
     */
    forceRefresh() {
        return this.interactionManager.forceRefresh();
    }

    /**
     * Get mapped properties - delegates to core
     * @returns {Map} Mapped properties
     */
    getMappedProperties() {
        return this.core.getMappedProperties();
    }

    /**
     * Get available variables - delegates to core
     * @returns {Map} Available variables
     */
    getAvailableVariables() {
        return this.core.getAvailableVariables();
    }

    /**
     * Get mapped property for component - delegates to core
     * @param {string} componentId - Component ID
     * @returns {Object|null} Component properties
     */
    getMappedProperty(componentId) {
        return this.core.getMappedProperty(componentId);
    }

    /**
     * Get variable by key - delegates to variable mapper
     * @param {string} key - Variable key
     * @returns {Object|null} Variable data
     */
    getVariable(key) {
        return this.variableMapper.getVariable(key);
    }

    /**
     * Get all variables as array - delegates to variable mapper
     * @returns {Array} All variables
     */
    getAllVariables() {
        return this.variableMapper.getAllVariables();
    }

    /**
     * Get variables by type - delegates to variable mapper
     * @param {string} type - Variable type
     * @returns {Array} Variables of specified type
     */
    getVariablesByType(type) {
        return this.variableMapper.getVariablesByType(type);
    }

    /**
     * Get variables by component - delegates to variable mapper
     * @param {string} componentId - Component ID
     * @returns {Array} Variables for component
     */
    getVariablesByComponent(componentId) {
        return this.variableMapper.getVariablesByComponent(componentId);
    }

    /**
     * Get refresh status - delegates to interaction manager
     * @returns {Object} Refresh status
     */
    getRefreshStatus() {
        return this.interactionManager.getRefreshStatus();
    }

    /**
     * Cleanup method - delegates to all modules
     */
    cleanup() {
        console.log('[PropertiesMapper] Starting cleanup...');
        
        this.interactionManager.cleanup();
        this.core.cleanup();
        
        console.log('[PropertiesMapper] Cleanup completed');
    }

    // Legacy properties for backward compatibility
    get mappedProperties() {
        return this.core.getMappedProperties();
    }

    get availableVariables() {
        return this.core.getAvailableVariables();
    }
}
