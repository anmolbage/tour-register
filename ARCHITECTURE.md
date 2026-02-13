# 🏗️ Tour Register PWA - Project Architecture

## 📋 Project Overview

**Name**: Tour Register - Branch Manager Field Tracker  
**Type**: Progressive Web Application (PWA)  
**Purpose**: GPS-based field visit tracking for bank branch managers  
**Platform**: Mobile-first (Android/iOS compatible)  
**Storage**: Offline-first with IndexedDB  
**Deployment**: Static hosting (GitHub Pages, Netlify, etc.)

## 🎯 Core Requirements Met

✅ Single-user only (no multi-branch support)  
✅ No customer financial data storage  
✅ Only visit logs and purpose classification  
✅ Works offline (offline-first architecture)  
✅ Installable on Android home screen (PWA)  
✅ 4-digit PIN login security  
✅ Local data storage (IndexedDB)  
✅ No cloud sync (optional future feature)  
✅ GPS geo-fencing with configurable radius  
✅ Automatic stop detection (10 minutes stationary)  
✅ Auto-logging of visit details  
✅ Visit classification with 9 categories  
✅ Photo capture capability  
✅ Dashboard with statistics  
✅ Excel and PDF export  

## 📁 File Structure

```
tour-register/
│
├── index.html              # Main application structure
│   ├── Login screen with PIN pad
│   ├── Branch setup screen
│   ├── Home dashboard
│   ├── Visits history
│   ├── Dashboard analytics
│   ├── Export screen
│   └── Visit classification modal
│
├── styles.css              # Mobile-first styling
│   ├── CSS variables (theme)
│   ├── Responsive layouts
│   ├── Animations & transitions
│   └── Component styles
│
├── app.js                  # Core application logic
│   ├── App initialization
│   ├── IndexedDB management
│   ├── PIN authentication
│   ├── Navigation system
│   ├── Visit management
│   ├── Data loading & filtering
│   └── UI utilities
│
├── tracking.js             # GPS tracking engine
│   ├── Geolocation API integration
│   ├── Geo-fence checking
│   ├── Movement detection
│   ├── Stop detection (10-min threshold)
│   ├── Distance calculation (Haversine)
│   ├── Visit auto-logging
│   └── Notification system
│
├── export.js               # Report generation
│   ├── Excel/CSV export
│   ├── PDF generation
│   ├── Data formatting
│   └── Download handling
│
├── sw.js                   # Service Worker
│   ├── Cache management
│   ├── Offline support
│   ├── Background sync
│   └── Push notifications
│
├── manifest.json           # PWA configuration
│   ├── App metadata
│   ├── Icons & theme
│   ├── Display settings
│   └── Permissions
│
├── icon.svg                # App icon source
├── create-icons.html       # Icon generator utility
├── README.md               # Complete documentation
└── DEPLOYMENT.md           # Deployment guide
```

## 🔄 Application Flow

### 1. First Time Launch
```
Open App
    ↓
No PIN exists
    ↓
Show "Set PIN" screen
    ↓
User enters 4-digit PIN
    ↓
PIN saved to IndexedDB
    ↓
Navigate to Branch Setup
    ↓
Set branch location (GPS or manual)
    ↓
Set geo-fence radius (0.5-5 km)
    ↓
Save settings
    ↓
Navigate to Home
    ↓
Start GPS tracking
```

### 2. Subsequent Launches
```
Open App
    ↓
Show PIN entry screen
    ↓
User enters PIN
    ↓
Verify against stored PIN
    ↓
If correct: Navigate to Home
    ↓
If incorrect: Show error, retry
```

### 3. Field Visit Flow
```
Manager at branch (inside geo-fence)
    ↓
GPS tracking paused
    ↓
Manager leaves branch
    ↓
Geo-fence exit detected
    ↓
Start tracking:
    - Distance traveled
    - Time elapsed
    - Current position
    ↓
Manager stops at customer location
    ↓
Stationary for 10 minutes
    ↓
Stop detected!
    ↓
Show classification modal:
    - Purpose selection
    - Optional notes
    - Optional photo
    ↓
User classifies visit
    ↓
Visit saved to IndexedDB
    ↓
Continue tracking...
    ↓
Manager returns to branch
    ↓
Geo-fence entry detected
    ↓
Stop tracking
    ↓
Update daily statistics
```

## 🗄️ Data Architecture

### IndexedDB Schema

