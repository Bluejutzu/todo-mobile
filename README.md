# My First React Native App 🚀

A cross-platform mobile app built with **React Native** and **Expo** that runs on both Android and iOS!

## What This App Does

This is a simple counter app that demonstrates:

- **React Native** - Write once, run on Android & iOS
- **Expo** - Simplified React Native development
- **React Hooks** - Modern state management with `useState`
- **Beautiful UI** - Custom styling with dark theme
- **Interactive Components** - Touchable buttons with visual feedback

## Why React Native + Expo?

✅ **Cross-Platform**: One codebase for Android & iOS  
✅ **Fast Development**: Hot reload - see changes instantly  
✅ **JavaScript/React**: Use web development skills for mobile  
✅ **Easy Setup**: No need for Android Studio or Xcode to start  
✅ **Bun**: Lightning-fast package manager

## Project Structure

```
android/
├── App.js                 # Main app component (counter app)
├── index.js               # Entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies
├── assets/                # Images, fonts, etc.
└── node_modules/          # Installed packages
```

## How to Run

### Option 1: Run on Android Emulator (Recommended)

1. **Start the development server:**

   ```bash
   bun start
   ```

2. **Press `a` to open on Android emulator**
   - Make sure you have Android Studio installed with an emulator set up
   - Or press `a` and Expo will guide you through setup

### Option 2: Run on Your Physical Phone

1. **Install Expo Go app** on your iPhone:

   - Download from App Store: [Expo Go](https://apps.apple.com/app/expo-go/id982107779)

2. **Start the development server:**

   ```bash
   bun start
   ```

3. **Scan the QR code** with your iPhone camera
   - The app will open in Expo Go!

### Option 3: Run in Web Browser (for testing)

```bash
bun run web
```

## Available Commands

```bash
bun start          # Start Expo development server
bun run android    # Run on Android emulator
bun run ios        # Run on iOS simulator (macOS only)
bun run web        # Run in web browser
```

## How It Works

The counter app uses React hooks for state management:

```javascript
const [count, setCount] = useState(0);  // Initialize counter at 0

// Increase button
<TouchableOpacity onPress={() => setCount(count + 1)}>
  <Text>Increase</Text>
</TouchableOpacity>

// Decrease button (disabled when count is 0)
<TouchableOpacity
  onPress={() => setCount(count - 1)}
  disabled={count === 0}
>
  <Text>Decrease</Text>
</TouchableOpacity>

// Reset button
<TouchableOpacity onPress={() => setCount(0)}>
  <Text>Reset</Text>
</TouchableOpacity>
```

## Customization Ideas

Try modifying `App.js` to:

- Change colors in the `StyleSheet`
- Add more buttons (multiply, divide, etc.)
- Add animations with `Animated` API
- Add navigation to multiple screens
- Fetch data from an API
- Add images from the `assets` folder

## Tech Stack

- **Framework**: React Native 0.81.5
- **Platform**: Expo ~54.0
- **Language**: JavaScript (ES6+)
- **Package Manager**: Bun
- **UI**: React Native components with custom styling

## Next Steps

1. **Modify the UI** - Change colors, fonts, layout in `App.js`
2. **Add Features** - Try adding new functionality
3. **Learn Navigation** - Install `@react-navigation/native` for multi-screen apps
4. **Add Icons** - Use `@expo/vector-icons` for beautiful icons
5. **Deploy** - Build for production with `eas build`

## Debugging

- **Shake your phone** (or press `Cmd+D` on iOS / `Cmd+M` on Android) to open developer menu
- **Enable Fast Refresh** for instant updates when you save files
- **Check console** in terminal for errors and logs

## Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Hooks Guide](https://react.dev/reference/react)
- [React Native Styling](https://reactnative.dev/docs/style)

## Comparison: React Native vs Native Android

| Feature                   | React Native (This App)              | Native Android (Kotlin) |
| ------------------------- | ------------------------------------ | ----------------------- |
| **Code Sharing**          | ✅ 70-90% shared between iOS/Android | ❌ Android only         |
| **Language**              | JavaScript/TypeScript                | Kotlin/Java             |
| **Learning Curve**        | Easy (if you know React)             | Medium                  |
| **Performance**           | Very good                            | Excellent               |
| **Development Speed**     | Fast (hot reload)                    | Medium                  |
| **Access to Native APIs** | Good (with native modules)           | Full access             |
| **Community**             | Huge (React + RN)                    | Large (Android)         |

---

**You now have a cross-platform mobile app!** 🎉  
Test it on your iPhone using Expo Go, or run it in the Android emulator!
