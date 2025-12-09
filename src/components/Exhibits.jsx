import { useEffect, useState, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

// 展品資料對照表 (如果不想在 Blender 設屬性，就在這裡寫)
const ARTWORK_DATA = {
  'Art001': {
    title: '隱形的焦慮：聽覺隱私',
    desc: `「上次去剛好遇到一群男生，好尷尬...」

這句無心的抱怨，揭露了性別友善空間中，最常被忽視的一道高牆——聲音。

當視覺被門板阻隔後，我們對於「聽覺赤裸」的焦慮反而被放大了。在安靜的空間裡，生理聲響彷彿成為了一種公開的審判，讓我們在原本該放鬆的時刻，反而感到緊繃與羞恥。`,
    audio: '/audio/voice_01.mp3'
  },
  'Art_02': {
    title: '未來的種子',
    desc: '一顆種子，乘載著對環境復甦的希望。',
    audio: '/audio/voice_02.mp3'
  },
  'Art003': {
    title: '色盲矯正眼鏡',
    desc: '儘管不是對任何種類的色盲都有用（這個發明主要對紅綠色盲有效，對藍黃色盲和全色盲無效），色盲矯正眼鏡依然是相當巧妙的發明。透過用奈米鍍膜濾除讓色盲患者的感光細胞容易混淆的光區段，這種眼鏡將色彩之間的差異更強烈的突顯出來，令色盲患者能真正看見顏色。',
    // audio: '/audio/voice_01.mp3'
  },
  // ... 對應你的 Blender 物件名稱（支援 Art_XX 或 ArtXXX 格式）
}

export default function Exhibits({ scene, openModal, onSit }) {
  const [hovered, setHovered] = useState(null)
  const { gl } = useThree()
  
  // 用來播放聲音的 Ref
  const audioPlayer = useRef(null)
  
  // 初始化音頻播放器
  useEffect(() => {
    audioPlayer.current = new Audio()
    audioPlayer.current.preload = 'auto'
    audioPlayer.current.volume = 0.7
    
    // 添加事件监听器用于调试
    const handleLoadedData = () => {
      console.log('Audio loaded:', audioPlayer.current?.src)
    }
    const handlePlay = () => {
      console.log('Audio started playing')
    }
    const handleError = (e) => {
      console.error('Audio error:', e)
      console.error('Audio error details:', {
        error: audioPlayer.current?.error,
        code: audioPlayer.current?.error?.code,
        message: audioPlayer.current?.error?.message,
        src: audioPlayer.current?.src
      })
    }
    
    if (audioPlayer.current) {
      audioPlayer.current.addEventListener('loadeddata', handleLoadedData)
      audioPlayer.current.addEventListener('play', handlePlay)
      audioPlayer.current.addEventListener('error', handleError)
    }
    
    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.removeEventListener('loadeddata', handleLoadedData)
        audioPlayer.current.removeEventListener('play', handlePlay)
        audioPlayer.current.removeEventListener('error', handleError)
        audioPlayer.current.pause()
        audioPlayer.current.src = ''
        audioPlayer.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!scene) return

    const processedObjects = new Set()

    scene.traverse((child) => {
      // 找出所有名字以 'Art' 開頭的 Mesh（支援 Art_XX 或 ArtXXX 格式）
      const name = child.name || ''
      // 匹配 Art_01, Art_02, Art001, Art002 等格式（Art 後面跟著下劃線或數字）
      const isArtObject = /^Art[_0-9]/.test(name)
      
      if (child.isMesh && isArtObject && !processedObjects.has(child.uuid)) {
        processedObjects.add(child.uuid)
        
        // 1. 初始化材質設定 (開啟發光支援)
        // 確保材質是 StandardMaterial 才能發光
        if (!child.material.emissive) {
          // 保存原始材質屬性
          const originalMaterial = child.material
          
          // 創建新的 StandardMaterial
          const newMaterial = new THREE.MeshStandardMaterial({
            map: originalMaterial.map, // 保留原本貼圖
            color: originalMaterial.color || new THREE.Color(0xffffff),
            transparent: originalMaterial.transparent || false,
            opacity: originalMaterial.opacity !== undefined ? originalMaterial.opacity : 1,
            side: originalMaterial.side || THREE.FrontSide,
            // 複製其他可能的屬性
            ...(originalMaterial.normalMap && { normalMap: originalMaterial.normalMap }),
            ...(originalMaterial.roughness !== undefined && { roughness: originalMaterial.roughness }),
            ...(originalMaterial.metalness !== undefined && { metalness: originalMaterial.metalness }),
          })
          
          child.material = newMaterial
          
          // 如果有多個材質（數組），處理每個材質
          if (Array.isArray(originalMaterial)) {
            child.material = originalMaterial.map((mat, idx) => {
              if (!mat.emissive) {
                return new THREE.MeshStandardMaterial({
                  map: mat.map,
                  color: mat.color || new THREE.Color(0xffffff),
                  transparent: mat.transparent || false,
                  opacity: mat.opacity !== undefined ? mat.opacity : 1,
                })
              }
              return mat
            })
          }
        }
        
        // 設定預設發光顏色 (常態微微發光)
        const material = Array.isArray(child.material) ? child.material[0] : child.material
        if (material && material.emissive) {
          material.emissive = new THREE.Color('#ffaa00') // 橘色光
          material.emissiveIntensity = 0.8 // 常態微微發光，在無環境光下也能清楚看到
        }
        
        // 標記為可互動
        child.userData.isInteractable = true
        
        // 確保可以接收事件
        child.raycast = THREE.Mesh.prototype.raycast
        
        console.log(`Found interactable artwork: ${child.name}, isInteractable: ${child.userData.isInteractable}`)
      }
    })
  }, [scene])

  const handlePointerOver = (e) => {
    e.stopPropagation()
    const obj = e.object
    
    // 檢查物件本身或父物件是否可互動
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      gl.domElement.style.cursor = 'pointer'
      
      // 🔥 微光設定：強度設為 2.0 就好 (只要比 1.1 大就會發光)
      // 這樣既有光暈，又看得到原本的顏色
      const material = Array.isArray(interactableObj.material) 
        ? interactableObj.material[0] 
        : interactableObj.material
      
      if (material && material.emissive) {
        material.emissiveIntensity = 2.0  // 微光強度，保留物體本色
        // toneMapped 預設為 true，顏色會比較自然，不會有「過曝」的感覺
      }
      
      setHovered(interactableObj.name)
    }
  }

  const handlePointerOut = (e) => {
    const obj = e.object
    
    // 檢查物件本身或父物件是否可互動
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      gl.domElement.style.cursor = 'auto'
      
      // 變回暗淡
      const material = Array.isArray(interactableObj.material) 
        ? interactableObj.material[0] 
        : interactableObj.material
      
      if (material && material.emissive) {
        material.emissiveIntensity = 0.8 // 恢復到常態微微發光
      }
      
      setHovered(null)
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const obj = e.object
    
    console.log('Exhibits clicked object:', obj.name, 'isInteractable:', obj.userData.isInteractable, 'isSeat:', obj.userData.isSeat)
    
    // 先檢查是否是懶骨頭
    const isSeat = obj.userData.isSeat || obj.parent?.userData.isSeat
    if (isSeat && onSit) {
      const seatPos = new THREE.Vector3()
      const targetObject = obj.userData.isSeat ? obj : obj.parent
      targetObject.getWorldPosition(seatPos)
      seatPos.y += 0.5
      console.log('Exhibits: Seat clicked! Position:', seatPos)
      onSit([seatPos.x, seatPos.y, seatPos.z])
      return
    }
    
    // 檢查物件本身或父物件是否可互動（藝術品）
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
      if (interactableObj) {
        console.log('Checking parent:', interactableObj.name, 'isInteractable:', interactableObj.userData.isInteractable)
      }
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      console.log('Found interactable object:', interactableObj.name)
      console.log('Available keys in ARTWORK_DATA:', Object.keys(ARTWORK_DATA))
      console.log('Looking for:', interactableObj.name, 'Found:', ARTWORK_DATA[interactableObj.name])
      
      const data = ARTWORK_DATA[interactableObj.name] || { 
        title: interactableObj.name || '未命名作品', 
        desc: '這是一件美麗的藝術品。',
        description: '這是一件美麗的藝術品。',
        audio: '' 
      }
      
      console.log('Artwork data:', data)
      
      // 1. 播放聲音
      if (data.audio && audioPlayer.current) {
        try {
          console.log('Playing audio:', data.audio)
          // 停止之前播放的音頻
          if (!audioPlayer.current.paused) {
            audioPlayer.current.pause()
          }
          audioPlayer.current.currentTime = 0
          
          // 設置新的音頻源（使用絕對路徑確保正確）
          const audioPath = data.audio.startsWith('/') ? data.audio : `/${data.audio}`
          audioPlayer.current.src = audioPath
          audioPlayer.current.volume = 0.7 // 設置音量
          
          // 確保音頻加載後再播放
          audioPlayer.current.load()
          
          audioPlayer.current.play().then(() => {
            console.log('Audio playing successfully:', audioPath)
          }).catch(err => {
            console.warn('Audio play failed:', err)
            console.warn('This might be due to browser autoplay policy. User interaction required.')
          })
        } catch (error) {
          console.warn('Audio error:', error)
          console.warn('Audio path:', data.audio)
        }
      } else {
        if (!data.audio) {
          console.log('No audio file specified for this artwork')
        } else {
          console.warn('AudioPlayer not initialized')
        }
      }
      
      // 2. 打開 UI (呼叫外層 function)
      if (openModal) {
        console.log('Calling openModal with data:', {
          title: data.title,
          description: data.desc || data.description,
          audio: data.audio,
          ...data
        })
        openModal({
          title: data.title,
          description: data.desc || data.description,
          audio: data.audio,
          ...data
        })
      } else {
        console.warn('openModal function is not provided')
      }
    } else {
      console.log('Clicked object is not interactable')
    }
  }

  // 如果沒有 scene，不渲染任何東西
  if (!scene) return null

  return (
    <primitive 
      object={scene} 
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

