import { useState, useEffect } from 'react'
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
      <div className='flex flex-col w-screen h-screen items-center justify-center'>
        <p className='text-2xl'>Stay True</p>
        <div>
          <p className=''>{songs[currentIndex].title}</p>
          <p className=''>{songs[currentIndex].artist}</p>
          <p className=''>{songs[currentIndex].album}</p>
        </div>
        <div>
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
    </>
  )
}

export default App
