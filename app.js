// ===================================
// Tour Register PWA - Main Application
// ===================================

class TourRegisterApp {
    constructor() {
        this.db = null;
        this.currentScreen = 'login';
        this.pin = '';
        this.enteredPin = '';
        this.branchLocation = null;
        this.geoFenceRadius = 1000; // meters
        this.isTracking = false;
        this.currentPosition = null;
        this.pendingVisit = null;
        this.exclusionZones = [];

        this.init();
    }
    
    // ===================================
    // Initialization
    // ===================================
    async init() {
        await this.initDatabase();
        await this.loadSettings();
        this.setupEventListeners();
        this.checkFirstTimeSetup();
    }
    
    // ===================================
    // IndexedDB Setup
    // ===================================
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('TourRegisterDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                // Visits store
                if (!db.objectStoreNames.contains('visits')) {
                    const visitStore = db.createObjectStore('visits', { keyPath: 'id', autoIncrement: true });
                    visitStore.createIndex('date', 'date', { unique: false });
                    visitStore.createIndex('purpose', 'purpose', { unique: false });
                }
                
                // Photos store
                if (!db.objectStoreNames.contains('photos')) {
                    db.createObjectStore('photos', { keyPath: 'visitId' });
                }
            };
        });
    }
    
    // ===================================
    // Settings Management
    // ===================================
    async loadSettings() {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        // Load PIN
        const pinRequest = store.get('pin');
        pinRequest.onsuccess = () => {
            if (pinRequest.result) {
                this.pin = pinRequest.result.value;
            }
        };
        
        // Load branch location
        const locationRequest = store.get('branchLocation');
        locationRequest.onsuccess = () => {
            if (locationRequest.result) {
                this.branchLocation = locationRequest.result.value;
            }
        };
        
        // Load geo-fence radius
        const radiusRequest = store.get('geoFenceRadius');
        radiusRequest.onsuccess = () => {
            if (radiusRequest.result) {
                this.geoFenceRadius = radiusRequest.result.value;
            }
        };

        // Load exclusion zones
        const exclusionRequest = store.get('exclusionZones');
        exclusionRequest.onsuccess = () => {
            if (exclusionRequest.result) {
                this.exclusionZones = exclusionRequest.result.value;
            }
        };
    }
    
    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        await store.put({ key, value });
    }
    
    // ===================================
    // First Time Setup Check
    // ===================================
    checkFirstTimeSetup() {
        if (!this.pin) {
            document.getElementById('first-time-setup').style.display = 'block';
            document.getElementById('pin-label').textContent = 'Set your 4-digit PIN';
        }
    }
    
    // ===================================
    // Event Listeners
    // ===================================
    setupEventListeners() {
        // PIN Pad
        document.querySelectorAll('.pin-key').forEach(key => {
            key.addEventListener('click', (e) => this.handlePinInput(e));
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.navigateTo(screen);
            });
        });
        
        // Branch Setup
        document.getElementById('use-current-location').addEventListener('click', 
            () => this.useCurrentLocation());
        document.getElementById('set-manual-location').addEventListener('click', 
            () => this.setManualLocation());
        document.getElementById('radius-slider').addEventListener('input', 
            (e) => this.updateRadiusDisplay(e));
        document.getElementById('save-setup').addEventListener('click', 
            () => this.saveSetup());
        
        // Visit Classification
        document.querySelectorAll('.purpose-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectPurpose(e));
        });
        document.getElementById('add-photo-btn').addEventListener('click', 
            () => document.getElementById('visit-photo').click());
        document.getElementById('visit-photo').addEventListener('change', 
            (e) => this.handlePhotoUpload(e));
        document.getElementById('save-visit').addEventListener('click', 
            () => this.saveVisit());
        
        // Filters
        document.getElementById('filter-btn').addEventListener('click', 
            () => this.toggleFilters());
        document.getElementById('month-filter').addEventListener('change', 
            () => this.filterVisits());
        document.getElementById('purpose-filter').addEventListener('change', 
            () => this.filterVisits());
        
        // Dashboard
        document.getElementById('dashboard-period').addEventListener('change', 
            (e) => this.updateDashboard(e.target.value));
        
        // Export
        document.getElementById('export-excel').addEventListener('click', 
            () => this.exportToExcel());
        document.getElementById('export-pdf').addEventListener('click', 
            () => this.exportToPDF());
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click',
            () => this.openSettings());

        // Exclusion Zones
        document.getElementById('add-exclusion-btn').addEventListener('click',
            () => this.openExclusionModal());
        document.getElementById('close-exclusion-modal').addEventListener('click',
            () => this.closeExclusionModal());
        document.getElementById('exclusion-use-gps').addEventListener('click',
            () => this.exclusionUseGPS());
        document.getElementById('exclusion-radius').addEventListener('input',
            (e) => {
                document.getElementById('exclusion-radius-value').textContent = e.target.value;
            });
        document.getElementById('save-exclusion').addEventListener('click',
            () => this.saveExclusion());

        // Manual Entry
        document.getElementById('fab-add-entry').addEventListener('click',
            () => this.openManualEntry());
        document.getElementById('close-manual-entry').addEventListener('click',
            () => this.closeManualEntry());
        document.getElementById('manual-entry-use-gps').addEventListener('click',
            () => this.manualEntryUseGPS());
        document.getElementById('manual-entry-add-photo-btn').addEventListener('click',
            () => document.getElementById('manual-entry-photo').click());
        document.getElementById('manual-entry-photo').addEventListener('change',
            (e) => this.handleManualEntryPhoto(e));
        document.getElementById('save-manual-entry').addEventListener('click',
            () => this.saveManualEntry());
        document.querySelectorAll('#manual-purpose-grid .purpose-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectManualPurpose(e));
        });
    }
    
    // ===================================
    // PIN Authentication
    // ===================================
    handlePinInput(e) {
        const key = e.currentTarget.dataset.key;
        
        if (key === 'back') {
            this.enteredPin = this.enteredPin.slice(0, -1);
        } else if (this.enteredPin.length < 4) {
            this.enteredPin += key;
        }
        
        this.updatePinDisplay();
        
        if (this.enteredPin.length === 4) {
            setTimeout(() => this.verifyPin(), 300);
        }
    }
    
    updatePinDisplay() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            if (index < this.enteredPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }
    
    async verifyPin() {
        if (!this.pin) {
            // First time setup - save PIN
            this.pin = this.enteredPin;
            await this.saveSetting('pin', this.pin);
            this.showToast('PIN set successfully!', 'success');
            this.navigateTo('setup');
        } else if (this.enteredPin === this.pin) {
            // Correct PIN
            if (!this.branchLocation) {
                this.navigateTo('setup');
            } else {
                this.navigateTo('home');
                this.startTracking();
            }
        } else {
            // Wrong PIN
            this.showToast('Incorrect PIN', 'error');
            this.enteredPin = '';
            this.updatePinDisplay();
        }
    }
    
    // ===================================
    // Navigation
    // ===================================
    navigateTo(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.screen === screenName) {
                item.classList.add('active');
            }
        });
        
        // Show/hide bottom nav and FAB
        if (screenName === 'login' || screenName === 'setup') {
            document.getElementById('bottom-nav').style.display = 'none';
            document.getElementById('fab-add-entry').style.display = 'none';
        } else {
            document.getElementById('bottom-nav').style.display = 'flex';
            document.getElementById('fab-add-entry').style.display = 'flex';
        }
        
        // Load screen-specific data
        switch(screenName) {
            case 'home':
                this.loadTodayStats();
                this.loadRecentVisits();
                break;
            case 'visits':
                this.loadAllVisits();
                this.populateMonthFilter();
                break;
            case 'dashboard':
                this.updateDashboard('month');
                break;
            case 'setup':
                this.renderExclusionList();
                break;
            case 'export':
                this.setDefaultExportMonth();
                break;
        }
    }
    
    // ===================================
    // Branch Setup
    // ===================================
    async useCurrentLocation() {
        this.showLoading();
        
        if (!navigator.geolocation) {
            this.hideLoading();
            this.showToast('Geolocation not supported', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                this.branchLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Reverse geocode
                const address = await this.reverseGeocode(
                    this.branchLocation.lat, 
                    this.branchLocation.lng
                );
                
                this.updateLocationDisplay(address);
                this.hideLoading();
                this.showToast('Location captured successfully', 'success');
            },
            (error) => {
                this.hideLoading();
                this.showToast('Could not get location: ' + error.message, 'error');
            },
            { enableHighAccuracy: true }
        );
    }
    
    setManualLocation() {
        const lat = parseFloat(document.getElementById('manual-lat').value);
        const lng = parseFloat(document.getElementById('manual-lng').value);
        
        if (isNaN(lat) || isNaN(lng)) {
            this.showToast('Please enter valid coordinates', 'error');
            return;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            this.showToast('Coordinates out of range', 'error');
            return;
        }
        
        this.branchLocation = { lat, lng };
        this.updateLocationDisplay(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        this.showToast('Location set successfully', 'success');
    }
    
    updateLocationDisplay(address) {
        const display = document.getElementById('location-display');
        display.innerHTML = `
            <p class="location-status" style="color: var(--success); font-weight: 600;">✓ Location Set</p>
            <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">${address}</p>
        `;
    }
    
    updateRadiusDisplay(e) {
        const radius = e.target.value;
        document.getElementById('radius-value').textContent = (radius / 1000).toFixed(1);
        this.geoFenceRadius = parseInt(radius);
    }
    
    async saveSetup() {
        if (!this.branchLocation) {
            this.showToast('Please set branch location first', 'error');
            return;
        }
        
        await this.saveSetting('branchLocation', this.branchLocation);
        await this.saveSetting('geoFenceRadius', this.geoFenceRadius);
        
        this.showToast('Setup saved successfully', 'success');
        this.navigateTo('home');
        this.startTracking();
    }
    
    // ===================================
    // Geocoding
    // ===================================
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        } catch (error) {
            return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
    }
    
    // ===================================
    // Visit Management
    // ===================================
    async saveVisit() {
        const selectedPurpose = document.querySelector('.purpose-btn.selected');
        if (!selectedPurpose) {
            this.showToast('Please select a purpose', 'error');
            return;
        }
        
        const purpose = selectedPurpose.dataset.purpose;
        const notes = document.getElementById('visit-notes').value.trim();
        const photoFile = document.getElementById('visit-photo').files[0];
        
        if (!this.pendingVisit) {
            this.showToast('No visit data available', 'error');
            return;
        }
        
        // Save visit to database
        const transaction = this.db.transaction(['visits', 'photos'], 'readwrite');
        const visitStore = transaction.objectStore('visits');
        
        const visit = {
            ...this.pendingVisit,
            purpose,
            notes,
            classified: true
        };
        
        const request = visitStore.add(visit);
        
        request.onsuccess = async () => {
            const visitId = request.result;
            
            // Save photo if exists
            if (photoFile) {
                const photoStore = transaction.objectStore('photos');
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoStore.add({
                        visitId,
                        data: e.target.result
                    });
                };
                reader.readAsDataURL(photoFile);
            }
            
            this.showToast('Visit saved successfully', 'success');
            this.closeClassifyModal();
            this.loadTodayStats();
            this.loadRecentVisits();
        };
        
        request.onerror = () => {
            this.showToast('Failed to save visit', 'error');
        };
    }
    
    selectPurpose(e) {
        document.querySelectorAll('.purpose-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        e.currentTarget.classList.add('selected');
    }
    
    handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('photo-preview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Visit photo">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }
    
    closeClassifyModal() {
        document.getElementById('classify-modal').classList.remove('active');
        document.getElementById('visit-notes').value = '';
        document.getElementById('visit-photo').value = '';
        document.getElementById('photo-preview').style.display = 'none';
        document.getElementById('photo-preview').innerHTML = '';
        document.querySelectorAll('.purpose-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.pendingVisit = null;
    }
    
    // ===================================
    // Data Loading
    // ===================================
    async loadTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const visits = await this.getVisitsByDate(today);
        
        let totalKm = 0;
        let totalMinutes = 0;
        
        visits.forEach(visit => {
            totalKm += visit.distance || 0;
            totalMinutes += visit.duration || 0;
        });
        
        document.getElementById('today-km').textContent = totalKm.toFixed(1);
        document.getElementById('today-visits').textContent = visits.length;
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        document.getElementById('today-hours').textContent = `${hours}h ${minutes}m`;
    }
    
    async loadRecentVisits() {
        const today = new Date().toISOString().split('T')[0];
        const visits = await this.getVisitsByDate(today);
        
        const container = document.getElementById('recent-visits');
        
        if (visits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7v10c0 5.5 3.8 9.7 10 11 6.2-1.3 10-5.5 10-11V7l-10-5z"/>
                    </svg>
                    <p>No visits recorded today</p>
                </div>
            `;
        } else {
            container.innerHTML = visits.map(visit => this.renderVisitItem(visit)).join('');
        }
    }
    
    async loadAllVisits() {
        const visits = await this.getAllVisits();
        const container = document.getElementById('all-visits');
        
        if (visits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L2 7v10c0 5.5 3.8 9.7 10 11 6.2-1.3 10-5.5 10-11V7l-10-5z"/>
                    </svg>
                    <p>No visits recorded</p>
                </div>
            `;
        } else {
            container.innerHTML = visits.reverse().map(visit => this.renderVisitItem(visit)).join('');
        }
    }
    
    renderVisitItem(visit) {
        const purposeLabels = {
            govt: 'Govt Meeting',
            official: 'Official Meeting',
            customer: 'Customer Meeting',
            'pre-sanction': 'Pre-Sanction Inspection',
            'post-sanction': 'Post-Sanction Inspection',
            followup: 'Lead Follow-up',
            notice: 'Notice Serve',
            recovery: 'Recovery Visit',
            others: 'Others'
        };
        
        const purposeIcons = {
            govt: '🏛️',
            official: '💼',
            customer: '👥',
            'pre-sanction': '📋',
            'post-sanction': '✅',
            followup: '📞',
            notice: '📄',
            recovery: '💰',
            others: '📌'
        };
        
        return `
            <div class="visit-item">
                <div class="visit-header">
                    <div class="visit-purpose">
                        <span>${purposeIcons[visit.purpose] || '📌'}</span>
                        ${purposeLabels[visit.purpose] || visit.purpose}
                    </div>
                    <div class="visit-time">${this.formatTime(visit.timeIn)}</div>
                </div>
                <div class="visit-details">
                    <div class="visit-detail">
                        ⏱️ ${this.formatDuration(visit.duration)}
                    </div>
                    <div class="visit-detail">
                        📍 ${(visit.distance || 0).toFixed(1)} km
                    </div>
                </div>
                ${visit.address ? `<div class="visit-location">${visit.address}</div>` : ''}
                ${visit.notes ? `<div class="visit-location">${visit.notes}</div>` : ''}
            </div>
        `;
    }
    
    // ===================================
    // Database Queries
    // ===================================
    async getVisitsByDate(date) {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['visits'], 'readonly');
            const store = transaction.objectStore('visits');
            const index = store.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }
    
    async getAllVisits() {
        return new Promise((resolve) => {
            const transaction = this.db.transaction(['visits'], 'readonly');
            const store = transaction.objectStore('visits');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }
    
    // ===================================
    // Utilities
    // ===================================
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                ${type === 'success' ? '<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>' : 
                  type === 'error' ? '<path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>' :
                  '<path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>'}
            </svg>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
    
    toggleFilters() {
        const filterBar = document.getElementById('filter-bar');
        filterBar.style.display = filterBar.style.display === 'none' ? 'flex' : 'none';
    }
    
    filterVisits() {
        // Implementation for filtering
        this.loadAllVisits();
    }
    
    populateMonthFilter() {
        const select = document.getElementById('month-filter');
        const currentDate = new Date();
        const options = ['<option value="all">All Months</option>'];
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const value = date.toISOString().slice(0, 7);
            const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            options.push(`<option value="${value}">${label}</option>`);
        }
        
        select.innerHTML = options.join('');
    }
    
    updateDashboard(period) {
        // Implementation for dashboard updates
        console.log('Updating dashboard for period:', period);
    }
    
    setDefaultExportMonth() {
        const input = document.getElementById('export-month');
        const currentMonth = new Date().toISOString().slice(0, 7);
        input.value = currentMonth;
    }
    
    exportToExcel() {
        this.showToast('Excel export will be implemented', 'info');
    }
    
    exportToPDF() {
        this.showToast('PDF export will be implemented', 'info');
    }
    
    // ===================================
    // Exclusion Zones
    // ===================================
    openExclusionModal() {
        document.getElementById('exclusion-name').value = '';
        document.getElementById('exclusion-lat').value = '';
        document.getElementById('exclusion-lng').value = '';
        document.getElementById('exclusion-radius').value = 200;
        document.getElementById('exclusion-radius-value').textContent = '200';
        document.getElementById('exclusion-location-preview').style.display = 'none';
        this._exclusionCoords = null;
        document.getElementById('exclusion-modal').classList.add('active');
    }

    closeExclusionModal() {
        document.getElementById('exclusion-modal').classList.remove('active');
    }

    async exclusionUseGPS() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported', 'error');
            return;
        }

        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                document.getElementById('exclusion-lat').value = lat.toFixed(6);
                document.getElementById('exclusion-lng').value = lng.toFixed(6);
                this._exclusionCoords = { lat, lng };

                const address = await this.reverseGeocode(lat, lng);
                const preview = document.getElementById('exclusion-location-preview');
                preview.querySelector('.location-status').textContent = `✓ ${address.substring(0, 60)}`;
                preview.style.display = 'block';

                this.hideLoading();
                this.showToast('Location captured', 'success');
            },
            (error) => {
                this.hideLoading();
                this.showToast('Could not get location: ' + error.message, 'error');
            },
            { enableHighAccuracy: true }
        );
    }

    async saveExclusion() {
        const name = document.getElementById('exclusion-name').value.trim();
        const lat = parseFloat(document.getElementById('exclusion-lat').value);
        const lng = parseFloat(document.getElementById('exclusion-lng').value);
        const radius = parseInt(document.getElementById('exclusion-radius').value);

        if (!name) {
            this.showToast('Please enter a place name', 'error');
            return;
        }
        if (isNaN(lat) || isNaN(lng)) {
            this.showToast('Please set a location', 'error');
            return;
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            this.showToast('Coordinates out of range', 'error');
            return;
        }

        const zone = {
            id: Date.now(),
            name,
            lat,
            lng,
            radius
        };

        this.exclusionZones.push(zone);
        await this.saveSetting('exclusionZones', this.exclusionZones);

        this.showToast(`"${name}" added to excluded places`, 'success');
        this.closeExclusionModal();
        this.renderExclusionList();
    }

    async removeExclusion(id) {
        this.exclusionZones = this.exclusionZones.filter(z => z.id !== id);
        await this.saveSetting('exclusionZones', this.exclusionZones);
        this.renderExclusionList();
        this.showToast('Place removed', 'success');
    }

    renderExclusionList() {
        const container = document.getElementById('exclusion-list');
        if (!this.exclusionZones || this.exclusionZones.length === 0) {
            container.innerHTML = `
                <div class="empty-state-sm">
                    <p>No excluded places yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.exclusionZones.map(zone => `
            <div class="exclusion-item">
                <div class="exclusion-info">
                    <div class="exclusion-name">${zone.name}</div>
                    <div class="exclusion-meta">${zone.radius}m radius</div>
                </div>
                <button class="exclusion-remove" data-id="${zone.id}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Attach delete handlers
        container.querySelectorAll('.exclusion-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                this.removeExclusion(id);
            });
        });
    }

    isInExclusionZone(lat, lng) {
        if (!this.exclusionZones || this.exclusionZones.length === 0) return false;

        for (const zone of this.exclusionZones) {
            const R = 6371e3;
            const p1 = lat * Math.PI / 180;
            const p2 = zone.lat * Math.PI / 180;
            const dp = (zone.lat - lat) * Math.PI / 180;
            const dl = (zone.lng - lng) * Math.PI / 180;
            const a = Math.sin(dp/2) * Math.sin(dp/2) +
                      Math.cos(p1) * Math.cos(p2) *
                      Math.sin(dl/2) * Math.sin(dl/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;

            if (distance <= zone.radius) {
                console.log(`Location is within exclusion zone "${zone.name}" (${distance.toFixed(0)}m away, radius: ${zone.radius}m)`);
                return true;
            }
        }
        return false;
    }

    // ===================================
    // Manual Tour Entry
    // ===================================
    openManualEntry() {
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('manual-entry-date').value = today;

        // Set default times
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('manual-entry-time-out').value = `${hours}:${minutes}`;
        document.getElementById('manual-entry-time-in').value = '';

        // Clear other fields
        document.getElementById('manual-entry-address').value = '';
        document.getElementById('manual-entry-distance').value = '';
        document.getElementById('manual-entry-notes').value = '';
        document.getElementById('manual-entry-photo').value = '';
        document.getElementById('manual-entry-photo-preview').style.display = 'none';
        document.getElementById('manual-entry-photo-preview').innerHTML = '';
        document.querySelectorAll('#manual-purpose-grid .purpose-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        document.getElementById('manual-entry-modal').classList.add('active');
    }

    closeManualEntry() {
        document.getElementById('manual-entry-modal').classList.remove('active');
    }

    selectManualPurpose(e) {
        document.querySelectorAll('#manual-purpose-grid .purpose-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        e.currentTarget.classList.add('selected');
    }

    async manualEntryUseGPS() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported', 'error');
            return;
        }

        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const address = await this.reverseGeocode(lat, lng);
                document.getElementById('manual-entry-address').value = address;
                this.hideLoading();
                this.showToast('Location captured', 'success');
            },
            (error) => {
                this.hideLoading();
                this.showToast('Could not get location: ' + error.message, 'error');
            },
            { enableHighAccuracy: true }
        );
    }

    handleManualEntryPhoto(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('manual-entry-photo-preview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Visit photo">`;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    async saveManualEntry() {
        const date = document.getElementById('manual-entry-date').value;
        const timeOut = document.getElementById('manual-entry-time-out').value;
        const timeIn = document.getElementById('manual-entry-time-in').value;
        const address = document.getElementById('manual-entry-address').value.trim();
        const distance = parseFloat(document.getElementById('manual-entry-distance').value) || 0;
        const notes = document.getElementById('manual-entry-notes').value.trim();
        const photoFile = document.getElementById('manual-entry-photo').files[0];

        const selectedPurpose = document.querySelector('#manual-purpose-grid .purpose-btn.selected');

        // Validation
        if (!date) {
            this.showToast('Please select a date', 'error');
            return;
        }
        if (!timeOut) {
            this.showToast('Please enter time out', 'error');
            return;
        }
        if (!selectedPurpose) {
            this.showToast('Please select a purpose', 'error');
            return;
        }

        const purpose = selectedPurpose.dataset.purpose;

        // Calculate timestamps
        const timeOutDate = new Date(`${date}T${timeOut}`);
        let duration = 0;
        let timeInTimestamp = null;

        if (timeIn) {
            const timeInDate = new Date(`${date}T${timeIn}`);
            timeInTimestamp = timeInDate.getTime();
            duration = Math.round((timeInDate - timeOutDate) / 60000); // minutes
            if (duration < 0) {
                this.showToast('Time In must be after Time Out', 'error');
                return;
            }
        }

        const visit = {
            date: date,
            timeIn: timeOutDate.getTime(),
            timeOut: timeInTimestamp,
            duration: duration,
            lat: null,
            lng: null,
            address: address || 'Manual entry',
            distance: distance,
            purpose: purpose,
            notes: notes,
            classified: true,
            manual: true
        };

        // Save to database
        const transaction = this.db.transaction(['visits', 'photos'], 'readwrite');
        const visitStore = transaction.objectStore('visits');
        const request = visitStore.add(visit);

        request.onsuccess = async () => {
            const visitId = request.result;

            if (photoFile) {
                const photoStore = transaction.objectStore('photos');
                const reader = new FileReader();
                reader.onload = (e) => {
                    photoStore.add({
                        visitId,
                        data: e.target.result
                    });
                };
                reader.readAsDataURL(photoFile);
            }

            this.showToast('Tour entry added successfully', 'success');
            this.closeManualEntry();
            this.loadTodayStats();
            this.loadRecentVisits();
        };

        request.onerror = () => {
            this.showToast('Failed to save entry', 'error');
        };
    }

    openSettings() {
        this.navigateTo('setup');
    }
    
    startTracking() {
        // Tracking will be handled by tracking.js
        console.log('Tracking started');
    }
}

// ===================================
// Initialize App
// ===================================
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TourRegisterApp();
});
