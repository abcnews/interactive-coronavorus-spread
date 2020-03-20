export const DATA_ENDPOINT = 'https://www.abc.net.au/dat/news/interactives/covid19-data/';
export const JOHN_HOPKINS_DATA_URL = `${DATA_ENDPOINT}data.json`;
export const JOHN_HOPKINS_COUNTRY_TOTALS_URL = `${DATA_ENDPOINT}country-totals.json`;
export const WHO_COUNTRY_TOTALS_URL = `${DATA_ENDPOINT}/who-country-totals.json`;
export const COUNTRY_TOTALS_URL = JOHN_HOPKINS_COUNTRY_TOTALS_URL;
export const AFTER_100_CASES_URL = `${DATA_ENDPOINT}after-100-cases.json`;
export const KEY_COUNTRIES = ['Australia', 'China', 'Italy', 'Singapore', 'South Korea', 'UK', 'US'];
export const EUROPEAN_COUNTRIES = [];
export const KEY_TRENDS = [2, 3, 7];

export const PRESETS = {
  initial: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true
  },
  china: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: ['China'],
    highlightedCountries: true
  },
  all: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear',
    countries: true
  },
  key: {
    graphic: 'cases',
    xScaleType: 'dates',
    yScaleType: 'linear'
  },
  hundred: {
    graphic: 'cases',
    yScaleType: 'linear'
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
    graphic: 'cases'
  },
  trends: {
    graphic: 'cases',
    highlightedTrends: true
  },
  lowtrend: {
    graphic: 'cases',
    highlightedTrends: [7]
  },
  singapore: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'Singapore']
  },
  singtotaiwan: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Australia', 'Singapore', 'Taiwan']
  },
  taiwan: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Australia', 'Taiwan']
  },
  taiwantokorea: {
    graphic: 'cases',
    countries: KEY_COUNTRIES.concat(['Taiwan']),
    highlightedCountries: ['Australia', 'Taiwan', 'South Korea']
  },
  korea: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'South Korea']
  },
  europe: {
    graphic: 'cases',
    countries: EUROPEAN_COUNTRIES.concat(['Australia']),
    highlightedCountries: true
  },
  koreatoitaly: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'South Korea', 'Italy']
  },
  italy: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'Italy']
  },
  italytojapan: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'Italy', 'Japan']
  },
  unitedstates: {
    graphic: 'cases',
    highlightedCountries: ['Australia', 'US']
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
