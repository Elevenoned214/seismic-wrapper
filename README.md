# 🌊 SEISMIC WRAPPED 2024

Web application untuk membuat "wrapped" style card yang menampilkan kontribusi member komunitas SEISMIC di X (Twitter) dan Discord.

## ✨ Features

### **4 Scenes Animation:**
1. **Community Impact** - Discord messages + Total community posts
2. **Top 10 Posts** - Top 10 tweets dengan engagement terbesar
3. **Best Post Detail** - Detail tweet #1 dengan full metrics
4. **Magnitude Badge** - Badge achievement user

### **Keywords yang Dicari:**
- GMIC (#GMIC, $GMIC)
- SEISMIC (#SEISMIC, $SEISMIC) 
- @SeismicSys

### **Tech Stack:**
- Frontend: Vanilla HTML, CSS, JavaScript
- Backend: Vercel Serverless Functions
- API: SocialData.tools
- Deployment: Vercel

---

## 🚀 Quick Start

### **1. Clone/Download Project**
```bash
git clone <your-repo>
cd seismic-wrapped-v2
```

### **2. Get API Key**
1. Daftar di [SocialData.tools](https://socialdata.tools/)
2. Dapatkan API Key dari dashboard
3. Copy API Key Anda

### **3. Setup Environment Variable**

**Local Development:**
```bash
# Create .env file
cp .env.example .env

# Edit .env
SOCIALDATA_API_KEY=your_actual_api_key_here
```

**Production (Vercel):**
1. Push code ke GitHub
2. Import project ke Vercel
3. Go to: Settings → Environment Variables
4. Add variable:
   - Key: `SOCIALDATA_API_KEY`
   - Value: `your_actual_api_key_here`

### **4. Local Testing**

```bash
# Install Vercel CLI
npm install -g vercel

# Run locally
vercel dev

# Open browser
http://localhost:3000
```

### **5. Deploy to Vercel**

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 📁 Project Structure

```
seismic-wrapped-v2/
├── index.html              # Form input page
├── result.html             # Animation page
├── vercel.json             # Vercel config
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
│
├── css/
│   ├── style.css          # Global styles
│   ├── form.css           # Form page styles
│   └── result.css         # Result page styles
│
├── js/
│   ├── form.js            # Form handling & API calls
│   └── animation.js       # 4 scenes animation controller
│
├── api/
│   └── twitter.js         # Serverless function (Backend)
│
└── assets/
    ├── logo-seismic.png   # Logo (PERLU DITAMBAHKAN)
    └── badges/
        ├── magnitude-1.png  # (PERLU DITAMBAHKAN)
        └── ... s/d 9.png
```

---

## 🎯 How It Works

### **User Flow:**
```
1. User input:
   - Link profil X
   - Discord messages count
   - Magnitude level

2. Submit → Call API

3. Backend:
   - Get user profile (PFP)
   - Search tweets with keywords
   - Sort by engagement
   - Return top 10 tweets

4. Frontend:
   - Save data to localStorage
   - Redirect to result page
   - Play 4-scene animation

5. User can:
   - Replay animation
   - Share link
```

### **API Endpoint:**
```
GET /api/twitter?username={username}

Response:
{
  "error": false,
  "username": "elonmusk",
  "pfpUrl": "https://...",
  "totalTweets": 10,
  "topTweets": [...],
  "bestTweet": {...}
}
```

---

## 💰 Cost Estimation

**SocialData.tools Pricing:**
- $0.20 per 1,000 tweets
- $0.0002 per tweet/user

**Per User:**
- Get profile: 1 request = $0.0002
- Search top tweets: ~10-20 items = $0.002-0.004
- **Total: ~$0.004 per user**

**Scale:**
- 100 users = $0.40
- 1,000 users = $4.00
- 10,000 users = $40.00

---

## 🎨 Assets Required

Tambahkan file berikut ke folder `assets/`:

### **Logo:**
- `logo-seismic.png` (512x512px, PNG, transparent)

### **Magnitude Badges:**
- `badges/magnitude-1.png` s/d `magnitude-9.png`
- Size: 256x256px
- Format: PNG with transparent background

**Placeholder:** Jika belum ada, sistem akan tetap jalan (badge tidak tampil).

---

## ⚙️ Configuration

### **Keywords (api/twitter.js):**
```javascript
const keywords = [
    'GMIC', '#GMIC', '$GMIC',
    'SEISMIC', '#SEISMIC', '$SEISMIC',
    '@SeismicSys', 'seismicsys'
];
```

### **Animation Timing (js/animation.js):**
```javascript
Scene 1: 3 seconds  // Stats
Scene 2: 3 seconds  // Top 10
Scene 3: 4 seconds  // Best Content
Scene 4: 3 seconds  // Magnitude
Total: 13 seconds
```

---

## 🐛 Troubleshooting

### **Error: "Belum pernah posting tentang GMIC/SEISMIC"**
- User belum punya tweet dengan keyword
- Suruh user tweet tentang GMIC/SEISMIC dulu

### **Error: "User not found"**
- Username salah
- Account private/suspended
- Cek format link: `https://x.com/username`

### **Error: "API configuration error"**
- API Key tidak di-set di environment variable
- Check: Vercel Dashboard → Settings → Environment Variables

### **Tampilan Polos (CSS tidak load)**
- Pakai local server (bukan double-click HTML)
- Run: `vercel dev` atau `python -m http.server`

---

## 📱 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 90+ | ✅ Full | Recommended |
| Firefox 88+ | ✅ Full | Good |
| Edge 90+ | ✅ Full | Chromium |
| Safari 14+ | ✅ Works | Some CSS limits |
| Mobile | ✅ Responsive | Works |

---

## 🔐 Security

- ✅ API Key tersimpan di server (environment variable)
- ✅ Tidak exposed ke client
- ✅ CORS handled
- ✅ Input validation
- ✅ Error handling

---

## 📞 Support

**Issues?**
1. Check Console (F12) untuk errors
2. Verify API Key di environment variables
3. Test dengan username yang pasti punya tweets

**API Limit?**
- SocialData.tools has rate limits
- Monitor usage di dashboard mereka

---

## 📄 License

Created for SEISMIC Community 2024

---

## 🚀 Ready to Deploy!

```bash
# 1. Set API Key di Vercel
# 2. Push to GitHub
# 3. Deploy!
vercel --prod

# Done! 🎉
```

---

**Questions?** Open an issue or contact the team!
