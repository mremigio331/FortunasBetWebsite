// fortunasTheme.js
// Import and use this config in your App.js or main entry point with Ant Design's ConfigProvider

export const fortunasTheme = {
  light: {
    token: {
      colorPrimary: "#1F3C2D", // Dark Green
      colorBgBase: "#F5F1E6", // Off-White
      colorTextBase: "#1F3C2D",
      colorLink: "#C4A651", // Gold
      colorSuccess: "#C4A651",
      colorWarning: "#C4A651",
      colorError: "#C94A4A", // Deep red for errors
      fontFamily:
        "'Playfair Display', 'Merriweather', 'Times New Roman', Georgia, serif",
    },
    components: {
      Button: {
        colorPrimary: "#1F3C2D",
        colorPrimaryHover: "#C4A651",
        colorPrimaryActive: "#C4A651",
        borderRadius: 6,
      },
      Card: {
        colorBgContainer: "#F5F1E6",
        colorBorderSecondary: "#1F3C2D",
      },
      Tag: {
        colorSuccess: "#C4A651",
        colorText: "#1F3C2D",
      },
    },
  },
  dark: {
    token: {
      colorPrimary: "#C4A651", // Gold as primary accent
      colorBgBase: "#1F3C2D", // Deep green background
      colorTextBase: "#F5F1E6", // Off-white text
      colorLink: "#F5F1E6",
      colorSuccess: "#C4A651",
      colorWarning: "#F5F1E6",
      colorError: "#E57373", // Softer red for dark mode
      fontFamily:
        "'Playfair Display', 'Merriweather', 'Times New Roman', Georgia, serif",
    },
    components: {
      Button: {
        colorPrimary: "#C4A651",
        colorPrimaryHover: "#F5F1E6",
        colorPrimaryActive: "#F5F1E6",
        borderRadius: 6,
      },
      Card: {
        colorBgContainer: "#22382A", // Slightly lighter dark green for cards
        colorBorderSecondary: "#C4A651",
      },
      Tag: {
        colorSuccess: "#C4A651",
        colorText: "#F5F1E6",
      },
    },
  },
};

// Usage example (in App.js):
// import { ConfigProvider } from 'antd';
// import { fortunasTheme } from './fortunasTheme';
// <ConfigProvider theme={fortunasTheme.light}>...</ConfigProvider>
// <ConfigProvider theme={fortunasTheme.dark}>...</ConfigProvider>
