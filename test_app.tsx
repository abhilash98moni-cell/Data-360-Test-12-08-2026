import React from 'react';
import { renderToString } from 'react-dom/server';
import App from './src/App';

try {
  const html = renderToString(<App />);
  console.log("App render successful. Length:", html.length);
} catch (e) {
  console.error("App render failed:");
  console.error(e);
}
