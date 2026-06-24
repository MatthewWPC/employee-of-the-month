export type Quarter = {
  id: string;
  label: string;
  dateRange: string;
  winnerName: string | null;
  photo: string | null;
};

/**
 * Wall of Fame data — one entry per quarter.
 * To record a new winner, set winnerName (required) and photo (optional).
 * If photo is null, the card will fall back to an initial avatar.
 * Photos live at /public/team/<filename>.png and are served at /team/<filename>.png.
 */
export const QUARTERS: Quarter[] = [
  { id: 'q1-2026', label: 'Q1 2026', dateRange: 'Jan to Mar 2026', winnerName: 'Kira',  photo: '/team/kira.png' },
  { id: 'q2-2026', label: 'Q2 2026', dateRange: 'Apr to Jun 2026', winnerName: null,    photo: null },
  { id: 'q3-2026', label: 'Q3 2026', dateRange: 'Jul to Sep 2026', winnerName: null,    photo: null },
  { id: 'q4-2026', label: 'Q4 2026', dateRange: 'Oct to Dec 2026', winnerName: null,    photo: null },
  { id: 'q1-2027', label: 'Q1 2027', dateRange: 'Jan to Mar 2027', winnerName: null,    photo: null },
  { id: 'q2-2027', label: 'Q2 2027', dateRange: 'Apr to Jun 2027', winnerName: null,    photo: null },
  { id: 'q3-2027', label: 'Q3 2027', dateRange: 'Jul to Sep 2027', winnerName: null,    photo: null },
  { id: 'q4-2027', label: 'Q4 2027', dateRange: 'Oct to Dec 2027', winnerName: null,    photo: null },
  { id: 'q1-2028', label: 'Q1 2028', dateRange: 'Jan to Mar 2028', winnerName: null,    photo: null },
  { id: 'q2-2028', label: 'Q2 2028', dateRange: 'Apr to Jun 2028', winnerName: null,    photo: null },
  { id: 'q3-2028', label: 'Q3 2028', dateRange: 'Jul to Sep 2028', winnerName: null,    photo: null },
  { id: 'q4-2028', label: 'Q4 2028', dateRange: 'Oct to Dec 2028', winnerName: null,    photo: null },
];
