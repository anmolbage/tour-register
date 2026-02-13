# 📍 Tour Register PWA

A mobile-first Progressive Web App for Bank Branch Managers to digitally maintain field visit records with GPS tracking, offline support, and automated visit logging.

## 🎯 Features

### Core Functionality
- ✅ **PIN Authentication** - Secure 4-digit PIN login
- 📍 **GPS Geo-Fencing** - Automatic tracking when outside branch radius
- 🚗 **Auto-Stop Detection** - Detects stationary stops after 10 minutes
- 📝 **Visit Classification** - One-tap categorization of field visits
- 📊 **Dashboard Analytics** - View KM, hours, and visit statistics
- 📤 **Export Reports** - Generate Excel and PDF tour registers
- 🔌 **Offline-First** - Works completely offline with IndexedDB storage
- 📱 **PWA Installable** - Add to Android home screen

### Visit Purposes
- 🏛️ Government Meeting
- 💼 Official Meeting
- 👥 Customer Meeting
- 📋 Pre-Sanction Inspection
- ✅ Post-Sanction Inspection
- 📞 Lead Follow-up
- 📄 Notice Serve
- 💰 Recovery Visit
- 📌 Others

## 🚀 Installation

### For Users (Branch Managers)

1. **Open in Chrome Mobile**
   - Navigate to the hosted URL in Chrome
   - Or open `index.html` from a local web server

2. **Install to Home Screen**
   - Tap the menu (⋮) in Chrome
   - Select "Add to Home screen"
   - Tap "Add"

3. **First Time Setup**
   - Set your 4-digit PIN
   - Configure branch location (use current location or manual entry)
   - Set geo-fence radius (default: 1 km)

### For Developers (Hosting)

#### Option 1: GitHub Pages (Free)
```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/tour-register.git
git push -u origin main

# Enable GitHub Pages
# Go to repository Settings → Pages
# Source: main branch, / (root)
```

#### Option 2: Local Testing
```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then visit: http://localhost:8000
```

#### Option 3: Cloud Hosting
- Deploy to Netlify, Vercel, or Firebase Hosting
- Simply upload the entire `/tour-register` folder

## 📖 Usage Guide

### Initial Setup

1. **First Launch**
   - App opens to PIN setup screen
   - Enter a 4-digit PIN (remember this!)
   - PIN is stored locally in IndexedDB

2. **Branch Configuration**
   - Tap "Use Current Location" or enter coordinates manually
   - Adjust geo-fence radius using slider (0.5 - 5 km)
   - Tap "Save & Continue"

### Daily Operation

1. **Start Your Day**
   - Open the app
   - Enter your PIN
   - GPS tracking starts automatically

2. **Field Visits**
   - When you leave the geo-fence, tracking begins
   - App records distance traveled
   - After 10 minutes stationary, you'll get a notification
   - Classify your visit with one tap
   - Optionally add notes or photo

3. **Return to Branch**
   - Tracking pauses automatically when you're back
   - View your stats on the home screen

### Viewing Visits

- **Home Screen**: Today's visits and stats
- **Visits Tab**: Complete history with filters
  - Filter by month
  - Filter by purpose type

### Generating Reports

1. **Go to Export Tab**
2. **Select Month** (current month pre-selected)
3. **Choose Format**:
   - **Excel**: Downloads CSV file with all data
   - **PDF**: Opens print dialog for formatted report

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript
- **Storage**: IndexedDB (offline-first)
- **Location**: Geolocation API
- **PWA**: Service Workers for offline support
- **Fonts**: Outfit (display), JetBrains Mono (numbers)

### File Structure
```
tour-register/
├── index.html          # Main HTML structure
├── styles.css          # Mobile-first styling
├── app.js              # Core application logic
├── tracking.js         # GPS tracking & geofencing
├── export.js           # Excel/PDF generation
├── sw.js               # Service Worker
├── manifest.json       # PWA manifest
├── icon-192.png        # App icon (192x192)
├── icon-512.png        # App icon (512x512)
└── README.md           # This file
```

### Data Storage

**IndexedDB Stores:**
1. **settings**: PIN, branch location, geo-fence radius
2. **visits**: All field visit records
3. **photos**: Visit photos (base64)

**Visit Record Schema:**
```javascript
{
  id: autoIncrement,
  date: "2024-01-15",
  timeIn: timestamp,
  timeOut: timestamp,
  duration: minutes,
  lat: number,
  lng: number,
  address: string,
  distance: km,
  purpose: string,
  notes: string,
  classified: boolean
}
```

### Permissions Required
- **Geolocation**: For GPS tracking
- **Notifications**: For visit detection alerts

### Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (iOS 11.3+)
- ⚠️ Requires HTTPS for Service Workers (except localhost)

## 🎨 Customization

### Changing Theme Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #1a472a;      /* Banking green */
    --secondary: #d4af37;    /* Gold accent */
    /* Adjust as needed */
}
```

### Modifying Geo-Fence Settings
Default radius range: 500m - 5km
To change, edit in `index.html`:
```html
<input type="range" id="radius-slider" 
       min="500" max="5000" step="100" value="1000">
```

### Adding Visit Types
1. Add to purpose buttons in `index.html`
2. Update `purposeLabels` object in `app.js` and `export.js`
3. Add corresponding emoji icon

## 🔐 Security & Privacy

- **Local Storage Only**: All data stays on device
- **No Cloud Sync**: Zero data transmission (optional feature)
- **PIN Protected**: 4-digit PIN for app access
- **No Analytics**: No tracking or data collection
- **Open Source**: Full code transparency

## 🐛 Troubleshooting

### GPS Not Working
1. Check location permissions in Chrome settings
2. Ensure GPS is enabled on device
3. Check for strong GPS signal (outdoors preferred)

### App Won't Install
1. Open in Chrome (not browser, Chrome app)
2. Use HTTPS URL (required for PWA)
3. Check manifest.json is accessible

### Visits Not Saving
1. Check IndexedDB quota (Settings → Site Settings)
2. Clear browser cache and reinstall
3. Ensure sufficient storage on device

### Export Not Working
1. Check browser allows downloads
2. Ensure visits exist for selected month
3. Try different export format

## 📊 Performance

- **First Load**: ~200KB (with fonts)
- **Subsequent Loads**: <10KB (cached)
- **Storage**: ~1KB per visit record
- **Battery Impact**: Low (uses passive GPS updates)

## 🔮 Future Enhancements

Potential features (not implemented):
- [ ] Cloud backup & sync
- [ ] Multi-device support
- [ ] Photo compression
- [ ] Route replay on map
- [ ] Monthly targets tracking
- [ ] Team visit sharing
- [ ] Voice notes
- [ ] Biometric authentication

## 📄 License

This project is created for JRGB (Jharkhand Rajya Gramin Bank) internal use. Modify as needed for your organization.

## 🤝 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Ensure all files are properly hosted
4. Test in latest Chrome version first

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial release
- PIN authentication
- GPS geo-fencing
- Auto-stop detection
- Visit classification
- Dashboard analytics
- Excel/PDF export
- Offline support
- PWA installation

---

**Built with ❤️ for efficient field work management**

*Last Updated: January 2025*
