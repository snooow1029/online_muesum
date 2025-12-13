import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import Experience from './components/Experience'
import FamilyFrame from './components/FamilyFrame'
import FamilyIntroModal from './components/FamilyIntroModal'
import PhoneInput from './PhoneInput'
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
  
  // 使用 useMemo 避免在渲染過程中觸發狀態更新
  const progressValue = useMemo(() => progress, [progress])
  
  if (!active) return null
  
  return (
    <Html center>
      <div className="loading-screen">
        <div className="loading-content">
          <h2>載入展覽館模型中...</h2>
          <div className="loading-bar-container">
            <div 
              className="loading-bar" 
              style={{ width: `${progressValue}%` }}
            />
          </div>
          <p>{Math.round(progressValue)}%</p>
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
  const [showFamilyModal, setShowFamilyModal] = useState(false)
  // 第二展間相關狀態
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  
  // 初始的文字雲資料
  const INITIAL_WORD_CLOUD_DATA = [
    { 
      problem: "褲腳又濕了一截，捷運上那把濕雨傘能不能離我遠點...", 
      solution: "奈米疏水防護塗層" 
    },
    { 
      problem: "只剩隻靈活的手，鍵盤上的每個按鍵怎麼都變得那麼遙遠？", 
      solution: "視線追蹤輸入法" 
    },
    { 
      problem: "剛出門心就懸著... 瓦斯爐上的火，我到底關了沒？", 
      solution: "智慧爐具遠端管家" 
    },
    { 
      problem: "半夜的窸窣聲... 該不會又是那些不速之客跑進家裡了吧？", 
      solution: "超音波智能驅逐網" 
    },
    { 
      problem: "如果不戴眼鏡，世界就只剩下模糊的色塊...", 
      solution: "自動對焦仿生眼" 
    },
    { 
      problem: "大家都笑得好開心，但我只聽到嗡嗡聲... 算了，跟著點頭裝懂就好。", 
      solution: "AI 人聲增幅助聽器" 
    },
    { 
      problem: "看著那長長的樓梯，腳還沒抬起來，膝蓋就已經開始隱隱作痛了...", 
      solution: "智慧動能護膝" 
    },
    { 
      problem: "盯著藥盒發呆... 等等，我早上那顆紅色的藥到底吃了沒？完全想不起來。", 
      solution: "用藥管家記憶盒" 
    },
    { 
      problem: "手一點力氣都使不上，明明只是想喝口水，怎麼連轉開瓶蓋都像在搏鬥？", 
      solution: "外骨骼握力輔助手套" 
    },
    { 
      problem: "把電視開得很大聲，只是怕家裡太安靜... 靜得讓人心慌。", 
      solution: "全息陪伴投影系統" 
    },
    { 
      problem: "超市標籤上的字像螞蟻一樣小，保存期限到底是今天還是下個月？", 
      solution: "AR 即時讀字放大鏡" 
    },
    { 
      problem: "浴室地板好滑，好怕洗澡時摔下去，躺在那裡沒人知道...", 
      solution: "非接觸式跌倒偵測雷達" 
    },
    { 
      problem: "半夜被冷醒，蓋了被子又熱醒，身體好像失去了調節溫度的能力。", 
      solution: "生物感測溫控舒眠被" 
    },
    { 
      problem: "明明上一秒才放在桌上的... 錢包是不是又長腳跑掉了？", 
      solution: "Air tag" 
    },
    { 
      problem: "心跳突然跳得好快，這只是心悸還是出事了？現在打電話會不會麻煩孩子？", 
      solution: "ECG監測貼片" 
    }
  ]
  
  const [wordCloudData, setWordCloudData] = useState(INITIAL_WORD_CLOUD_DATA) // 存儲用戶提交的文字雲數據（包含初始數據）
  const [isInFutureRoom, setIsInFutureRoom] = useState(false) // 是否在第二展間

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

  // 處理懶骨頭點擊：只顯示手機輸入界面，不改變視角
  const handleSit = (position, isFutureRoomSeat = false) => {
    // 如果在第二展間點擊懶骨頭，顯示手機輸入界面
    if (isFutureRoomSeat) {
      setShowPhoneInput(true)
    }
  }

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

  // ESC 键处理：关闭手机输入界面
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPhoneInput) {
        setShowPhoneInput(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPhoneInput])

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
            wordCloudData={wordCloudData}
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
          <p>WASD / 左側搖桿 - 移動</p>
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


      {/* 手機輸入界面 - 第二展間共創功能 */}
      <PhoneInput
        isOpen={showPhoneInput}
        onSubmit={(data) => {
          // 將用戶提交的問題和解決方案添加到文字雲數據中
          setWordCloudData(prev => [...prev, data])
          console.log('新增文字雲數據:', data)
        }}
        onClose={() => {
          setShowPhoneInput(false)
        }}
      />
    </div>
  )
}

export default App
