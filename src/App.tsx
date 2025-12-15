import { useState, useEffect, useRef, useMemo } from 'react'
import type { Song } from './song'
import songsData from './data/songs.json'


function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedCharacter, setSelectedCharacter] = useState<string>('All')
  const songs: Song[] = songsData

  // Extract unique characters from all songs
  const uniqueCharacters = useMemo(() => {
    const characters = new Set<string>()
    songs.forEach(song => {
      song.characters.forEach(character => characters.add(character))
    })
    return Array.from(characters).sort()
  }, [songs])

  // Filter songs based on selected character
  const filteredSongs = useMemo(() => {
    if (selectedCharacter === 'All') {
      return songs
    }
    return songs.filter(song => song.characters.includes(selectedCharacter))
  }, [songs, selectedCharacter])

  // Reset currentIndex when filter changes and it's out of bounds
  useEffect(() => {
    if (currentIndex >= filteredSongs.length) {
      setCurrentIndex(0)
    }
  }, [filteredSongs.length, currentIndex])

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < filteredSongs.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        handlePrev()
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, filteredSongs.length])

  return (
    <>
      <div className='flex flex-row w-screen h-screen justify-between p-4 gap-4 text-sm'>
        {filteredSongs[currentIndex].previewUrl && (
          <audio 
            ref={audioRef}
            key={currentIndex}
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={filteredSongs[currentIndex].previewUrl} type='audio/mpeg' />
          </audio>
        )}
        <div className='flex flex-col w-full h-full justify-between'>
          <div className='w-full'>
            <p className='text-2xl mb-4 font-bold'>Songs of <a className='text-[#0000EE] hover:underline hover:text-[#551A8B]' href="https://www.penguinrandomhouse.com/books/688054/stay-true-by-hua-hsu/" target="_blank"><i>Stay True</i></a></p>

            {filteredSongs[currentIndex].albumArt && (
              <img className='mb-4 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl' src={filteredSongs[currentIndex].albumArt} alt={filteredSongs[currentIndex].title} />
            )}

            
            <div className="flex flex-row gap-2">
              <button
                type='button'
                onClick={togglePlayPause}
                className="controls"
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              
              <button 
                type='button' 
                onClick={() => setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="controls"
              >
                PREV
              </button>
              <button type='button' 
                onClick={() => setCurrentIndex(currentIndex + 1)}
                disabled={currentIndex === filteredSongs.length - 1}
                className="controls"
              >
                NEXT
              </button>
            </div>
            
          </div>
          
          <div>
            <p className="font-bold text-[#551A8B]">{filteredSongs[currentIndex].title}</p>
            <p>{filteredSongs[currentIndex].artist}</p>
            <p>{filteredSongs[currentIndex].album}</p>
            <p>{filteredSongs[currentIndex].year}</p>
            <p>pg{filteredSongs[currentIndex].page}</p>
            <p>characters: {filteredSongs[currentIndex].characters.join(', ')}</p>
          </div>
        </div>

        <div className='list flex flex-col min-w-xs items-start gap-1 p-2 border-x border-[#CCCCCC]'>
          <div>
            <select
              id="character-filter"
              value={selectedCharacter}
              onChange={(e) => {
                setSelectedCharacter(e.target.value)
                setCurrentIndex(0)
              }}
              className="mb-2"
            >
              <option value="All">Filter by character</option>
              {uniqueCharacters.map(character => (
                <option key={character} value={character}>
                  {character}
                </option>
              ))}
            </select>
          </div>
          {filteredSongs.map((song, index) => (
            <button
              key={index}
              type='button'
              onClick={() => setCurrentIndex(index)}
              className={`${index === currentIndex ? 'font-bold' : ''} text-left`}
            >
              {song.title} by {song.artist}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default App