**Database**: `TourRegisterDB` (version 1)

**Object Stores**:

1. **settings**
   ```javascript
   {
     key: string,           // Primary key
     value: any            // Setting value
   }
   
   // Records:
   // - pin: "1234"
   // - branchLocation: { lat: 23.7957, lng: 85.5166 }
   // - geoFenceRadius: 1000
   ```

2. **visits**
   ```javascript
   {
     id: number,           // Auto-increment primary key
     date: string,         // "2024-01-15"
     timeIn: number,       // Unix timestamp
     timeOut: number,      // Unix timestamp (nullable)
     duration: number,     // Minutes
     lat: number,          // Latitude
     lng: number,          // Longitude
     address: string,      // Reverse geocoded address
     distance: number,     // Kilometers traveled
     purpose: string,      // Visit category
     notes: string,        // Optional notes
     classified: boolean   // Whether user classified it
   }
   
   // Indexes:
   // - date (for filtering by date)
   // - purpose (for filtering by type)
   ```

3. **photos**
   ```javascript
   {
     visitId: number,      // Primary key (references visit.id)
     data: string          // Base64 encoded image
   }
   ```

## 🎨 Design System

### Color Palette
```css
Primary:     #1a472a (Banking Green - Dark)
             #2d5f3f (Banking Green - Light)
             
Secondary:   #d4af37 (Gold)
             #e8c968 (Gold - Light)

Success:     #22c55e
Warning:     #f59e0b
Danger:      #ef4444
Info:        #3b82f6

Background:  #f8faf9 (Off-white)
Card:        #ffffff (White)
Text:        #0f172a (Dark slate)
```

### Typography
```css
Display: 'Outfit' (Headers, UI elements)
  - Weights: 400, 500, 600, 700, 800
  - Modern, geometric, professional

Monospace: 'JetBrains Mono' (Numbers, data)
  - Weights: 400, 600
  - Clear, technical, precise
```

### Spacing System
```css
Gap Units: 4px base
  - xs: 4px
  - sm: 8px
  - md: 12px
  - lg: 16px
  - xl: 24px
  - 2xl: 32px
```

### Border Radius
```css
Small: 12px (Buttons, inputs)
Default: 16px (Cards)
Large: 24px (Modals)
```

## ⚙️ Key Technologies

### Frontend
- **HTML5**: Semantic structure, accessibility
- **CSS3**: Flexbox, Grid, CSS Variables, Animations
- **JavaScript (ES6+)**: Classes, Async/Await, Promises

### APIs Used
- **Geolocation API**: GPS tracking
- **IndexedDB API**: Local data storage
- **Service Worker API**: Offline support
- **Notification API**: Visit alerts
- **File API**: Photo capture
- **Canvas API**: Icon generation

### PWA Features
- **Manifest**: Installability, theming
- **Service Worker**: Caching, offline-first
- **HTTPS**: Required for PWA (except localhost)

## 🔐 Security Considerations

### Data Protection
1. **Local Storage Only**
   - No cloud transmission
   - All data stays on device
   - User controls data deletion

2. **PIN Authentication**
   - 4-digit numeric PIN
   - Stored hashed in IndexedDB
   - No forgot PIN feature (intentional)

3. **No Sensitive Data**
   - No customer financial info
   - No loan details
   - Only visit metadata

### Privacy
1. **Location Data**
   - Used only for geo-fencing
   - Not transmitted anywhere
   - User can clear anytime

2. **Photos**
   - Stored as base64 in IndexedDB
   - Not uploaded anywhere
   - User discretion required

## 📱 Mobile Optimizations

### Performance
- **Minimal Dependencies**: No frameworks (React, Vue, etc.)
- **Small Bundle**: ~200KB initial load
- **Lazy Loading**: Service Worker caching
- **Efficient Storage**: IndexedDB vs localStorage

### UX Considerations
- **One-Hand Operation**: Bottom navigation
- **Large Touch Targets**: 44x44px minimum
- **Thumb-Friendly**: Important actions at bottom
- **Minimal Typing**: Tap-based interactions

### Battery Optimization
- **Passive GPS**: Uses watchPosition with timeout
- **Smart Tracking**: Only active outside geo-fence
- **Efficient Updates**: 30-second position refresh

## 🌐 Browser Compatibility

