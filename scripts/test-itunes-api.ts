/**
 * Test script for iTunes Search API
 * Usage: npm run test:itunes <song-index>
 * Example: npm run test:itunes 0
 */

import songs from '../src/data/songs.json' assert { type: 'json' };

interface iTunesSearchResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  trackViewUrl: string;
}

interface iTunesResponse {
  resultCount: number;
  results: iTunesSearchResult[];
}

/**
 * Search iTunes API for a song
 */
async function searchItunes(artist: string, title: string): Promise<iTunesResponse> {
  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&entity=song&limit=5`;
  
  console.log(`\n🔍 Searching: ${url}\n`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Find the best matching result based on album name
 */
function findBestMatch(results: iTunesSearchResult[], expectedAlbum: string): iTunesSearchResult | null {
  if (results.length === 0) return null;
  
  const normalizedExpected = expectedAlbum.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = results.find(r => 
    r.collectionName.toLowerCase().trim() === normalizedExpected
  );
  
  if (exactMatch) return exactMatch;
  
  // Try partial match (album name contains expected or vice versa)
  const partialMatch = results.find(r => {
    const resultAlbum = r.collectionName.toLowerCase().trim();
    return resultAlbum.includes(normalizedExpected) || normalizedExpected.includes(resultAlbum);
  });
  
  return partialMatch || null;
}

/**
 * Format and display search results
 */
function displayResults(results: iTunesSearchResult[], bestMatch: iTunesSearchResult | null) {
  if (results.length === 0) {
    console.log('❌ No results found\n');
    return;
  }
  
  console.log(`✅ Found ${results.length} results\n`);
  
  // Show best match first if found
  if (bestMatch) {
    console.log('🎯 BEST MATCH (by album):');
    console.log('='.repeat(60));
    displaySingleResult(bestMatch);
    console.log('');
    console.log('Other results:');
    console.log('-'.repeat(60));
  }
  
  // Display all results
  results.forEach((result, index) => {
    const isBestMatch = bestMatch && result.trackId === bestMatch.trackId;
    if (!isBestMatch) {
      console.log(`--- Result ${index + 1} ---`);
      displaySingleResult(result);
    }
  });
}

/**
 * Display a single result
 */
function displaySingleResult(result: iTunesSearchResult) {
  console.log(`Track Name: ${result.trackName}`);
  console.log(`Artist: ${result.artistName}`);
  console.log(`Album: ${result.collectionName}`);
  console.log(`Track ID: ${result.trackId}`);
  console.log(`Preview URL: ${result.previewUrl || '❌ Not available'}`);
  console.log(`Artwork (100px): ${result.artworkUrl100 || '❌ Not available'}`);
  console.log(`iTunes Link: ${result.trackViewUrl}`);
  console.log('');
}

/**
 * Main test function
 */
async function main() {
  const songIndex = parseInt(process.argv[2]);
  
  if (isNaN(songIndex) || songIndex < 0 || songIndex >= songs.length) {
    console.error(`\n❌ Error: Please provide a valid song index (0-${songs.length - 1})`);
    console.error(`Usage: npm run test:itunes <song-index>\n`);
    console.error('Available songs:');
    songs.forEach((song, i) => {
      console.error(`  ${i}: "${song.title}" by ${song.artist}`);
    });
    console.error('');
    process.exit(1);
  }
  
  const song = songs[songIndex];
  
  console.log('\n' + '='.repeat(60));
  console.log(`Testing song ${songIndex}: "${song.title}" by ${song.artist}`);
  console.log(`Expected album: "${song.album}"`);
  console.log('='.repeat(60));
  
  try {
    const data = await searchItunes(song.artist, song.title);
    const bestMatch = findBestMatch(data.results, song.album);
    
    if (bestMatch) {
      console.log(`\n✨ Found album match: "${bestMatch.collectionName}"\n`);
    } else {
      console.log(`\n⚠️  No exact album match found for "${song.album}"\n`);
    }
    
    displayResults(data.results, bestMatch);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
