import { useEffect } from 'react';

const ChangelogRSS = () => {
  useEffect(() => {
    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Galaxy Guard Changelog</title>
    <link>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog</link>
    <description>Version history and updates for Galaxy Guard - Epic Arcade Space Shooter</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog/rss" rel="self" type="application/rss+xml"/>
    
    <item>
      <title>v1.2.0 - Cinematic Visual Effects</title>
      <link>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog</link>
      <pubDate>Tue, 10 Dec 2025 00:00:00 GMT</pubDate>
      <guid>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog#v1.2.0</guid>
      <description><![CDATA[
        <h3>NEW FEATURES</h3>
        <ul>
          <li>Screen shake effects with intensity based on explosion type</li>
          <li>Camera zoom effect on big explosions and boss kills</li>
          <li>Slow-motion effect for critical hits and boss destruction</li>
          <li>Combo kill slow-motion triggers every 5th consecutive kill</li>
        </ul>
        <h3>IMPROVEMENTS</h3>
        <ul>
          <li>Bomb explosions now trigger stronger visual feedback than regular hits</li>
          <li>Smooth easing curves for natural visual transitions</li>
          <li>Effects combine properly for maximum impact</li>
        </ul>
      ]]></description>
    </item>
    
    <item>
      <title>v1.1.0 - Mobile &amp; Tablet Improvements</title>
      <link>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog</link>
      <pubDate>Thu, 07 Nov 2025 00:00:00 GMT</pubDate>
      <guid>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog#v1.1.0</guid>
      <description><![CDATA[
        <h3>BUG FIXES</h3>
        <ul>
          <li>Fixed mobile and tablet layout distortion issues</li>
          <li>Resolved UI squeezing on smaller screens</li>
          <li>Corrected aspect ratio preservation across all devices</li>
        </ul>
        <h3>IMPROVEMENTS</h3>
        <ul>
          <li>Enhanced responsive design with letterbox scaling</li>
          <li>Added safe-area support for notched devices (iPhone, modern Android)</li>
          <li>Improved HUD positioning within game boundaries</li>
          <li>Optimized touch controls and prevented unwanted scrolling</li>
          <li>Better viewport handling for iPad and tablets</li>
        </ul>
        <h3>MOBILE EXPERIENCE</h3>
        <ul>
          <li>Game maintains proper aspect ratio on all screen sizes</li>
          <li>HUD elements stay within playable area</li>
          <li>Smooth gameplay on iPhone, iPad, and Android devices</li>
          <li>Professional appearance without amateur stretching</li>
        </ul>
      ]]></description>
    </item>
    
    <item>
      <title>v1.0.0 - Initial Release</title>
      <link>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog</link>
      <pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate>
      <guid>https://lovable.dev/projects/9dbf25c6-9d71-4891-91e3-53cf0610622f/changelog#v1.0.0</guid>
      <description><![CDATA[
        <h3>NEW FEATURES</h3>
        <ul>
          <li>Retro arcade-style space shooter gameplay</li>
          <li>Infinite scrolling terrain with rocket enemies</li>
          <li>Boss fights every minute with unique colors</li>
          <li>100 playable levels with increasing difficulty</li>
          <li>Ammo system: +100 for big ships, +1000 for bosses</li>
          <li>High score leaderboard system</li>
          <li>Save/load game progress</li>
          <li>Music and sound effect toggles</li>
        </ul>
        <h3>GAMEPLAY</h3>
        <ul>
          <li>Arrow keys for movement</li>
          <li>SPACE to shoot bullets</li>
          <li>B to drop bombs</li>
          <li>P to pause</li>
        </ul>
        <h3>DESIGN</h3>
        <ul>
          <li>Vibrant neon color palette</li>
          <li>Animated starfield background</li>
          <li>Retro pixel-perfect graphics</li>
          <li>Smooth animations and effects</li>
        </ul>
      ]]></description>
    </item>
    
  </channel>
</rss>`;

    // Set content type and serve RSS
    const blob = new Blob([rssContent], { type: 'application/rss+xml' });
    const url = URL.createObjectURL(blob);
    
    // Redirect to the blob URL to serve as XML
    window.location.href = url;
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="pixel-text text-neon-cyan text-xl">Loading RSS Feed...</div>
    </div>
  );
};

export default ChangelogRSS;