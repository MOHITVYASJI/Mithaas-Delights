/**
 * Animation Configuration
 * यहाँ से आप GIF या 3D animations को enable/disable कर सकते हैं
 */

export const animationConfig = {
  // Logo Configuration
  logo: {
    use3D: true,              // false करें GIF के लिए
    gifPath: '/animated-logo.gif',  // अपनी GIF का path डालें
  },

  // Hero Background Configuration
  heroBackground: {
    use3D: true,              // false करें GIF के लिए
    gifPath: '/hero-animation.gif', // अपनी GIF का path डालें
    opacity: 0.4,             // GIF की transparency (0.1 to 1)
    blend: 'normal',          // Blend mode: 'normal', 'multiply', 'screen', 'overlay'
  },

  // Performance Settings
  performance: {
    reducedMotion: false,     // true करें simple animations के लिए
    enableParallax: true,     // Parallax effect on/off
    enableHoverEffects: true, // Hover animations on/off
  }
};

export default animationConfig;