### Fully Supported
- ✅ Chrome 80+ (Android/Desktop)
- ✅ Edge 80+ (Windows/Android)
- ✅ Safari 13+ (iOS/macOS)
- ✅ Firefox 75+ (Android/Desktop)

### Required Features
- IndexedDB
- Geolocation API
- Service Workers
- ES6+ JavaScript
- CSS Grid & Flexbox

### Progressive Enhancement
- Works without notifications
- Works without photo capture
- Graceful GPS failure handling

## 📊 Performance Metrics

### Target Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Storage Limits
- **Visit Records**: ~1KB each
- **Photos**: ~50-200KB each (base64)
- **Total Quota**: Typically 50-100MB on mobile
- **Estimated Capacity**: 5,000+ visits without photos

## 🔄 Offline Capabilities

### What Works Offline
✅ Complete app functionality  
✅ View all past visits  
✅ Record new visits  
✅ Generate exports  
✅ Take photos  
✅ Update settings  

### What Needs Internet
❌ Reverse geocoding (address lookup)  
❌ Initial manifest download  
❌ First-time font loading  

### Offline Strategy
1. **Cache First**: Static assets
2. **Network First**: API calls (with cache fallback)
3. **Background Sync**: Future cloud sync

## 🚀 Deployment Options

### Static Hosting (Recommended)
- GitHub Pages (Free)
- Netlify (Free)
- Vercel (Free)
- Firebase Hosting (Free tier)

### Requirements
- ✅ HTTPS support (auto with above)
- ✅ Static file serving
- ✅ No server-side code needed
- ✅ No database required

### Custom Domain (Optional)
- Point CNAME to hosting provider
- Automatic SSL certificate
- Professional URL

## 🎯 Use Cases

### Primary Use Case
**Branch Manager Daily Field Visits**
- Leave branch for customer meetings
- App auto-detects stops
- Classify purpose quickly
- Generate monthly report

### Secondary Use Cases
1. **Pre/Post Sanction Inspections**
   - Document site visits
   - Capture location proof
   - Add inspection notes

2. **Recovery Visits**
   - Track NPA follow-ups
   - Document visit attempts
   - Build visit history

3. **Lead Generation**
   - Log prospect meetings
   - Track follow-up visits
   - Measure effort vs conversion

## 📈 Future Enhancement Ideas

### Phase 2 (3-6 months)
- [ ] Cloud backup (optional)
- [ ] Photo compression
- [ ] Voice notes
- [ ] Route replay on map
- [ ] Biometric auth option

### Phase 3 (6-12 months)
- [ ] Team visit sharing
- [ ] Manager dashboard (web)
- [ ] Target tracking
- [ ] Visit reminders
- [ ] Analytics insights

## 🐛 Known Limitations

1. **GPS Accuracy**
   - Depends on device capability
   - Poor indoors
   - Battery saver mode affects precision

2. **Stop Detection**
   - Fixed 10-minute threshold
   - Can't distinguish quick stops
   - May miss very short visits

3. **Storage Quota**
   - Browser-dependent limits
   - Photos consume space quickly
   - No automatic cleanup

4. **No Multi-User**
   - Single device = single user
   - No team collaboration
   - No visit sharing

## 📚 Documentation

1. **README.md**: Complete user guide
2. **DEPLOYMENT.md**: Setup instructions
3. **This file**: Architecture overview
4. **Code comments**: Inline documentation

## ✅ Testing Checklist

### Functional Testing
- [ ] PIN setup works
- [ ] Branch location setting
- [ ] Geo-fence detection
- [ ] Stop detection (10 min)
- [ ] Visit classification
- [ ] Photo capture
- [ ] Data persistence
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Offline mode

### Performance Testing
- [ ] Load time < 3s
- [ ] Smooth scrolling
- [ ] No memory leaks
- [ ] Battery impact minimal

### Compatibility Testing
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Different screen sizes
- [ ] Landscape mode
- [ ] Low-end devices

## 🎓 Learning Resources

**For understanding the code:**
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- Geolocation: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- PWA: https://web.dev/progressive-web-apps/

**For customization:**
- CSS Variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- Flexbox: https://css-tricks.com/snippets/css/a-guide-to-flexbox/
- Grid: https://css-tricks.com/snippets/css/complete-guide-grid/

---

**Built for**: JRGB Branch Managers  
**Purpose**: Efficient field work tracking  
**Vision**: Reduce paperwork, increase accountability  
**Impact**: Better time management, accurate reporting

*Last Updated: January 2025*
