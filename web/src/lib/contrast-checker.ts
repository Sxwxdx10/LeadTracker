/**
 * Color Contrast Checker
 * Validates color combinations against WCAG 2.1 AA standards
 */

import { getContrastRatio } from './accessibility';

export interface ColorPair {
  name: string;
  foreground: string;
  background: string;
  usage: string;
}

export interface ContrastResult {
  name: string;
  foreground: string;
  background: string;
  usage: string;
  ratio: number;
  passesNormal: boolean; // 4.5:1
  passesLarge: boolean;  // 3:1
  level: 'AAA' | 'AA' | 'Fail';
}

/**
 * Check a single color pair
 */
export function checkColorPair(pair: ColorPair): ContrastResult {
  const ratio = getContrastRatio(pair.foreground, pair.background);
  const passesNormal = ratio >= 4.5;
  const passesLarge = ratio >= 3;
  const passesAAA = ratio >= 7;

  let level: 'AAA' | 'AA' | 'Fail' = 'Fail';
  if (passesAAA) level = 'AAA';
  else if (passesNormal) level = 'AA';

  return {
    ...pair,
    ratio: Math.round(ratio * 10) / 10,
    passesNormal,
    passesLarge,
    level,
  };
}

/**
 * Application color palette to check
 */
export const colorPalette: ColorPair[] = [
  // Text colors
  {
    name: 'Primary Text',
    foreground: '#1f2937', // gray-800
    background: '#ffffff',
    usage: 'Main body text',
  },
  {
    name: 'Secondary Text',
    foreground: '#6b7280', // gray-500
    background: '#ffffff',
    usage: 'Secondary/helper text',
  },
  {
    name: 'Muted Text',
    foreground: '#9ca3af', // gray-400
    background: '#ffffff',
    usage: 'Placeholder text',
  },
  
  // Brand colors - Primary: Emerald Green #10B981
  {
    name: 'Brand Primary',
    foreground: '#ffffff',
    background: '#10b981', // brand-500
    usage: 'Primary buttons',
  },
  {
    name: 'Brand Primary Text',
    foreground: '#10b981',
    background: '#ffffff',
    usage: 'Links and accents',
  },
  {
    name: 'Brand Dark',
    foreground: '#ffffff',
    background: '#059669', // brand-600
    usage: 'Button hover states',
  },
  // Secondary colors - Lavender #D2CAEC
  {
    name: 'Secondary Primary',
    foreground: '#2e2443',
    background: '#d2caec', // secondary-300
    usage: 'Secondary buttons',
  },
  {
    name: 'Secondary Text',
    foreground: '#7d64b3', // secondary-600
    background: '#ffffff',
    usage: 'Secondary links and accents',
  },
  
  // Semantic colors
  {
    name: 'Success',
    foreground: '#ffffff',
    background: '#22c55e', // green-500
    usage: 'Success messages/buttons',
  },
  {
    name: 'Success Text',
    foreground: '#15803d', // green-700
    background: '#ffffff',
    usage: 'Success text on light bg',
  },
  {
    name: 'Error',
    foreground: '#ffffff',
    background: '#ef4444', // red-500
    usage: 'Error messages/buttons',
  },
  {
    name: 'Error Text',
    foreground: '#dc2626', // red-600
    background: '#ffffff',
    usage: 'Error text on light bg',
  },
  {
    name: 'Warning',
    foreground: '#92400e', // amber-800
    background: '#fbbf24', // amber-400
    usage: 'Warning messages',
  },
  {
    name: 'Warning Text',
    foreground: '#d97706', // amber-600
    background: '#ffffff',
    usage: 'Warning text on light bg',
  },
  
  // UI elements
  {
    name: 'Border',
    foreground: '#e5e7eb', // gray-200
    background: '#ffffff',
    usage: 'Borders and dividers',
  },
  {
    name: 'Disabled Text',
    foreground: '#d1d5db', // gray-300
    background: '#ffffff',
    usage: 'Disabled elements',
  },
  {
    name: 'Input Background',
    foreground: '#1f2937',
    background: '#f9fafb', // gray-50
    usage: 'Input fields',
  },
  
  // Status colors (Pipeline)
  {
    name: 'Prospect',
    foreground: '#ffffff',
    background: '#6b7280', // gray-500
    usage: 'Prospect status',
  },
  {
    name: 'Qualified',
    foreground: '#ffffff',
    background: '#3b82f6', // blue-500
    usage: 'Qualified status',
  },
  {
    name: 'Proposal',
    foreground: '#000000',
    background: '#f59e0b', // amber-500
    usage: 'Proposal status',
  },
  {
    name: 'Negotiation',
    foreground: '#ffffff',
    background: '#8b5cf6', // purple-500
    usage: 'Negotiation status',
  },
  {
    name: 'Won',
    foreground: '#ffffff',
    background: '#10b981', // emerald-500
    usage: 'Won status',
  },
  {
    name: 'Lost',
    foreground: '#ffffff',
    background: '#ef4444', // red-500
    usage: 'Lost status',
  },
];

