/**
 * iTunes API Enrichment Script
 * Enriches songs.json with iTunes data (trackId, previewUrl, albumArt)
 * Only processes entries missing at least one of these fields
 * Usage: npm run enrich
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SongEntry {
  id: string;
  title: string;
  artist: string;
  album: string;
  year: number;
  page: number;
  characters: string[];
  itunesTrackId?: string;
  previewUrl?: string;
  albumArt?: string;
}

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
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Find the best matching result based on album name
 * Returns: [result, matchType] where matchType is 'exact' | 'partial' | 'none'
 */
function findBestMatch(
  results: iTunesSearchResult[], 
  expectedAlbum: string
): [iTunesSearchResult | null, 'exact' | 'partial' | 'none'] {
  if (results.length === 0) return [null, 'none'];
  
  const normalizedExpected = expectedAlbum.toLowerCase().trim();
  
  // If no expected album, return first result as partial match
  if (!normalizedExpected || normalizedExpected === '') {
    return [results[0], 'partial'];
  }
  
  // Try exact match first
  const exactMatch = results.find(r => 
    r.collectionName.toLowerCase().trim() === normalizedExpected
  );
  
  if (exactMatch) return [exactMatch, 'exact'];
  
  // Try partial match (album name contains expected or vice versa)
  const partialMatch = results.find(r => {
    const resultAlbum = r.collectionName.toLowerCase().trim();
    return resultAlbum.includes(normalizedExpected) || normalizedExpected.includes(resultAlbum);
  });
  
  return partialMatch ? [partialMatch, 'partial'] : [results[0], 'none'];
}

/**
 * Display a single result
 */
function displayResult(result: iTunesSearchResult, matchType: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 ${matchType === 'exact' ? 'EXACT MATCH' : matchType === 'partial' ? 'PARTIAL MATCH' : 'NO ALBUM MATCH'}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Track Name: ${result.trackName}`);
  console.log(`Artist: ${result.artistName}`);
  console.log(`Album: ${result.collectionName}`);
  console.log(`Track ID: ${result.trackId}`);
  console.log(`Preview URL: ${result.previewUrl || '❌ Not available'}`);
  console.log(`Artwork: ${result.artworkUrl100 || '❌ Not available'}`);
  console.log(`iTunes Link: ${result.trackViewUrl}`);
}

/**
 * Prompt user for confirmation
 */
function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if song needs enrichment
 */
function needsEnrichment(song: SongEntry): boolean {
  return !song.itunesTrackId || !song.previewUrl || !song.albumArt;
}

/**
 * Convert artwork URL to 1000x1000 size
 */
function getHighResArtwork(artworkUrl: string | undefined): string {
  if (!artworkUrl) return '';
  // Replace /100x100bb.jpg or /100x100bb.png with /1000x1000bb.jpg
  return artworkUrl.replace(/\/\d+x\d+bb\.(jpg|png)$/i, '/1000x1000bb.jpg');
}

/**
 * Main enrichment function
 */
async function enrichSongs(): Promise<void> {
  console.log('🔍 Reading songs.json...\n');
  
  const jsonPath = join(__dirname, 'src', 'data', 'songs.json');
  const songs: SongEntry[] = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // Filter songs that need enrichment and have a title
  const songsToEnrich = songs.filter(song => song.title && needsEnrichment(song));
  
  console.log(`📊 Found ${songsToEnrich.length} songs needing enrichment\n`);
  
  if (songsToEnrich.length === 0) {
    console.log('✨ All songs are already enriched!');
    return;
  }
  
  let enrichedCount = 0;
  let skippedCount = 0;
  let queryCount = 0;
  const MAX_QUERIES = 15;
  
  for (let i = 0; i < songsToEnrich.length; i++) {
    const song = songsToEnrich[i];
    
    // Check if we've hit the query limit
    if (queryCount >= MAX_QUERIES) {
      console.log(`\n⚠️  Reached query limit (${MAX_QUERIES} queries). Stopping to avoid rate limits.`);
      console.log(`   Remaining songs will be processed on the next run.`);
      break;
    }
    
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`[${i + 1}/${songsToEnrich.length}] Processing: "${song.title}" by ${song.artist}`);
    console.log(`Expected album: "${song.album || '(none specified)'}"`);
    console.log(`Queries used: ${queryCount}/${MAX_QUERIES}`);
    console.log(`${'━'.repeat(60)}`);
    
    try {
      // Search iTunes API
      console.log(`\n🔍 Searching iTunes API...`);
      const data = await searchItunes(song.artist, song.title);
      queryCount++; // Increment only on actual API call
      
      if (data.resultCount === 0) {
        console.log('❌ No results found. Skipping.');
        skippedCount++;
        continue;
      }
      
      // Find best match
      const [bestMatch, matchType] = findBestMatch(data.results, song.album);
      
      if (!bestMatch) {
        console.log('❌ No suitable match found. Skipping.');
        skippedCount++;
        continue;
      }
      
      // Display the match
      displayResult(bestMatch, matchType);
      
      // Auto-confirm exact matches, ask for confirmation otherwise
      let confirmed = false;
      if (matchType === 'exact') {
        console.log(`\n✅ Auto-confirming exact album match`);
        confirmed = true;
      } else {
        confirmed = await promptUser('\nUse this result? (y/n): ');
      }
      
      if (confirmed) {
        // Update song with iTunes data
        song.itunesTrackId = bestMatch.trackId.toString();
        song.previewUrl = bestMatch.previewUrl || '';
        song.albumArt = getHighResArtwork(bestMatch.artworkUrl100);
        
        console.log('✅ Updated!');
        enrichedCount++;
      } else {
        console.log('⏭️  Skipped');
        skippedCount++;
      }
      
      // Rate limiting: wait 500ms between requests
      if (i < songsToEnrich.length - 1) {
        await sleep(500);
      }
      
    } catch (error) {
      console.error(`❌ Error processing song:`, error);
      skippedCount++;
    }
  }
  
  // Write updated songs back to file
  writeFileSync(jsonPath, JSON.stringify(songs, null, 2), 'utf-8');
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✨ Enrichment Complete!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Enriched: ${enrichedCount} songs`);
  console.log(`Skipped: ${skippedCount} songs`);
  console.log(`Queries used: ${queryCount}/${MAX_QUERIES}`);
  if (queryCount >= MAX_QUERIES && songsToEnrich.length > enrichedCount + skippedCount) {
    const remaining = songsToEnrich.length - enrichedCount - skippedCount;
    console.log(`\n⚠️  ${remaining} songs remaining. Run again to continue enrichment.`);
  }
  console.log(`\n💾 Updated songs.json`);
}

enrichSongs();

