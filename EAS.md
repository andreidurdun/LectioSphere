# Development Build & EAS Build Guide

## The Problem with Expo Go

**Expo Go CANNOT receive OAuth redirects from the browser.**

That's why Google Sign-In doesn't work in Expo Go - the browser opens, user authenticates, but when Google tries to redirect back, Expo Go cannot intercept the URL.

---

## The Solution: Development Build

You have two options to make Google OAuth work:

### Option 1: Local Development Build (Recommended)

**Advantages:**
- ✅ Fast (local build on PC)
- ✅ No EAS account required
- ✅ Quick iteration
- ✅ Google OAuth works perfectly

**Steps:**

1. **Make sure you have Android SDK installed**
   - Check: `adb devices`
   - You should see your device connected

2. **Connect your phone via USB**
   - Enable USB debugging on phone
   - Enable "Install via USB" in developer settings

3. **Run the build:**
   ```powershell
   cd D:\University\An2Sem2\MDS\LectioSphere\LectioSphere
   npx expo run:android
   ```

4. **What happens:**
   - Gradle builds the native APK
   - APK automatically installs on phone
   - App starts with Metro bundler
   - Google OAuth works!

5. **For subsequent runs:**
   - Just: `npx expo start --dev-client`
   - Native app is already installed

---

### Option 2: EAS Build (Cloud)

**Advantages:**
- ✅ No local Android SDK required
- ✅ Cloud build
- ✅ Can share APK with others for testing

**Disadvantages:**
- ⚠️ Slower (cloud build ~10-20 min)
- ⚠️ Requires Expo account

**Steps:**

1. **Install EAS CLI:**
   ```powershell
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```powershell
   eas login
   ```

3. **Configure the project:**
   ```powershell
   cd D:\University\An2Sem2\MDS\LectioSphere\LectioSphere
   eas build:configure
   ```

4. **Build for development:**
   ```powershell
   eas build --profile development --platform android
   ```

5. **Wait for the build:**
   - EAS will build in the cloud
   - You'll receive a download link
   - Download APK to phone and install it

6. **Run the app:**
   ```powershell
   npx expo start --dev-client
   ```

---

## After Build: Configure Google OAuth

Once you have a development build, you need to configure Google OAuth correctly:

### 1. Update LoginMenu.js

Use custom scheme for redirect:

```javascript
const redirectUri = 'com.nedelcudaniel.lectiosphere:/oauth2redirect';
```

### 2. Create Android OAuth Client in Google Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Android**
4. Name: `LectioSphere Android`
5. Package name: `com.nedelcudaniel.lectiosphere`
6. SHA-1 certificate fingerprint:
   - For development, run:
     ```powershell
     cd LectioSphere\android
     .\gradlew signingReport
     ```
   - Copy SHA1 from "Variant: debug"
   - Paste in Google Console
7. Click **CREATE**

### 3. Update Backend .env

```env
GOOGLE_CLIENT_ID=<android-client-id-from-google-console>
GOOGLE_CLIENT_SECRET=<not-required-for-android>
HOST_IP=<your-local-ip>
```

### 4. Test

- Open the native app (not Expo Go!)
- Tap "Login with Google"
- Browser opens
- After login, it closes automatically and returns to app
- Login success! 🎉

---

## Comparison

| Feature | Expo Go | Local Build | EAS Build |
|---------|---------|-------------|-----------|
| Google OAuth | ❌ Doesn't work | ✅ Works | ✅ Works |
| Setup time | 0 min | ~5-10 min | ~20-30 min |
| Build time | N/A | ~3-5 min | ~10-20 min |
| Requires Android SDK | ❌ | ✅ | ❌ |
| Requires Expo account | ❌ | ❌ | ✅ |
| Native modules | ❌ Limited | ✅ All | ✅ All |
| Recommendation | Quick dev | **Google OAuth** | Distribution |

---

## My Recommendation

**For Google OAuth: Local Development Build (`npx expo run:android`)**

It's the fastest method and allows you to iterate quickly. Once it works, you can use EAS for production builds or distribution.

---

## Quick Commands

```powershell
# Local development build
cd D:\University\An2Sem2\MDS\LectioSphere\LectioSphere
npx expo run:android

# After it's installed, just:
npx expo start --dev-client

# EAS build
npm install -g eas-cli
eas login
eas build --profile development --platform android

# After EAS build:
npx expo start --dev-client
```

---

## Troubleshooting

### "ANDROID_HOME is not set"
- Install Android Studio
- Set environment variable `ANDROID_HOME`

### "No devices found"
- Connect phone via USB
- Enable USB debugging
- Run: `adb devices`

### Build fails
- Check that you have Java JDK 17 installed
- Check that you have Android SDK installed
- Delete `android/.gradle` and try again

### Metro bundler error
- Run: `npx expo start -c` (clear cache)
- Restart Metro bundler

---

**Status**: For Google OAuth to work in your app, you must use a development build, not Expo Go.
