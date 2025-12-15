import { useState, useEffect, useRef } from 'react'
import type { Song } from './song'
import songsData from './data/songs.json'


function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const songs: Song[] = songsData

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setIsMuted(audioRef.current.muted)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handlePrev()
      } else if (event.key === 'ArrowRight') {
        handleNext()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  return (
    <>
      <div className='flex flex-col w-screen h-screen justify-between p-4 border border-red-500'>
        <div className='w-fit border border-blue-500 '>

          <p className='text-2xl'>Stay True</p>

          <button
              type='button'
              onClick={toggleMute}
            >
              {isMuted ? 'unmute' : 'mute'}
            </button>

          <img src={songs[currentIndex].albumArt} alt={songs[currentIndex].title} width={300} height={300} />

          <audio 
            ref={audioRef}
            key={currentIndex}
            autoPlay
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            <source src={songs[currentIndex].previewUrl} type='audio/mpeg' />
          </audio>
          <div>
            <button
              type='button'
              onClick={togglePlayPause}
            >
              {isPlaying ? 'pause' : 'play'}
            </button>
            
            <button 
              type='button' 
              onClick={() => setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              prev
            </button>
            <button type='button' 
              onClick={() => setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === songs.length - 1}
            >
              next
            </button>
          </div>
        </div>
        <div className='border border-green-500'>
          <p className='text-sm'>{songs[currentIndex].title}</p>
          <p className='text-sm'>{songs[currentIndex].artist}</p>
          <p className='text-sm'>{songs[currentIndex].album}</p>
          <p className='text-sm'>{songs[currentIndex].year}</p>
          <p className='text-sm'>{songs[currentIndex].page}</p>
        </div>
      </div>
    </>
  )
}

export default App
