# ClearHire: Transparency in Hiring

**ClearHire** is a browser extension designed to promote transparency in hiring by helping you quickly identify potential job scams and red flags on major job boards, right in your browser. Using intelligent, client-side analysis, ClearHire gives you real-time insights so you can apply with confidence.

## Why ClearHire?

ClearHire acts as your personal transparency assistant, analyzing job descriptions as you browse and flagging common scam indicators and red flags. This MVP (Minimum Viable Product) uses a heuristic-based approach, meaning it applies a set of rules and patterns to detect red flags directly on the page, keeping your data private and secure.

## Features

- **Real-time Analysis**: Get instant feedback on job listings as you browse.
- **Intelligent Heuristics**: Our rule-based detection system is built to spot common scam patterns and indicators.
- **Indian Market Optimization**: Specialized detection for Indian job scams, salary formats (LPA, lakhs), and local patterns.
- **Clear Visual Feedback**: See analysis results directly on the job listing page, integrated seamlessly into your browsing experience.
- **User Reporting**: Help us improve! Report suspicious listings directly through the extension.
- **Privacy-First**: Your data stays with you. All analysis is performed client-side; no information is sent to external servers.
- **Local Storage**: Settings and reports are stored securely on your device.
- **Configurable Settings**: Adjust analysis sensitivity and display preferences.

## How It Works

ClearHire injects a content script into supported job board pages. This script:

1.  **Extracts Job Data**: It identifies and extracts key information like job title, company name, description, and salary details from the page.
2.  **Performs Heuristic Analysis**: It applies a series of pre-defined rules and pattern checks to the extracted data. These heuristics look for common red flags associated with job scams (e.g., poor grammar, unrealistic salary claims, vague company details, suspicious keywords).
3.  **Displays Results**: An analysis summary and risk score are displayed directly on the page, providing immediate feedback.
4.  **Popup Interface**: The extension popup allows you to manage settings, view job details, report listings, and re-trigger analysis.

All processing happens locally in your browser, ensuring your activity and job search data remain private.

## Screenshots