/**
 * Check all color pairs in the palette
 */
export function checkAllColors(): ContrastResult[] {
  return colorPalette.map(checkColorPair);
}

/**
 * Generate a report of contrast issues
 */
export function generateContrastReport(): string {
  const results = checkAllColors();
  const failing = results.filter(r => !r.passesNormal);
  const warnings = results.filter(r => r.passesLarge && !r.passesNormal);
  
  let report = '# Accessibility Contrast Report\n\n';
  
  report += `## Summary\n`;
  report += `- Total colors checked: ${results.length}\n`;
  report += `- Passing AA (normal text): ${results.filter(r => r.passesNormal).length}\n`;
  report += `- Passing AA (large text only): ${warnings.length}\n`;
  report += `- Failing: ${failing.length}\n\n`;
  
  if (failing.length > 0) {
    report += `## ⚠️ Failing Combinations\n\n`;
    failing.forEach(result => {
      report += `### ${result.name}\n`;
      report += `- Usage: ${result.usage}\n`;
      report += `- Foreground: ${result.foreground}\n`;
      report += `- Background: ${result.background}\n`;
      report += `- Ratio: ${result.ratio}:1 (needs 4.5:1)\n`;
      report += `- Status: ❌ FAIL\n\n`;
    });
  }
  
  if (warnings.length > 0) {
    report += `## ⚠️ Large Text Only\n\n`;
    warnings.forEach(result => {
      report += `### ${result.name}\n`;
      report += `- Usage: ${result.usage}\n`;
      report += `- Ratio: ${result.ratio}:1\n`;
      report += `- Status: ⚠️ Large text only (≥18pt or ≥14pt bold)\n\n`;
    });
  }
  
  report += `## ✅ Passing Combinations\n\n`;
  const passing = results.filter(r => r.passesNormal);
  passing.forEach(result => {
    report += `- **${result.name}**: ${result.ratio}:1 (${result.level})\n`;
  });
  
  return report;
}

/**
 * Export results as JSON
 */
export function exportContrastResults(): string {
  const results = checkAllColors();
  return JSON.stringify(results, null, 2);
}

/**
 * Console log contrast results with colors
 */
export function logContrastResults(): void {
  const results = checkAllColors();
  
  console.group('🎨 Color Contrast Report');
  
  results.forEach(result => {
    const icon = result.passesNormal ? '✅' : result.passesLarge ? '⚠️' : '❌';
    const style = `
      background: ${result.background};
      color: ${result.foreground};
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    `;
    
    console.log(
      `${icon} %c${result.name}%c - ${result.ratio}:1 (${result.level}) - ${result.usage}`,
      style,
      ''
    );
  });
  
  console.groupEnd();
  
  const failing = results.filter(r => !r.passesNormal);
  if (failing.length > 0) {
    console.warn(`⚠️ ${failing.length} color combination(s) need attention!`);
  } else {
    console.log('✅ All color combinations pass WCAG AA standards!');
  }
}

