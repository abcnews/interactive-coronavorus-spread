import { useEffect, useMemo, useReducer, useState } from 'react';
import { OTHER_PLACES, EXCLUDED_PLACES, PLACES_DATA_URL, PLACES_TESTING_DATA_URL, SHIPS } from './constants';
import COUNTRIES_POPULATIONS from './population';

const PLACE_NAME_REPLACEMENTS = [
  [/^([A-Z])\w+\s([A-Z])\w+\s([A-Z])\w+$/, '$1$2$3'],
  [/\sand(\sthe)?\s/, ' & '],
  [/^East\s/, 'E. '],
  [/ew\sZealand$/, 'Z'],
  [/^North\s/, 'N. '],
  [/^Saint\s/, 'St. '],
  [/^South\s/, 'S. '],
  [/^(\w+),\sSouth/, 'S. $1'],
  [/\*$/, ''],
  [/nited\s([A-Z])\w+$/, '$1'],
  [/^West\s/, 'W. '],
  [/^(\w)\w+ Australia$/, '$1A'],
  [/^Victoria$/, 'Vic'],
  [/^Tasmania$/, 'Tas'],
  [/^Queensland$/, 'Qld'],
  [/^Australian Capital Territory$/, 'ACT'],
  [/^Northern Territory$/, 'NT'],
  [/^New South Wales$/, 'NSW']
];

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        error: null,
        data: null
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        data: action.payload
      };
    case 'FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        data: null
      };
    default:
      throw new Error(`Invalid action type: ${action.type}`);
  }
};

const fetchCache = {};

const useDataLoader = initialURL => {
  const [url, setURL] = useState(initialURL);
  const [state, dispatch] = useReducer(dataFetchReducer, {
    url,
    isLoading: false,
    error: null,
    data: null
  });

  useEffect(() => {
    let wasCancelled = false;

    dispatch({ type: 'FETCH_INIT' });

    if (!fetchCache[url]) {
      fetchCache[url] = fetch(url).then(response => response.json());
    }

    fetchCache[url]
      .then(data => {
        if (!wasCancelled) {
          dispatch({ type: 'FETCH_SUCCESS', payload: data });
        }
      })
      .catch(error => {
        if (!wasCancelled) {
          dispatch({ type: 'FETCH_FAILURE', payload: error });
        }
      });

    return () => {
      wasCancelled = true;
    };
  }, [url]);

  return [state, setURL];
};

function clone(value) {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const _value = Array.isArray(value) ? [] : {};

  for (const key in value) {
    _value[key] = clone(value[key]);
  }

  return _value;
}

const placesDataCache = {};

export const usePlacesData = initialURL => {
  const [{ url, isLoading, error, data: loadedData }, setURL] = useDataLoader(initialURL || PLACES_DATA_URL);

  return [
    {
      isLoading,
      error,
      data: useMemo(() => {
        if (loadedData === null) {
          return null;
        }

        if (!placesDataCache[url]) {
          const data = clone(loadedData);

          for (const originalPlaceName in data) {
            let nextPlaceName = originalPlaceName;

            // Fix names of some places with multiple RegExp passes
            PLACE_NAME_REPLACEMENTS.forEach(pnr => {
              const [pattern, replacement] = pnr;

              if (pattern.test(nextPlaceName)) {
                nextPlaceName = nextPlaceName.replace(pattern, replacement);
              }
            });

            // Replace any updated place names
            if (nextPlaceName !== originalPlaceName) {
              data[nextPlaceName] = data[originalPlaceName];
              delete data[originalPlaceName];
            }
          }

          // Remove places we want to exclude
          for (const place of EXCLUDED_PLACES) {
            if (data[EXCLUDED_PLACES]) {
              delete data[EXCLUDED_PLACES];
            }
          }

          for (const place in data) {
            // Remove `country` prop from regions
            delete data[place].country;

            // Re-type some places
            data[place].type =
              place === 'Worldwide'
                ? 'aggregate'
                : SHIPS.indexOf(place) > -1
                ? 'ship'
                : OTHER_PLACES.indexOf(place) > -1
                ? 'other'
                : data[place].type;

            // Add `population` to countries
            if (data[place].type === 'country' && COUNTRIES_POPULATIONS[place]) {
              data[place].population = COUNTRIES_POPULATIONS[place];
            }

            const { dates } = data[place];

            for (const date in dates) {
              // Remove last Australian date if it's missing cumulative deaths
              if (place === 'Australia' && dates[date].deaths == null) {
                delete dates[date];
                continue;
              }

              // Fill in non-zeroed props
              dates[date].cases = dates[date].cases || 0;
              dates[date].deaths = dates[date].deaths || 0;
              dates[date].recoveries = dates[date].recoveries || 0;
            }
          }

          placesDataCache[url] = data;
        }

        return clone(placesDataCache[url]);
      }, [loadedData])
    },
    setURL
  ];
};

const supplementaryURLs = {
  [PLACES_TESTING_DATA_URL]: PLACES_DATA_URL
};

function getSupplementaryURL(url) {
  return supplementaryURLs[url.split('?')[0]];
}

const placesTestingDataCache = {};

export const usePlacesTestingData = initialURL => {
  const [{ url, isLoading, error, data: loadedData }, setPlacesTestingDataURL] = useDataLoader(
    initialURL || PLACES_TESTING_DATA_URL
  );
  const [
    { isLoading: isSupplementaryLoading, error: supplementaryError, data: supplementaryData },
    setPlacesDataURL
  ] = usePlacesData(getSupplementaryURL(initialURL || PLACES_TESTING_DATA_URL));

  return [
    {
      isLoading: isSupplementaryLoading || isLoading,
      error: supplementaryError || error,
      data: useMemo(() => {
        if (loadedData == null || supplementaryData == null) {
          return null;
        }

        if (!placesTestingDataCache[url]) {
          const data = clone(loadedData);

          for (const place in data) {
            const supplementaryDataPlace = supplementaryData[place];

            for (const date in data[place]) {
              const tests = data[place][date];
              const supplementaryDataPlaceDate = supplementaryDataPlace.dates[date];
              const cases = supplementaryDataPlaceDate ? supplementaryDataPlaceDate.cases : 0;

              data[place][date] = {
                tests,
                cases,
                testspcc: cases ? tests / cases : 0
              };
            }

            data[place] = {
              type: supplementaryDataPlace.type,
              population: supplementaryDataPlace.population,
              dates: data[place]
            };
          }

          placesTestingDataCache[url] = data;
        }

        return clone(placesTestingDataCache[url]);
      }, [loadedData, supplementaryData])
    },
    url => {
      setPlacesTestingDataURL(url || PLACES_TESTING_DATA_URL);
      setPlacesDataURL(getSupplementaryURL(url || PLACES_TESTING_DATA_URL));
    }
  ];
};
