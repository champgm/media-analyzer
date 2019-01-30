import fuzzysort from 'fuzzysort';

export async function search(find: string[], text: string): Promise<{ [key: string]: string[] }> {
  const splitText = text.split(new RegExp(',| |\\n', 'g'));
  const results = await searchSplitText(find, splitText);
  return results;
}

export async function searchSplitText(find: string[], splitText: string[]) {
  const searchOptions = {
    threshold: -1,
  };
  const resultsMap = {};
  const promises = find.map(async (item) => {
    const results = await fuzzysort.goAsync(item, splitText, searchOptions);
    results.forEach((result) => {
      console.log(`Searched for '${item}', found: ${result.target}`);
      if (resultsMap[item] === undefined) {
        resultsMap[item] = [];
      }
      resultsMap[item].push(result.target);
    });
  });
  await Promise.all(promises);

  const sortedResultsMap = {};
  Object.keys(resultsMap)
    .sort()
    .forEach((key) => {
      sortedResultsMap[key] = resultsMap[key];
    });

  return sortedResultsMap;
}
