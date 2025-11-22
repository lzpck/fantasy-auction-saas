/**
 * Position color mappings for visual consistency across the application
 * Each position has a unique color scheme using Tailwind CSS classes
 */

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'DL' | 'LB' | 'DB' | 'K' | 'DEF';

export const POSITION_COLORS: Record<Position, string> = {
  // Offensive Positions
  QB: 'bg-pink-900/50 text-pink-300 border border-pink-700/50',
  RB: 'bg-green-900/50 text-green-300 border border-green-700/50',
  WR: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  TE: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',

  // Defensive Positions (now with unique colors)
  DL: 'bg-red-900/50 text-red-300 border border-red-700/50',      // Defensive Line - Red for strength
  LB: 'bg-purple-900/50 text-purple-300 border border-purple-700/50', // Linebacker - Purple
  DB: 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/50',   // Defensive Back - Cyan for speed

  // Special Teams
  K: 'bg-slate-800 text-slate-400',
  DEF: 'bg-slate-800 text-slate-400',
};

/**
 * Default color for positions not explicitly defined
 */
export const DEFAULT_POSITION_COLOR = 'bg-slate-800 text-slate-400';

/**
 * Get the color classes for a given position
 * @param position - The position code
 * @returns Tailwind CSS classes for the position color
 */
export function getPositionColor(position: string): string {
  return POSITION_COLORS[position as Position] || DEFAULT_POSITION_COLOR;
}
