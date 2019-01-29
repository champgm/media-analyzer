import fuzzysort from 'fuzzysort';

export async function search(find: string[], text: string): Promise<string[]> {

  const splitByComma = text.split(',');
  const commaResults = await searchSplitText(find, splitByComma);
  const splitBySpace = text.split(' ');
  const spaceResults = await searchSplitText(find, splitBySpace);

  const allResults = commaResults.concat(spaceResults);
  const sorted = allResults.sort();
  return sorted;
}

export async function searchSplitText(find: string[], splitText: string[]) {
  const searchResults = [];
  const searchOptions = {
    threshold: -1,
  };
  const resultsMap = {};
  const promises = find.map(async (item) => {
    const results = await fuzzysort.goAsync(item, splitText, searchOptions);
    results.forEach((result) => {
      console.log(`Searched for '${item}', found: ${result.target}`);
      searchResults.push(`${item} => ${result.target}`);
    });
  });
  await Promise.all(promises);
  return searchResults;
}
