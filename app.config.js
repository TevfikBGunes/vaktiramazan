const { version } = require("./package.json");

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: "vaktiramazan",
    slug: "vaktiramazan",
    version,
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vaktiramazan",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      bundleIdentifier: "com.tevfikbgunes.vaktiramazan",
      supportsTablet: true,
    },
    android: {
      package: "com.tevfikbgunes.vaktiramazan",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "8a9b489a-7bba-4942-b9a0-b86629824655",
      },
    },
    owner: "tevfikbgunes",
  },
};
