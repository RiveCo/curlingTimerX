/**
 * Settings Screen Module
 * Handles settings screen functionality with scroll wheel interfaces
 */

const Settings = {
    // Settings state
    isOpen: false,
    
    // DOM elements
    settingsScreen: null,
    mainScreen: null,
    settingsButton: null,
    backButton: null,
    
    // Scroll wheel elements
    scrollWheels: {},
    
    // Current values
    currentValues: {
        buttonTime: 3650,
        guardTime: 3900,
        takeoutTime: 3000,
        threshold: 50
    },
    
    // Configuration
    TIME_INCREMENT: 50, // milliseconds
    THRESHOLD_INCREMENT: 10, // milliseconds
    MIN_TIME: 1000, // 1 second minimum
    MAX_TIME: 10000, // 10 seconds maximum
    MIN_THRESHOLD: 0,
    MAX_THRESHOLD: 500,

    /**
     * Initialize the settings module
     */
    init() {
        // Get DOM elements
        this.settingsScreen = document.getElementById('settings-screen');
        this.mainScreen = document.getElementById('main-screen');
        this.settingsButton = document.getElementById('settings-button');
        this.backButton = document.getElementById('back-button');
        
        // Get scroll wheel elements
        this.scrollWheels = {
            buttonTime: document.getElementById('button-time-wheel'),
            guardTime: document.getElementById('guard-time-wheel'),
            takeoutTime: document.getElementById('takeout-time-wheel'),
            threshold: document.getElementById('threshold-wheel')
        };
        
        // Load current settings
        this.loadSettings();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize scroll wheels
        this.initializeScrollWheels();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.settingsButton.addEventListener('click', () => this.openSettings());
        this.backButton.addEventListener('click', () => this.closeSettings());
    },

    /**
     * Load settings from storage
     */
    loadSettings() {
        const settings = Storage.getAllSettings();
        this.currentValues = {
            buttonTime: settings.buttonTime,
            guardTime: settings.guardTime,
            takeoutTime: settings.takeoutTime,
            threshold: settings.threshold
        };
    },

    /**
     * Initialize scroll wheel interfaces
     */
    initializeScrollWheels() {
        this.createScrollWheel('buttonTime', this.currentValues.buttonTime, this.MIN_TIME, this.MAX_TIME, this.TIME_INCREMENT);
        this.createScrollWheel('guardTime', this.currentValues.guardTime, this.MIN_TIME, this.MAX_TIME, this.TIME_INCREMENT);
        this.createScrollWheel('takeoutTime', this.currentValues.takeoutTime, this.MIN_TIME, this.MAX_TIME, this.TIME_INCREMENT);
        this.createScrollWheel('threshold', this.currentValues.threshold, this.MIN_THRESHOLD, this.MAX_THRESHOLD, this.THRESHOLD_INCREMENT);
    },

    /**
     * Create a scroll wheel interface
     * @param {string} name - Name of the setting
     * @param {number} initialValue - Initial value
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} increment - Increment step
     */
    createScrollWheel(name, initialValue, min, max, increment) {
        const container = this.scrollWheels[name];
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Create wheel structure
        const wheelWrapper = document.createElement('div');
        wheelWrapper.className = 'wheel-wrapper';
        
        const wheelList = document.createElement('div');
        wheelList.className = 'wheel-list';
        
        // Generate options
        const options = [];
        for (let value = min; value <= max; value += increment) {
            options.push(value);
        }
        
        // Create wheel items
        options.forEach(value => {
            const item = document.createElement('div');
            item.className = 'wheel-item';
            item.dataset.value = value;
            
            // Format display text
            if (name === 'threshold') {
                item.textContent = `${value}ms`;
            } else {
                item.textContent = `${(value / 1000).toFixed(2)}s`;
            }
            
            wheelList.appendChild(item);
        });
        
        wheelWrapper.appendChild(wheelList);
        container.appendChild(wheelWrapper);
        
        // Set initial position
        const initialIndex = options.indexOf(initialValue);
        if (initialIndex !== -1) {
            this.scrollToIndex(name, initialIndex, false);
        }
        
        // Add touch/scroll event listeners
        this.addWheelEventListeners(name, wheelList, options);
    },

    /**
     * Add event listeners to a wheel
     * @param {string} name - Name of the setting
     * @param {HTMLElement} wheelList - The wheel list element
     * @param {Array} options - Array of possible values
     */
    addWheelEventListeners(name, wheelList, options) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let currentIndex = options.indexOf(this.currentValues[name]);
        
        const itemHeight = 50; // Height of each item in pixels
        
        const handleStart = (e) => {
            isDragging = true;
            startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            currentY = startY;
            wheelList.style.transition = 'none';
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - startY;
            
            // Calculate new index based on drag distance
            const indexChange = Math.round(-deltaY / itemHeight);
            let newIndex = currentIndex + indexChange;
            
            // Clamp index
            newIndex = Math.max(0, Math.min(options.length - 1, newIndex));
            
            // Update transform
            const offset = -newIndex * itemHeight + (wheelList.parentElement.offsetHeight / 2) - (itemHeight / 2);
            wheelList.style.transform = `translateY(${offset}px)`;
            
            // Update active item
            this.updateActiveItem(wheelList, newIndex);
        };
        
        const handleEnd = () => {
            if (!isDragging) return;
            
            isDragging = false;
            wheelList.style.transition = 'transform 0.3s ease';
            
            const deltaY = currentY - startY;
            const indexChange = Math.round(-deltaY / itemHeight);
            let newIndex = currentIndex + indexChange;
            
            // Clamp index
            newIndex = Math.max(0, Math.min(options.length - 1, newIndex));
            
            // Update current index
            currentIndex = newIndex;
            
            // Snap to position
            this.scrollToIndex(name, newIndex, true);
            
            // Save new value
            this.currentValues[name] = options[newIndex];
            this.saveSettings();
            
            // Reset start position
            startY = 0;
        };
        
        // Touch events
        wheelList.addEventListener('touchstart', handleStart, { passive: false });
        wheelList.addEventListener('touchmove', handleMove, { passive: false });
        wheelList.addEventListener('touchend', handleEnd);
        
        // Mouse events
        wheelList.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    },

    /**
     * Scroll wheel to specific index
     * @param {string} name - Name of the setting
     * @param {number} index - Index to scroll to
     * @param {boolean} animate - Whether to animate
     */
    scrollToIndex(name, index, animate) {
        const container = this.scrollWheels[name];
        if (!container) return;
        
        const wheelList = container.querySelector('.wheel-list');
        if (!wheelList) return;
        
        const itemHeight = 50;
        const offset = -index * itemHeight + (container.offsetHeight / 2) - (itemHeight / 2);
        
        if (animate) {
            wheelList.style.transition = 'transform 0.3s ease';
        } else {
            wheelList.style.transition = 'none';
        }
        
        wheelList.style.transform = `translateY(${offset}px)`;
        
        // Update active item
        this.updateActiveItem(wheelList, index);
    },

    /**
     * Update active item styling
     * @param {HTMLElement} wheelList - The wheel list element
     * @param {number} activeIndex - Index of active item
     */
    updateActiveItem(wheelList, activeIndex) {
        const items = wheelList.querySelectorAll('.wheel-item');
        items.forEach((item, index) => {
            if (index === activeIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    },

    /**
     * Save current settings to storage
     */
    saveSettings() {
        Storage.saveButtonTime(this.currentValues.buttonTime);
        Storage.saveGuardTime(this.currentValues.guardTime);
        Storage.saveTakeoutTime(this.currentValues.takeoutTime);
        Storage.saveThreshold(this.currentValues.threshold);
    },

    /**
     * Open settings screen
     */
    openSettings() {
        this.isOpen = true;
        this.mainScreen.style.display = 'none';
        this.settingsScreen.style.display = 'flex';
        
        // Reload settings in case they were changed
        this.loadSettings();
        this.initializeScrollWheels();
    },

    /**
     * Close settings screen
     */
    closeSettings() {
        this.isOpen = false;
        this.settingsScreen.style.display = 'none';
        this.mainScreen.style.display = 'flex';
        
        // Save settings before closing
        this.saveSettings();
    }
};

// Initialize settings when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Settings.init());
} else {
    Settings.init();
}