![App Screenshot](https://github.com/user-attachments/assets/6b6ecb2a-b39f-45e3-bdf6-312cae9fa457)

![App Screenshot](https://github.com/user-attachments/assets/3e4688d4-9c7b-4924-918a-a3c564cf90b9)

![App Screenshot](https://github.com/user-attachments/assets/927d1085-5d17-4caa-a736-546a847fb6eb)

## Supported Websites

ClearHire currently supports heuristic analysis on the following job boards:

- LinkedIn
- Indeed
- ZipRecruiter
- Naukri.com (India's largest job portal)

## Installation

Ready to empower your job search? Follow these simple steps to install ClearHire:

---

### Google Chrome

1.  **Download or clone** this repository to your local machine.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Toggle on **"Developer mode"** in the top right corner.
4.  Click **"Load unpacked"** and select the entire `redflag_v1-main` (or the name of the root folder) directory.
5.  The ClearHire icon should now appear in your browser's extensions toolbar.

---

### Mozilla Firefox

1.  **Download or clone** this repository.
2.  Open Firefox and go to `about:debugging`.
3.  In the left sidebar, click **"This Firefox"**.
4.  Click **"Load Temporary Add-on"** and select the `manifest.json` file from the `redflag_v1-main` (or root) folder.
5.  ClearHire will be loaded temporarily. **Note:** It will be removed when you close Firefox. For persistent installation, the extension would need to be packaged and signed.

---

### Microsoft Edge

1.  **Download or clone** this repository.
2.  Open Edge and go to `edge://extensions/`.
3.  Toggle on **"Developer mode"** in the left sidebar.
4.  Click **"Load unpacked"** and select the entire `redflag_v1-main` (or root) folder.
5.  You should now see ClearHire in your Edge extensions toolbar.

## Usage

1.  **Navigate**: Go to a job listing page on a supported website (e.g., LinkedIn, Indeed, Naukri.com).
2.  **Automatic Analysis**: ClearHire will automatically attempt to analyze the job listing. A status bar will appear on the page indicating the analysis progress and results.
3.  **Popup**:
    - Click the ClearHire icon in your browser's toolbar to open the popup.
    - View current job details and analysis status.
    - Adjust settings (enable/disable, analysis mode, show warnings).
    - Manually reanalyze the current job page.
    - Report suspicious job listings.

## 📂 Project Structure

Here's an overview of the key files in this project:

```
.
├── clearhire_logo.png     # Extension logo (ClearHire branding)
├── README.md             # This file
├── manifest.json         # Core extension configuration file
├── background.js         # Handles background tasks, message passing, storage
├── content_script.js     # Injects into job pages for analysis and UI
├── style.css             # Styles for both popup and content script elements
├── popup.html            # HTML structure for the extension popup
└── popup.js              # JavaScript logic for the extension popup
```

## 🎯 Detailed Usage Guide

### Getting Started

1. **Installation**: Follow the installation instructions above for your browser
2. **First Load**: Navigate to any supported job site (LinkedIn, Indeed, Naukri.com, ZipRecruiter)
3. **Automatic Detection**: ClearHire will automatically start analyzing job listings
4. **Visual Feedback**: Look for the ClearHire status bar on the job page

### Understanding the Analysis

ClearHire provides a comprehensive risk assessment based on multiple factors:

#### Risk Levels
- **🟢 Low Risk (0-19 points)**: Minor concerns, generally legitimate
- **🟡 Medium Risk (20-39 points)**: Some red flags, exercise caution
- **🔴 High Risk (40+ points)**: Multiple serious concerns, avoid or verify thoroughly

#### Detection Categories

**1. Title Analysis**
- Suspicious keywords (work from home, get rich quick, etc.)
- Unrealistic promises
- Urgency tactics

**2. Description Analysis**
- Grammar and formatting issues
- Fee-related language
- Contact method red flags
- Vague requirements

**3. Salary Analysis**
- Unrealistic amounts for role level
- Commission-only structures
- Vague terms like "competitive"
- Indian format detection (LPA, lakhs, ₹)

**4. Company Analysis**
- Generic or placeholder names
- Suspicious patterns
- Lack of online presence
- Generic suffixes (services, solutions)

### Settings & Customization

Access the ClearHire popup to customize:

- **Enable/Disable**: Toggle the extension on/off
- **Analysis Mode**: Choose between conservative and standard detection sensitivity
- **Show Warnings**: Control whether to display analysis overlays on pages
- **Report History**: View and manage your submitted reports

### Reporting Suspicious Listings

Help improve ClearHire by reporting:
1. Click the report button in the popup
2. Select the appropriate report category
3. Add optional comments about specific concerns
4. Submit to help train better detection patterns

## 🇮🇳 Indian Market Features

ClearHire includes specialized detection for the Indian job market:

### Salary Format Support
- **LPA Detection**: "12 LPA", "8.5 lakhs per annum"
- **Rupee Symbols**: ₹, rs, INR recognition
- **Local Conversions**: USD to INR equivalents (1 USD = 83 INR)

### Regional Scam Patterns
- **Data Entry Jobs**: Common work-from-home scam targeting
- **Telecaller Roles**: BPO and call center scam detection
- **Consultancy Fees**: Registration and placement fee scams
- **Immediate Payment**: Daily/weekly payment promises

### Company Name Analysis
- **BPO Services**: Detects generic BPO company names
- **HR Solutions**: Identifies suspicious HR consultancy patterns
- **Tech Solutions**: Flags generic technology company names
- **Placement Agencies**: Recognizes recruitment firm scams

## 🔧 Technical Implementation

### Architecture

**Content Script** (`content_script.js`)
- DOM manipulation and data extraction
- Heuristic analysis engine
- Real-time page observation
- Status overlay injection

**Background Script** (`background.js`)
- Message routing between components
- Local storage management
- Settings persistence
- Report handling

**Popup Interface** (`popup.html` + `popup.js`)
- User settings management
- Analysis results display
- Report submission
- Extension controls

### CSS Variables & Theming

The extension uses CSS custom properties for consistent theming:

```css
:root {
  --primary-color-hue: 7;
  --primary-color: hsl(var(--primary-color-hue), 75%, 50%);
  --success-color: hsl(120, 60%, 45%);
  --warning-color: hsl(35, 85%, 55%);
  --error-color: hsl(0, 70%, 50%);
}
```

### Detection Algorithms

**Grammar Analysis**
- Multiple punctuation detection (!!, ???)
- Capitalization issues
- Formatting problems
- Repetitive characters

**Salary Validation**
- Regex pattern matching for various formats
- Amount range validation by role type
- Currency conversion and comparison

**Company Name Scoring**
- Generic suffix detection
- Length and character analysis
- Pattern matching for known scam formats

## 🚀 Performance & Optimization

### Memory Management
- Efficient DOM querying with caching
- Debounced analysis to prevent excessive calls
- Optimized regex patterns

### Page Compatibility
- Multiple selector fallbacks per site
- Graceful degradation for missing elements
- Cross-browser compatibility testing

### Security Considerations
- No external API calls
- Local-only data processing
- Secure storage practices
- Input sanitization

## 🔍 Troubleshooting

### Common Issues

- **"Analysis Failed"**:
  - Ensure you are on a job details page of a supported website.
  - The page structure might have changed. Try the "Reanalyze" button in the popup.
  - Open your browser's developer console (usually F12) and look for error messages prefixed with "ClearHire:" for more details.
- **Status bar not appearing**:
  - Check if the extension is enabled in the popup and in your browser's extension manager.
  - The website might not be supported, or the content script might not have loaded correctly.
- **Logo not displaying**:
  - Verify that `clearhire_logo.png` file exists in the extension directory.
  - Check browser console for image loading errors.
  - Try reloading the extension.

### Debug Mode

Enable browser console logging to see detailed analysis:
1. Open developer tools (F12)
2. Look for "ClearHire:" prefixed messages
3. Check network tab for any blocked requests
4. Review storage in Application tab

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements, new features, or bug fixes, please consider the following:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or fix (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
4.  **Test your changes thoroughly.**
5.  **Commit your changes** (`git commit -am 'Add some feature'`).
6.  **Push to the branch** (`git push origin feature/your-feature-name`).
7.  **Create a new Pull Request.**

Please ensure your code follows the existing style and that any new features are well-documented.

### Development Guidelines

- Follow existing code patterns and naming conventions
- Test on all supported platforms (LinkedIn, Indeed, Naukri.com, ZipRecruiter)
- Maintain client-side only processing (no external servers)
- Update documentation for new features
- Consider Indian market specifics in detection logic

## 📞 Contact / Feedback

Encounter a bug? Have a suggestion?

- **Open an Issue**: If you've found a bug or have a feature request, please [open an issue on GitHub](https://github.com/R-LaRoi/redflag_v1/issues)
- **Feedback**: We appreciate your feedback to make ClearHire better!

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*ClearHire promotes transparency in hiring while protecting job seekers from scams. All analysis happens locally in your browser, ensuring complete privacy of your job search data.*
