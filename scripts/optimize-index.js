import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Minify font loading script in <head>
const fontScriptRegex = /<!-- Defer non-critical external web fonts[\s\S]*?<\/noscript>/;
const minFontScript = `<!-- Defer non-critical external web fonts (minified) -->
    <script>!function(){function e(){[{href:"./assets/css/google-fonts.min.css?v=20260924-v2"},{href:"https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css",crossOrigin:"anonymous"}].forEach(function(e){var n=document.createElement("link");n.rel="stylesheet",n.href=e.href,e.crossOrigin&&(n.crossOrigin=e.crossOrigin),document.head.appendChild(n)})}"requestIdleCallback"in window?requestIdleCallback(e,{timeout:2500}):window.addEventListener("load",function(){setTimeout(e,100)})}();</script>
    <noscript>
      <link rel="stylesheet" href="./assets/css/google-fonts.min.css?v=20260924-v2">
      <link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css">
    </noscript>`;

if (fontScriptRegex.test(html)) {
  html = html.replace(fontScriptRegex, minFontScript);
  console.log('✓ Head font script minified successfully');
} else {
  console.warn('✗ Head font script regex did not match');
}

// 2. Minify inline CSS blocks in <head>
const cssRegex = /<style>\s*@keyframes fade-in-up[\s\S]*?<\/style>\s*<style>[\s\S]*?<\/style>/;
const cssMatch = html.match(cssRegex);

function safeMinifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

if (cssMatch) {
  const innerCss = cssMatch[0].replace(/<\/?style>/g, '\n');
  const minifiedCss = '<style>' + safeMinifyCss(innerCss) + '</style>';
  html = html.replace(cssRegex, minifiedCss);
  console.log(`✓ Critical inline CSS minified (${innerCss.length}B -> ${minifiedCss.length}B)`);
} else {
  console.warn('✗ Critical inline CSS regex did not match');
}

// 3. Minify bottom inline script (openMdModal, loadMarked, navigateToSection)
const bottomScriptRegex = /<script>\s*window\.openMdModal\s*=\s*function[\s\S]*?<\/script>/;
const minBottomScript = `<script>window.openMdModal=function(e,o,n,d){if(window._openMdModalReal)return window._openMdModalReal(e,o,n,d);window._pendingMdModal=[e,o,n,d]},window.loadMarked=function(){return window.marked?Promise.resolve(!0):(window.markedLoadPromise||(window.markedLoadPromise=new Promise(function(e){var o=document.createElement("script");o.src="./assets/js/vendor/marked.min.js",o.async=!0,o.onload=function(){e(Boolean(window.marked))},o.onerror=function(){console.warn("Markdown parser could not be loaded."),e(!1)},document.head.appendChild(o)})),window.markedLoadPromise)},window.navigateToSection=function(e,o){e&&"function"==typeof e.preventDefault&&e.preventDefault();var n=document.getElementById(o);if(n){var d=function(){var e=document.querySelector("header")||document.querySelector(".glass-nav")||document.querySelector("nav"),d=e?e.offsetHeight:80,t=n.getBoundingClientRect().top+window.pageYOffset-d;t=Math.max(0,t),window.scrollTo({top:t,behavior:"smooth"}),window.history.pushState&&window.history.pushState(null,"","#"+o);var a=document.getElementById("mobile-menu");a&&!a.classList.contains("hidden")&&a.classList.add("hidden")},t=document.querySelector(".modal-root:not(.hidden), #news-modal:not(.hidden), #md-modal:not(.hidden)");t&&"function"==typeof window.deactivateModal?window.deactivateModal(t,d):d()}};</script>`;

if (bottomScriptRegex.test(html)) {
  html = html.replace(bottomScriptRegex, minBottomScript);
  console.log('✓ Bottom inline navigation/modal script minified successfully');
} else {
  console.warn('✗ Bottom inline script regex did not match');
}

// 4. Remove redundant eager marked.min.js (it is dynamically lazy-loaded via loadMarked on demand)
const markedScriptRegex = /\s*<script src="\.\/assets\/js\/vendor\/marked\.min\.js" defer><\/script>/;
if (markedScriptRegex.test(html)) {
  html = html.replace(markedScriptRegex, '');
  console.log('✓ Removed redundant eager marked.min.js script tag (lazy-loaded on demand)');
}

// 5. Update vendor lucide cache buster
html = html.replace(
  '<script src="./assets/js/vendor/lucide.min.js" defer></script>',
  '<script src="./assets/js/vendor/lucide.min.js?v=20260924-opt-v1" defer></script>'
);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully wrote optimized index.html');
