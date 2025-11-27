import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress, Html } from '@react-three/drei'
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

function LoadingScreen() {
  const { progress, active } = useProgress()
  
  if (!active) return null
  
  return (
    <Html center>
      <div className="loading-screen">
        <div className="loading-content">
          <h2>載入展覽館模型中...</h2>
          <div className="loading-bar-container">
            <div 
              className="loading-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>{Math.round(progress)}%</p>
          <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.7 }}>
            模型大小：35MB，請稍候...
          </p>
        </div>
      </div>
    </Html>
  )
}

function App() {
  const [showInstructions, setShowInstructions] = useState(true)
  const [isLookingAtArtwork, setIsLookingAtArtwork] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [artifactData, setArtifactData] = useState(null)

  // Handle artifact interaction - moved outside useEffect
  const handleArtifactInteract = (data) => {
    console.log('Artifact interact called with data:', data)
    setArtifactData(data)
    setSelectedArtwork(data)
    setShowModal(true)
    // 禁用滑鼠控制，保持當前視角
    if (window.disableMouseControl) {
      window.disableMouseControl()
    }
  }

  useEffect(() => {
    const handleClick = () => {
      if (isLookingAtArtwork && selectedArtwork) {
        setShowModal(true)
      }
      // Hide instructions after first click
      setShowInstructions(false)
    }

    document.addEventListener('click', handleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [isLookingAtArtwork, selectedArtwork])

  // Expose state setters to window for Player component to use
  useEffect(() => {
    window.setIsLookingAtArtwork = setIsLookingAtArtwork
    window.setSelectedArtwork = setSelectedArtwork
    // 暴露 showModal 狀態，讓 Player 知道對話框是否打開
    window.getShowModal = () => showModal
    return () => {
      delete window.setIsLookingAtArtwork
      delete window.setSelectedArtwork
      delete window.getShowModal
    }
  }, [showModal])

  const closeModal = () => {
    setShowModal(false)
    // 重新啟用滑鼠控制
    if (window.enableMouseControl) {
      window.enableMouseControl()
    }
    // 不清除 selectedArtwork，保持數據以便下次打開時顯示
  }
  
  // Debug: log selectedArtwork changes
  useEffect(() => {
    console.log('selectedArtwork changed:', selectedArtwork)
    console.log('showModal:', showModal)
  }, [selectedArtwork, showModal])

  return (
    <div className="app">
      <Canvas
        shadows
        camera={{ position: [0, 2, 0], fov: 75 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Experience onArtifactInteract={handleArtifactInteract} />
          <LoadingScreen />
        </Suspense>
      </Canvas>
      
      {/* Crosshair */}
      <div className={`crosshair ${isLookingAtArtwork ? 'interactive' : ''}`} />
      
      {showInstructions && (
        <div className="instructions">
          <h2>點擊畫面開始</h2>
          <p>WASD - 移動</p>
          <p>按住滑鼠左鍵拖動 - 視角</p>
          <p>點擊藝術品查看詳情</p>
        </div>
      )}

      {/* Artwork/Artifact Modal */}
      {showModal && (
        <div className="artwork-modal show">
          <button className="close-btn" onClick={closeModal}>×</button>
          {selectedArtwork ? (
            <>
              <h2>{selectedArtwork.title || '藝術品'}</h2>
              <p>{selectedArtwork.description || '這是一件美麗的藝術品。'}</p>
              {selectedArtwork.artist && <p><strong>藝術家：</strong>{selectedArtwork.artist}</p>}
              {selectedArtwork.year && <p><strong>年份：</strong>{selectedArtwork.year}</p>}
              {selectedArtwork.type === 'artifact' && (
                <p style={{ marginTop: '20px', fontStyle: 'italic', color: '#4a90e2' }}>
                  ✨ 這是一個測試物件，展示邊緣發光效果和音頻互動功能
                </p>
              )}
            </>
          ) : (
            <>
              <h2>載入中...</h2>
              <p>正在載入藝術品資訊...</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App
