const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

// Insert @theme block right after @import "tailwindcss";
const themeBlock = `
@theme {
  --color-indigo-300: var(--brand-300);
  --color-indigo-400: var(--brand-400);
  --color-indigo-500: var(--brand-500);
  --color-indigo-600: var(--brand-600);
  --color-indigo-900: var(--brand-900);
  --color-indigo-950: var(--brand-950);
}

:root {
  /* DARK MODE DEFAULTS */
  --brand-300: #A8A1FC;
  --brand-400: #8B83E6;
  --brand-500: #5951C8;
  --brand-600: #4A43A6; /* Primary dark button */
  --brand-900: #1B1845;
  --brand-950: #120F2E;
}
`;

css = css.replace('@import "tailwindcss";', '@import "tailwindcss";' + themeBlock);

// Now let's update .light-theme to override these vars
const lightThemeVars = `
  --brand-300: #4A43A6;
  --brand-400: #3B338C;
  --brand-500: #1f186c;
  --brand-600: #140F4B; /* Primary light button */
  --brand-900: #e8eaf6;
  --brand-950: #c5cae9;
`;
css = css.replace('.light-theme {', '.light-theme {' + lightThemeVars);

// The prompt asked for "subtle borders, soft shadows, 8-12px border radius" and "Clean cards"
// Currently, everything uses rounded-2xl (16px) or rounded-xl (12px).
// Let's globally replace rounded-2xl with rounded-xl, and rounded-xl with rounded-lg in the React components later,
// OR we can just redefine --radius-2xl and --radius-xl in @theme!
// Tailwind v4 uses --radius-* variables.

fs.writeFileSync('src/index.css', css);
console.log('CSS updated');
