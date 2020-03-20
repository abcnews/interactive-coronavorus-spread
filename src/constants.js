export const DATA_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/data.json';
export const COUNTRY_TOTALS_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/country-totals.json';
export const AFTER_100_CASES_URL = 'https://www.abc.net.au/dat/news/interactives/covid19-data/after-100-cases.json';

export const KEY_COUNTRIES = ['Australia', 'China', 'Italy', 'Korea, South', 'Singapore', 'United Kingdom', 'US'];
export const KEY_TRENDS = [2, 3, 7];

export const ALIASES = {
  'Korea, South': 'South Korea',
  'United Kingdom': 'UK'
};

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true,
    highlightedCountries: KEY_COUNTRIES,
    trends: KEY_TRENDS
  },
  china: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: ['China'],
    highlightedCountries: true,
    trends: KEY_TRENDS
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true,
    highlightedCountries: KEY_COUNTRIES,
    trends: KEY_TRENDS
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: KEY_TRENDS
  },
  hundred: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'linear',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: KEY_TRENDS
  },
  doublinginit: {
    graphic: 'doubling',
    marker: 'doublinginit'
  },
  doublingweek1: {
    graphic: 'doubling',
    marker: 'doublingweek1'
  },
  doublingweek2: {
    graphic: 'doubling',
    marker: 'doublingweek2'
  },
  doublingmonth: {
    graphic: 'doubling',
    marker: 'doublingmonth'
  },
  logarithmic: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    highlightedCountries: true,
    trends: KEY_TRENDS
  },
  trends: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    trends: KEY_TRENDS,
    highlightedTrends: true
  },
  lowtrend: {
    graphic: 'cases',
    xScaleType: 'days',
    yScaleType: 'logarithmic',
    countries: KEY_COUNTRIES,
    trends: KEY_TRENDS,
    highlightedTrends: [7]
  }
};

export const TRENDS = [
  { name: 'day', doublingTimePeriods: 1 },
  { name: '2 days', doublingTimePeriods: 2 },
  { name: '3 days', doublingTimePeriods: 3 },
  { name: '4 days', doublingTimePeriods: 4 },
  { name: '5 days', doublingTimePeriods: 5 },
  { name: '6 days', doublingTimePeriods: 6 },
  { name: 'week', doublingTimePeriods: 7 },
  { name: '2 weeks', doublingTimePeriods: 14 },
  { name: 'month', doublingTimePeriods: 28 }
];
