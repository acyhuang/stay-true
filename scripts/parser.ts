/**
 * CSV Parser Script
 * Reads songs.csv and generates songs.json with base data
 * Usage: npm run parse
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SongEntry {
  id: string;
  title?: string;
  artist: string;
  album: string;
  year: number;
  page: number;
  characters: string[];
  itunesTrackId?: string;
  previewUrl?: string;
  albumArt?: string;
}

/**
 * Parse a CSV row, handling quoted fields with commas
 */
function parseCSVRow(row: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Push the last field
  fields.push(currentField.trim());
  
  return fields;
}

/**
 * Extract first page number from page field (e.g., "24, 34" -> 24)
 */
function parseFirstPage(pageStr: string): number {
  const firstPage = pageStr.split(',')[0].trim();
  return parseInt(firstPage, 10);
}

/**
 * Parse character(s) field into array
 */
function parseCharacters(charStr: string): string[] {
  return charStr.split(',').map(c => c.trim()).filter(c => c.length > 0);
}

/**
 * Main parser function
 */
function parseCSV(): void {
  console.log('🔍 Reading songs.csv...\n');
  
  const csvPath = join(__dirname, 'src', 'data', 'songs.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const rows = csvContent.split('\n').filter(row => row.trim());
  
  // Skip header row
  const dataRows = rows.slice(1);
  
  const songs: SongEntry[] = [];
  
  dataRows.forEach((row, index) => {
    const fields = parseCSVRow(row);
    
    // CSV columns: Song Title, Artist, Album, Year, Page, Character(s), Context
    const [title, artist, album, yearStr, pageStr, characters] = fields;
    
    const songEntry: SongEntry = {
      id: (songs.length + 1).toString(),
      title: title === '—' ? undefined : title,
      artist,
      album: album === '—' ? '' : album,
      year: parseInt(yearStr, 10),
      page: parseFirstPage(pageStr),
      characters: parseCharacters(characters),
    };
    
    songs.push(songEntry);
    
    if (title === '—') {
      console.log(`✅ Parsed: Album-only entry - ${artist} (page ${songEntry.page})`);
    } else {
      console.log(`✅ Parsed: "${title}" by ${artist} (page ${songEntry.page})`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Parsed: ${songs.length} entries`);
  
  // Write to songs.json
  const jsonPath = join(__dirname, 'src', 'data', 'songs.json');
  writeFileSync(jsonPath, JSON.stringify(songs, null, 2), 'utf-8');
  
  console.log(`\n✨ Successfully wrote ${songs.length} songs to songs.json`);
}

parseCSV();
