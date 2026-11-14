import { UsageReport, Point } from '../../../../app/core/statistics/models/usage-report.model';

/** English month names of the backend's month labels ("May 2026") */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
  'November', 'December'];

/** One bar of the "Visits per month" chart */
export interface UncpStatsMonth {
  short: string;   // "oct"
  long: string;    // "octubre de 2026"
  views: number;
  height: number;  // % of the highest month
  peak: boolean;   // the highest month: the only bar with its number on top
}

/** One row of a ranked list (downloads per file, countries, cities, most visited items) */
export interface UncpStatsRow {
  id: string;
  label: string;
  views: number;
  width: number;   // % of the first (highest) row
}

/** Everything the UNCP statistics page of an item, community or collection shows */
export interface UncpStatsView {
  total: number;
  months: UncpStatsMonth[];
  peak?: UncpStatsMonth;
  current?: UncpStatsMonth;
  downloads?: number;
  files?: number;
  lists: { type: string, rows: UncpStatsRow[] }[];
}

/**
 * "May 2026" → short and long month names in the current language ("may", "mayo de 2026"); labels in another form
 * are kept as they come
 */
function monthNames(label: string, lang: string): { short: string, long: string } {
  const [name, year] = (label ?? '').split(' ');
  const month = MONTHS.indexOf(name);
  if (month < 0 || !/^\d{4}$/.test(year)) {
    return { short: label, long: label };
  }
  const date = new Date(Number(year), month, 1);
  return {
    short: date.toLocaleDateString(lang, { month: 'short' }).replace('.', ''),
    long: date.toLocaleDateString(lang, { month: 'long', year: 'numeric' }),
  };
}

// Point.values is typed as an array, but the REST API sends an object ({ views: 138 }), as the stock table reads it
const views = (point: Point): number => Number((point?.values as unknown as { views?: number })?.views ?? 0);

/** Rows of a ranked list, with each bar relative to the highest */
export function uncpStatsRows(points: Point[]): UncpStatsRow[] {
  const max = Math.max(1, ...points.map(views));
  return points.map((point) => ({
    id: point.id, label: point.label || point.id, views: views(point), width: Math.round(1000 * views(point) / max) / 10,
  }));
}

/**
 * The cards, chart and lists of the statistics page of an item, community or collection, from its usage reports
 * (14/11/2026)
 */
export function uncpStatsView(reports: UsageReport[], lang: string): UncpStatsView {
  const byType = new Map(reports.map((report) => [report.reportType, report.points ?? []] as [string, Point[]]));
  const perMonth = byType.get('TotalVisitsPerMonth') ?? [];
  const max = Math.max(1, ...perMonth.map(views));
  const peakViews = Math.max(...perMonth.map(views));
  let peakFound = false;
  const months: UncpStatsMonth[] = perMonth.map((point) => {
    const peak = !peakFound && perMonth.length > 0 && views(point) === peakViews;
    peakFound = peakFound || peak;
    return { ...monthNames(point.label, lang), views: views(point), height: Math.round(1000 * views(point) / max) / 10, peak };
  });
  const files = byType.get('TotalDownloads');
  return {
    total: (byType.get('TotalVisits') ?? []).reduce((sum, point) => sum + views(point), 0),
    months,
    peak: months.find((month) => month.peak),
    current: months[months.length - 1],
    downloads: files ? files.reduce((sum, point) => sum + views(point), 0) : undefined,
    files: files?.length,
    lists: ['TotalDownloads', 'TopCountries', 'TopCities']
      .filter((type) => byType.get(type)?.length > 0)
      .map((type) => ({ type, rows: uncpStatsRows(byType.get(type)) })),
  };
}
