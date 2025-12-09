import React, { Suspense, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Experience from './components/Experience'
import FamilyFrame from './components/FamilyFrame'
import FamilyIntroModal from './components/FamilyIntroModal'
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
  const [isSitting, setIsSitting] = useState(false)
  const [seatPos, setSeatPos] = useState(null)
  const [showFamilyModal, setShowFamilyModal] = useState(false)

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

  // 坐下處理
  const handleSit = (position) => {
    setIsSitting(true)
    setSeatPos(position)
  }

  // 站起處理
  const handleStandUp = useCallback(() => {
    console.log('Standing up...')
    setIsSitting(false)
    setSeatPos(null)
    // 恢復 FPS 控制
    // 使用 setTimeout 确保状态更新后再恢复鼠标控制
    setTimeout(() => {
      if (window.enableMouseControl) {
        console.log('Enabling mouse control')
        window.enableMouseControl()
      } else {
        console.warn('enableMouseControl function not found')
      }
    }, 100)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
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

  // ESC 键处理：站起
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSitting) {
        handleStandUp()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSitting, handleStandUp])

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
      {/* 關閉抗鋸齒以提升性能 */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 0], fov: 75 }}
        gl={{ antialias: false }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Experience 
            onArtifactInteract={handleArtifactInteract} 
            onSit={handleSit}
            isSitting={isSitting}
            seatPosition={seatPos}
          />
          {/* 家庭肖像框 - 入口交互 */}
          <FamilyFrame 
            position={[31, 16, 84]} 
            rotation={[0, Math.PI, 0]}
            onOpen={() => setShowFamilyModal(true)}
          />
          <LoadingScreen />
        </Suspense>
        
        {/* Post Processing - Bloom effect for glowing edges */}
        {/* EffectComposer 必須是 Canvas 的直接子層級，放在最後面 */}
        {/* 微光參數：優雅的、微微的氛圍感 */}
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom 
            luminanceThreshold={1.1}  /* 門檻設在 1.1 (比標準白色 1.0 稍微高一點點就好) */
            luminanceSmoothing={0.9} /* 平滑度調高，讓光暈漸層更自然 */
            intensity={0.3}          /* 降低強度以提升性能 */
            radius={0.6}             /* 降低半徑以提升性能 */
            mipmapBlur={false}       /* 關閉 mipmapBlur 以提升性能 */
          />
        </EffectComposer>
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

      {/* 家庭介绍模态框 */}
      <FamilyIntroModal 
        isOpen={showFamilyModal} 
        onClose={() => setShowFamilyModal(false)} 
      />

      {/* Artwork/Artifact Modal - 毛玻璃風格 */}
      {showModal && (
        <>
          <div className="artwork-modal-overlay show" onClick={closeModal} />
          <div className="artwork-modal show" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            {selectedArtwork ? (
              <>
                <h2 className="art-title">{selectedArtwork.title || '藝術品'}</h2>
                <p className="art-desc">{selectedArtwork.description || selectedArtwork.desc || '這是一件美麗的藝術品。'}</p>
                {selectedArtwork.artist && <p><strong>藝術家：</strong>{selectedArtwork.artist}</p>}
                {selectedArtwork.year && <p><strong>年份：</strong>{selectedArtwork.year}</p>}
                {selectedArtwork.question && (
                  <div className="art-question">
                    <strong>💡 {selectedArtwork.question}</strong>
                  </div>
                )}
                {selectedArtwork.audio && (
                  <div className="audio-indicator">
                    🔊 語音導覽播放中...
                  </div>
                )}
                {selectedArtwork.type === 'artifact' && (
                  <p style={{ marginTop: '20px', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.8)' }}>
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
        </>
      )}

      {/* 坐下時顯示的 UI */}
      {isSitting && (
        <div className="stand-up-ui" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '15px 30px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          borderRadius: '8px',
          zIndex: 1000,
          fontSize: '16px',
          fontFamily: 'Arial, sans-serif',
          pointerEvents: 'none' // 不拦截点击事件
        }}>
          按 ESC 鍵站起
        </div>
      )}
    </div>
  )
}

export default App
