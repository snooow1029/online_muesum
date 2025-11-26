import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Experience from './components/Experience'
import './App.css'

function LoadingFallback() {
  return (
    <>
      {/* Show basic scene while loading */}
      <ambientLight intensity={0.5} />
      <gridHelper args={[20, 20]} />
    </>
  )
}

function App() {
  const [showInstructions, setShowInstructions] = useState(true)
  const [isLookingAtArtwork, setIsLookingAtArtwork] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement) {
        setShowInstructions(false)
      } else {
        setShowInstructions(true)
        setShowModal(false) // Close modal when pointer unlocks
      }
    }

    const handleClick = () => {
      if (isLookingAtArtwork && selectedArtwork) {
        setShowModal(true)
      }
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('click', handleClick)
    }
  }, [isLookingAtArtwork, selectedArtwork])

  // Expose state setters to window for Player component to use
  useEffect(() => {
    window.setIsLookingAtArtwork = setIsLookingAtArtwork
    window.setSelectedArtwork = setSelectedArtwork
    return () => {
      delete window.setIsLookingAtArtwork
      delete window.setSelectedArtwork
    }
  }, [])

  const closeModal = () => {
    setShowModal(false)
  }

  return (
    <div className="app">
      <Canvas
        shadows
        camera={{ position: [0, 2, 0], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Experience />
        </Suspense>
      </Canvas>
      
      {/* Crosshair */}
      <div className={`crosshair ${isLookingAtArtwork ? 'interactive' : ''}`} />
      
      {showInstructions && (
        <div className="instructions">
          <h2>點擊畫面開始</h2>
          <p>WASD - 移動</p>
          <p>滑鼠 - 視角</p>
          <p>點擊藝術品查看詳情</p>
          <p>ESC - 解鎖滑鼠</p>
        </div>
      )}

      {/* Artwork Modal */}
      <div className={`artwork-modal ${showModal ? 'show' : ''}`}>
        <button className="close-btn" onClick={closeModal}>×</button>
        {selectedArtwork && (
          <>
            <h2>{selectedArtwork.title || '藝術品'}</h2>
            <p>{selectedArtwork.description || '這是一件美麗的藝術品。'}</p>
            {selectedArtwork.artist && <p><strong>藝術家：</strong>{selectedArtwork.artist}</p>}
            {selectedArtwork.year && <p><strong>年份：</strong>{selectedArtwork.year}</p>}
          </>
        )}
      </div>
    </div>
  )
}

export default App
