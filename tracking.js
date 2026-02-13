// ===================================
// GPS Tracking & Geo-Fence Module
// ===================================

class GPSTracker {
    constructor(app) {
        this.app = app;
        this.watchId = null;
        this.isOutsideGeofence = false;
        this.lastPosition = null;
        this.stationaryStartTime = null;
        this.stationaryThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.movementThreshold = 50; // meters
        this.totalDistance = 0;
        this.currentVisitStartTime = null;
        this.visitHistory = [];
        
        this.init();
    }
    
    // ===================================
    // Initialization
    // ===================================
    init() {
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            this.app.showToast('GPS not available on this device', 'error');
            return;
        }
        
        // Request permission for background location
        this.requestLocationPermission();
    }
    
    async requestLocationPermission() {
        try {
            // Check if permissions API is available
            if ('permissions' in navigator) {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                console.log('Location permission status:', result.state);
                
                if (result.state === 'granted') {
                    this.startTracking();
                } else if (result.state === 'prompt') {
                    // Will prompt when we start tracking
                    this.startTracking();
                }
            } else {
                // Fallback for browsers without permissions API
                this.startTracking();
            }
        } catch (error) {
            console.error('Permission check failed:', error);
            this.startTracking();
        }
    }
    
    // ===================================
    // Tracking Control
    // ===================================
    startTracking() {
        if (this.watchId !== null) {
            console.log('Tracking already active');
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
        };
        
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handlePositionError(error),
            options
        );
        
        console.log('GPS tracking started');
        this.updateTrackingStatus('Tracking active');
    }
    
    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            console.log('GPS tracking stopped');
        }
    }
    
    // ===================================
    // Position Updates
    // ===================================
    handlePositionUpdate(position) {
        const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
        };
        
        console.log('Position update:', coords);
        
        // Check geofence status
        this.checkGeofence(coords);
        
        // Track movement if outside geofence
        if (this.isOutsideGeofence) {
            this.trackMovement(coords);
        }
        
        this.lastPosition = coords;
    }
    
    handlePositionError(error) {
        console.error('Position error:', error);
        
        let message = 'GPS error';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location permission denied. Please enable GPS.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable. Check GPS signal.';
                break;
            case error.TIMEOUT:
                message = 'Location request timeout.';
                break;
        }
        
        this.updateTrackingStatus(message);
    }
    
    // ===================================
    // Geofence Logic
    // ===================================
    checkGeofence(coords) {
        if (!this.app.branchLocation) {
            return;
        }
        
        const distance = this.calculateDistance(
            coords.lat,
            coords.lng,
            this.app.branchLocation.lat,
            this.app.branchLocation.lng
        );
        
        const wasOutside = this.isOutsideGeofence;
        this.isOutsideGeofence = distance > this.app.geoFenceRadius;
        
        // State change: entering field
        if (!wasOutside && this.isOutsideGeofence) {
            console.log('Exited geofence - starting field tracking');
            this.onEnterField(coords);
        }
        
        // State change: returning to branch
        if (wasOutside && !this.isOutsideGeofence) {
            console.log('Entered geofence - stopped field tracking');
            this.onReturnToBranch(coords);
        }
        
        // Update status display
        this.updateGeofenceStatus(distance);
    }
    
    onEnterField(coords) {
        this.totalDistance = 0;
        this.visitHistory = [];
        this.stationaryStartTime = null;
        this.currentVisitStartTime = Date.now();
        
        this.updateTrackingStatus('Field tracking active');
        this.app.showToast('Started field tracking', 'info');
    }
    
    onReturnToBranch(coords) {
        if (this.currentVisitStartTime) {
            const duration = Math.floor((Date.now() - this.currentVisitStartTime) / 60000);
            console.log(`Field visit ended. Duration: ${duration} mins, Distance: ${this.totalDistance.toFixed(1)} km`);
        }
        
        this.stationaryStartTime = null;
        this.currentVisitStartTime = null;
        
        this.updateTrackingStatus('Inside branch - tracking paused');
        this.app.showToast('Returned to branch', 'info');
    }
    
    // ===================================
    // Movement Detection
    // ===================================
    trackMovement(coords) {
        if (!this.lastPosition) {
            return;
        }
        
        // Calculate distance from last position
        const distance = this.calculateDistance(
            this.lastPosition.lat,
            this.lastPosition.lng,
            coords.lat,
            coords.lng
        );
        
        // Check if user is moving or stationary
        if (distance < this.movementThreshold) {
            // Stationary
            if (!this.stationaryStartTime) {
                this.stationaryStartTime = Date.now();
                console.log('User became stationary');
            } else {
                // Check if stationary threshold exceeded
                const stationaryDuration = Date.now() - this.stationaryStartTime;
                if (stationaryDuration >= this.stationaryThreshold) {
                    this.onStopDetected(coords);
                }
            }
        } else {
            // Moving
            if (this.stationaryStartTime) {
                console.log('User resumed movement');
                this.stationaryStartTime = null;
            }
            
            // Accumulate distance
            this.totalDistance += distance / 1000; // Convert to km
        }
    }
    
    // ===================================
    // Stop Detection & Visit Logging
    // ===================================
    async onStopDetected(coords) {
        console.log('Stop detected at:', coords);

        // Reset stationary timer
        this.stationaryStartTime = null;

        // Check if location is within an exclusion zone
        if (this.app.isInExclusionZone(coords.lat, coords.lng)) {
            console.log('Stop is inside an excluded place - skipping visit prompt');
            return;
        }

        // Calculate visit duration
        const timeIn = Date.now();
        const duration = 10; // Minimum 10 minutes

        // Reverse geocode address
        const address = await this.app.reverseGeocode(coords.lat, coords.lng);

        // Create pending visit
        this.app.pendingVisit = {
            date: new Date().toISOString().split('T')[0],
            timeIn: timeIn,
            timeOut: null, // Will be updated when user leaves
            duration: duration,
            lat: coords.lat,
            lng: coords.lng,
            address: address,
            distance: this.totalDistance,
            classified: false
        };

        // Show classification modal
        this.showClassificationNotification(coords, address);
    }
    
    showClassificationNotification(coords, address) {
        // Update modal with visit info
        const timeDisplay = new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        document.getElementById('visit-time-display').textContent = 
            `${timeDisplay} • ${address.substring(0, 50)}...`;
        
        // Show modal
        document.getElementById('classify-modal').classList.add('active');
        
        // Also show a notification toast
        this.app.showToast('Stop detected. Please classify your visit.', 'info');
        
        // Vibrate if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }
    
    // ===================================
    // Distance Calculation (Haversine)
    // ===================================
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c; // Distance in meters
    }
    
    // ===================================
    // UI Updates
    // ===================================
    updateTrackingStatus(message) {
        const statusText = document.getElementById('location-status-text');
        if (statusText) {
            statusText.textContent = message;
        }
    }
    
    updateGeofenceStatus(distance) {
        const statusCard = document.getElementById('tracking-status');
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');
        
        if (this.isOutsideGeofence) {
            statusText.textContent = 'On Field Visit';
            statusDot.style.background = 'var(--warning)';
            this.updateTrackingStatus(`${(distance / 1000).toFixed(1)} km from branch`);
        } else {
            statusText.textContent = 'Inside Branch';
            statusDot.style.background = 'var(--success)';
            this.updateTrackingStatus('GPS tracking paused');
        }
    }
    
    // ===================================
    // Daily Summary Notification
    // ===================================
    async scheduleDailySummary() {
        // Check if it's 8 PM
        const now = new Date();
        const targetTime = new Date();
        targetTime.setHours(20, 0, 0, 0); // 8:00 PM
        
        let delay = targetTime - now;
        if (delay < 0) {
            // If it's past 8 PM, schedule for next day
            delay += 24 * 60 * 60 * 1000;
        }
        
        setTimeout(async () => {
            await this.showDailySummary();
            // Schedule next summary
            this.scheduleDailySummary();
        }, delay);
    }
    
    async showDailySummary() {
        const today = new Date().toISOString().split('T')[0];
        const visits = await this.app.getVisitsByDate(today);
        
        const message = `You had ${visits.length} visit${visits.length !== 1 ? 's' : ''} today. Please verify in the app.`;
        
        // Show notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Tour Register - Daily Summary', {
                body: message,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                vibrate: [200, 100, 200]
            });
        }
        
        // Also show toast
        this.app.showToast(message, 'info');
    }
    
    // ===================================
    // Request Notification Permission
    // ===================================
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
}

// ===================================
// Initialize Tracker
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to initialize
    setTimeout(() => {
        if (window.app) {
            window.tracker = new GPSTracker(window.app);
            window.tracker.requestNotificationPermission();
            window.tracker.scheduleDailySummary();
        }
    }, 1000);
});
