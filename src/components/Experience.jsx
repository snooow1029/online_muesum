import { useGLTF, Environment, KeyboardControls, useVideoTexture, Text } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
// EffectComposer 和 Bloom 已移到 App.jsx，這裡不需要導入
import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import Player from './Player'
import FutureRoom from '../FutureRoom'
import ErrorBoundary from './ErrorBoundary'
// TestArtifact 測試組件已移除，不再需要
// Exhibits 組件已整合到 GalleryModel 中，不再需要單獨導入

// 展品資料對照表
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
  'Art004': {
    title: '人道救援前線的3D列印機',
    desc: '待補',
    // audio: '/audio/voice_01.mp3'
  },
  'Art018': {
    title: '爬樓梯的輪椅',
    desc: '這款輪椅和一般輪椅設計上的最大不同就是輪子。藉由將輪子連上附加的履帶，讓輪椅能像坦克一樣克服崎嶇的地形。除了將輪椅裝上履帶外，也能直接利用履帶系統本身直接搬運人體，機動性十足。',
    question: '既然履帶能克服較多地形，為何我們不捨棄輪子，全面採用履帶呢？',
    // audio: '/audio/voice_01.mp3'
  },
  'Art006': {
    title: '斜躺自行車',
    desc: '厭倦了一般的騎車姿勢嗎？這台自行車能帶給你一些新樂趣。藉由改變齒輪的位置，騎乘者能採用輕鬆的躺姿來移動，即便是不耐久坐者也能享受更多騎自行車的樂趣。而且，躺臥的姿勢還能讓你取得更多流體力學上的優勢！',
    question: '趣味問題：專業自行車騎士是如何在坐姿下減低風阻的？',
    // audio: '/audio/voice_01.mp3'
  },
  'Art007': {
    title: '赤足鞋',
    desc: '如其名字所示，這種鞋子的目標便是讓你感覺穿了跟沒穿一樣。它能讓腳移動得更自然，也能鍛鍊部分肌肉。然而在使用前仍要注意自己有沒有既存的腳部問題並請醫生評估，避免意外加重病情。',
    // audio: '/audio/voice_01.mp3'
  },
  'Art008': {
    title: 'PARO海豹',
    desc: '許多生活在大城市中的人或許都有感到孤獨的經驗。而這個可愛的小機器人正是被設計來改變這點。它能提供充足的陪伴，對聲音做出反應，彷彿一隻真正的寵物。這對都市居民來說無疑是一大優點，畢竟不是所有人都有能力飼養寵物。',
    // audio: '/audio/voice_01.mp3'
  },
  'Art009': {
    title: '自動洗澡機',
    desc: '洗澡這件事聽起來再簡單不過。然而，對於長者或身心障礙者來說可不是這麼一回事。這台機器不僅能改善現在看護短缺的情況，更能在洗澡的過程中給予被照顧者更多隱私。不過，對一般人來說或許也相當有吸引力。',
    // audio: '/audio/voice_01.mp3'
  },
  'Art010': {
    title: '台語中文翻譯app',
    desc: '待補',
    // audio: '/audio/voice_01.mp3'
  },
  'Art011': {
    title: '虛擬金孫',
    desc: '待補',
    // audio: '/audio/voice_01.mp3'
  },
  'Art012': {
    title: '遠端健康監測裝置',
    desc: '手機跳出的「心率變高」，在孫女眼中是跌倒的警訊，在阿公身上其實只是彎腰找拐杖的氣喘吁吁。\n\n這段對話揭露了遠端照護目前最尷尬的死角：數據是即時的，卻是去脈絡化的。當「訊號中斷」被解讀為危機，而洗手被視為異常，科技監測是否反而在家人之間製造了不必要的恐慌？我們缺少的或許不是更靈敏的感測器，而是能讀懂「生活情境」、分辨什麼是危機、什麼只是日常的智慧',
    // audio: '/audio/voice_01.mp3'
  },
  'Art013': {
    title: '老人防摔背心',
    desc: "阿公對公園裡的威脅如數家珍：磚頭路、奔跑的小孩、鑽來鑽去的狗。\n\n這顯示了在跌倒的恐懼陰影下，長輩眼中的世界已經變形了。防摔背心在這裡不只是物理防護，更是一種心理上的「通行證」。阿公對背心的堅持，其實是對恐懼的妥協。我們該問的是：除了被動地穿上厚重的護具，我們還能如何重新設計環境或輔具，讓長輩能找回那份「輕裝出門」的自信與自由？",
    // audio: '/audio/voice_01.mp3'
  },
  'Art014': {
    title: '看遠看近二合一眼鏡',
    desc: '「你敢欲先用我的？」「袂使啦，你彼是老花...」\n\n這段父子間的對話，無意間點出了當前視力輔具最大的荒謬：我們的眼睛每天都在應對變動的世界，但眼鏡卻是「僵固」的。\n\n年輕人的近視、長輩的老花、看遠與看近的切換... 這些生理差異將我們劃分成一座座無法互相支援的孤島。為什麼「看清楚」這件事，必須依賴這麼多副功能單一、且無法共享的玻璃鏡片？這是否意味著，現有的輔具設計早已跟不上我們複雜的用眼需求？',
    // audio: '/audio/voice_01.mp3'
  },
  
  // ... 對應你的 Blender 物件名稱（支援 Art_XX 或 ArtXXX 格式）
}

function GalleryModel({ onSit, onSceneReady, openModal, isFutureRoom = false }) {
  const { gl } = useThree()
  const [hovered, setHovered] = useState(null)
  const audioPlayer = useRef(null)
  
  // 1. 載入你剛剛匯出的完整模型
  const { scene } = useGLTF('/models/exhibition_full.glb')

  // 2. 準備影片 (這是給穹頂用的) - 使用状态来存储视频纹理
  const [videoTexture, setVideoTexture] = useState(null)
  
  // 初始化音頻播放器
  useEffect(() => {
    audioPlayer.current = new Audio()
    audioPlayer.current.preload = 'auto'
    audioPlayer.current.volume = 0.7
    
    return () => {
      if (audioPlayer.current) {
        audioPlayer.current.pause()
        audioPlayer.current.src = ''
        audioPlayer.current = null
      }
    }
  }, [])
  
  // 尝试加载视频，但不阻塞模型渲染
  useEffect(() => {
    console.log('Starting video load...')
    // 创建一个视频元素来测试视频是否存在
    const video = document.createElement('video')
    video.src = '/videos/dome_demo.mp4'
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = true
    video.autoplay = true
    video.playsInline = true
    video.preload = 'auto'
    
    // 添加多个事件监听器来追踪加载状态
    video.onloadstart = () => {
      console.log('Video load started')
    }
    
    video.onloadedmetadata = () => {
      console.log('Video metadata loaded')
    }
    
    video.onloadeddata = () => {
      // 视频加载成功，创建纹理
      console.log('Video loaded successfully:', video.src, 'Video readyState:', video.readyState)
      try {
        const texture = new THREE.VideoTexture(video)
        texture.flipY = false
        
        // 设置纹理包装模式
        // 对于半球形屏幕，通常使用 ClampToEdgeWrapping 避免边缘重复
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        
        // 默认使用 UVMapping，如果视频是 360 度格式，会在应用材质时改为 EquirectangularReflectionMapping
        texture.mapping = THREE.UVMapping
        
        setVideoTexture(texture)
        console.log('Video texture created successfully, video element:', video)
        
        // 确保视频播放
        const tryPlay = () => {
          if (video.paused) {
            video.play().then(() => {
              console.log('Video started playing, currentTime:', video.currentTime)
              // 确保纹理更新
              texture.needsUpdate = true
            }).catch(err => {
              console.warn('Video play error:', err)
              // 如果自动播放失败，尝试用户交互后播放
              const playOnClick = () => {
                video.play().then(() => {
                  console.log('Video playing after user interaction')
                  texture.needsUpdate = true
                }).catch(e => console.warn('Video play retry error:', e))
              }
              document.addEventListener('click', playOnClick, { once: true })
            })
          } else {
            console.log('Video is already playing')
            texture.needsUpdate = true
          }
        }
        
        // 立即尝试播放
        tryPlay()
        
        // 也监听 canplay 事件
        video.addEventListener('canplay', tryPlay, { once: true })
      } catch (error) {
        console.error('Error creating video texture:', error)
      }
    }
    
    video.onerror = (e) => {
      console.error('Video load error:', e, 'Error code:', video.error?.code, 'Error message:', video.error?.message)
    }
    
    // 开始加载视频
    video.load()
    
    return () => {
      if (videoTexture) {
        videoTexture.dispose()
      }
      video.remove()
    }
  }, [])

  // Clone the scene and enable shadows on all meshes
  const { clonedScene, position } = useMemo(() => {
    const cloned = scene.clone()
    
    // Calculate bounding box to understand model size and position
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    // Scale down the model (adjust scale factor as needed)
    // 先不缩放，看看原始大小
    const scaleFactor = 1.0 // 暂时不缩放，看看模型大小
    cloned.scale.set(scaleFactor, scaleFactor, scaleFactor)
    
    
    // Recalculate bounding box after scaling
    const scaledBox = new THREE.Box3().setFromObject(cloned)
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
    const scaledSize = scaledBox.getSize(new THREE.Vector3())
    
    // 计算位置：将模型放在原点附近
    // Y 轴：让模型向下移动，可能需要调整 offset
    // 根据控制台，scaledBox.min.y = -87.8，如果 positionY = -scaledBox.min.y = 87.8
    // 模型底部会在 y=0，但可能还是太高，我们向下移动一些
    const positionX = 0
    const positionY = -scaledBox.min.y - 87  // 向下移动 100 单位（调低模型高度）
    const positionZ = 0
    
    // console.log('Calculated position:', [positionX, positionY, positionZ])
    // console.log('Model bottom will be at y =', scaledBox.min.y + positionY, '(adjusted downward)')
    // console.log('Model center will be at y =', scaledCenter.y + positionY)
    
    // Enable shadows on all meshes and mark artworks
    const processedObjects = new Set()
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // 標記藝術品（支援 Art_XX 或 ArtXXX 格式）
        const name = child.name || ''
        const isArtObject = /^Art[_0-9]/.test(name)
        
        if (isArtObject && !processedObjects.has(child.uuid)) {
          processedObjects.add(child.uuid)
          
          // 不管原本材質如何，強制 Clone 一份獨立的材質給這個 Mesh
          // 這樣修改它的發光屬性時，才不會影響到別人
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              // 如果是材質陣列，複製每一個
              child.material = child.material.map(m => {
                const newMat = m.clone()
                // 確保這是 Standard 材質以支援發光
                if (!newMat.emissive) {
                  // 如果原本不是 StandardMaterial，這裡可能會需要轉型，但 clone 通常保留原屬性
                  // 這裡我們直接在新材質上設定發光屬性
                  newMat.emissive = new THREE.Color('#ffaa00')
                  newMat.emissiveIntensity = 0.8
                } else {
                   // 如果原本就有發光屬性，覆蓋它
                   newMat.emissive = new THREE.Color('#ffaa00')
                   newMat.emissiveIntensity = 0.8
                }
                return newMat
              })
            } else {
              // 如果是單一材質，直接 Clone
              const newMat = child.material.clone()
              
              // 設定發光顏色 (常態微微發光)
              newMat.emissive = new THREE.Color('#ffaa00')
              newMat.emissiveIntensity = 0.8
              
              // 重新指派給 child
              child.material = newMat
            }
          }
          
          // 標記為可互動
          child.userData.isInteractable = true
          child.raycast = THREE.Mesh.prototype.raycast
          
          console.log(`Found interactable artwork: ${child.name} (Material cloned)`)
        }
        
      }
    })
    
    return {
      clonedScene: cloned,
      position: [positionX, positionY, positionZ]
    }
  }, [scene])

  // 3. 遍歷(Traverse)整個場景，找出特殊物件
  useEffect(() => {
    clonedScene.traverse((child) => {
      // ---  偵測穹頂 (Dome) ---
      // 判斷條件：物件是 Mesh 且 材質名稱叫 'DomeScreen' (或物件名稱叫 DomeScreen)
      // 注意：跳過 final room 區域的穹頂，讓 FutureRoom 組件處理
      if (child.isMesh && (child.material.name === 'DomeScreen' || child.name === 'DomeScreen')) {
        // 檢查是否是 final room 的穹頂（通過位置判斷）
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        const isFutureRoomDome = 
          worldPos.z < -50 ||  // final room 在 z < -50 的區域（根據實際位置調整）
          worldPos.x < -50     // 或者 x < -50
        
        if (isFutureRoomDome) {
          console.log('GalleryModel: Skipping future room dome (will be handled by FutureRoom):', child.name, 'at', worldPos)
          // 標記這個穹頂已經被 FutureRoom 處理，避免重複處理
          child.userData.isFutureRoomDome = true
          return // 跳過這個穹頂，讓 FutureRoom 處理
        }
        
        console.log('GalleryModel: Found first room Dome:', child.name, 'Material:', child.material.name, 'at', worldPos)
        // 賦予它發光的影片材質（只有在视频加载成功时才应用）
        if (videoTexture) {
          console.log('Applying video texture to dome')
          
          // 检查视频是否是 360 度格式（equirectangular）
          // 如果是 360 度视频，使用 EquirectangularReflectionMapping
          // 如果是普通视频，使用 UVMapping（依赖模型的 UV 坐标）
          // 你可以根据实际视频格式调整这个设置
          const is360Video = false // 设置为 true 如果你的视频是 360 度格式
          
          if (is360Video) {
            videoTexture.mapping = THREE.EquirectangularReflectionMapping
            console.log('Using Equirectangular mapping for 360 video')
          } else {
            videoTexture.mapping = THREE.UVMapping
            console.log('Using UV mapping (depends on model UV coordinates)')
          }
          
          // 对于半球形屏幕，使用 BackSide（只从内部观看）
          // 因为我们在球体/半球体内部，需要渲染背面才能看到
          child.material = new THREE.MeshBasicMaterial({
            map: videoTexture,
            side: THREE.DoubleSide, // 只从内部观看
            toneMapped: false,    // 不受光照影響，保持影片原色
            transparent: false,
          })
          
          // 确保视频纹理正确应用
          videoTexture.needsUpdate = true
          
          console.log('Dome material applied:', {
            hasMap: !!child.material.map,
            side: child.material.side,
            mapping: videoTexture.mapping
          })
          
          // 检查模型的 UV 坐标
          if (child.geometry) {
            const uvAttribute = child.geometry.attributes.uv
            if (uvAttribute) {
              console.log('Dome has UV coordinates, count:', uvAttribute.count)
              // UV 坐标已经存在，视频会按照 UV 坐标映射
              // 如果失真严重，可能需要：
              // 1. 使用 360 度视频格式
              // 2. 或者在 Blender 中调整 UV 映射
            } else {
              console.warn('Dome mesh has no UV coordinates - video may not display correctly')
            }
          }
          
          // 确保材质更新
          child.material.needsUpdate = true
          
          // 确保视频播放和纹理更新
          if (videoTexture && videoTexture.image && videoTexture.image instanceof HTMLVideoElement) {
            const video = videoTexture.image
            console.log('Dome video element:', {
              readyState: video.readyState,
              paused: video.paused,
              currentTime: video.currentTime,
              duration: video.duration,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight
            })
            
            // 确保视频循环和静音
            video.loop = true
            video.muted = true
            
            // 强制播放视频
            const playVideo = () => {
              if (video.paused) {
                video.play().then(() => {
                  console.log('Video playing successfully, currentTime:', video.currentTime)
                  // 确保视频纹理更新
                  if (videoTexture) {
                    videoTexture.needsUpdate = true
                  }
                }).catch(err => {
                  console.warn('Video play error in material:', err)
                  // 尝试用户交互后播放
                  const playOnClick = () => {
                    video.play().then(() => {
                      console.log('Video playing after user interaction')
                      if (videoTexture) {
                        videoTexture.needsUpdate = true
                      }
                    }).catch(e => console.warn('Video play retry error:', e))
                  }
                  document.addEventListener('click', playOnClick, { once: true })
                })
              } else {
                console.log('Video is already playing')
              }
            }
            
            // 如果视频已经可以播放，立即播放
            if (video.readyState >= 2) {
              playVideo()
            } else {
              // 等待视频可以播放
              video.addEventListener('canplay', playVideo, { once: true })
              video.addEventListener('loadeddata', playVideo, { once: true })
            }
            
            // 定期更新纹理（使用 requestAnimationFrame）
            // 无论视频是否暂停，都更新纹理（确保能看到第一帧和后续帧）
            const updateTexture = () => {
              if (videoTexture && video && video.readyState >= 2) {
                videoTexture.needsUpdate = true
              }
            }
            
            // 優化：使用較低頻率的更新循環以提升性能（30 FPS 而非 60 FPS）
            // 檢查是否已經啟動了更新循環
            if (!child.userData.videoUpdateStarted) {
              let animationFrameId = null
              let lastUpdateTime = 0
              const UPDATE_INTERVAL = 1000 / 30 // 30 FPS 更新
              
              const startUpdating = () => {
                const update = (currentTime) => {
                  // 限制更新頻率以提升性能
                  if (currentTime - lastUpdateTime >= UPDATE_INTERVAL) {
                    updateTexture()
                    lastUpdateTime = currentTime
                  }
                  animationFrameId = requestAnimationFrame(update)
                }
                update(performance.now())
              }
              
              // 立即啟動更新，不延遲
              startUpdating()
              child.userData.videoUpdateStarted = true
              
              // 存儲清理函數到 userData，以便後續清理
              child.userData.videoUpdateCleanup = () => {
                if (animationFrameId) {
                  cancelAnimationFrame(animationFrameId)
                  animationFrameId = null
                }
                child.userData.videoUpdateStarted = false
              }
            }
          } else {
            console.warn('Video texture image is not an HTMLVideoElement', {
              hasVideoTexture: !!videoTexture,
              hasImage: !!(videoTexture && videoTexture.image),
              isVideoElement: !!(videoTexture && videoTexture.image instanceof HTMLVideoElement)
            })
          }
        } else {
          console.warn('No video texture available for dome')
          // 如果没有视频，使用白色材质确保可见
          child.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.BackSide,
          })
        }
      }

      // --- 🛋️ 偵測懶骨頭 (Bean Bags) ---
      // 判斷條件：名字裡面包含 "BeanBag"、"bean"、"seat" 或特定的物件名稱
      const name = child.name ? child.name.toLowerCase() : ''
      const isBeanBag = name.includes('beanbag') || name.includes('bean')
      
      if (isBeanBag) {
        // 幫它打上標記，之後點擊時才知道這是椅子
        child.userData.isSeat = true
        
        // 判斷是否屬於 final room（第二展間）的懶骨頭
        // 可以通過名稱、位置或其他標識來區分
        // 注意：需要根據實際模型調整判斷條件
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        
        const isFutureRoomSeat = 
          name.includes('future') || 
          name.includes('room2') || 
          name.includes('final') ||
          // 或者通過位置判斷（可以根據實際模型調整）
          worldPos.z > 50 ||  // 假設 final room 在 z > 50 的區域
          worldPos.x > 50 ||   // 或者 x > 50
          worldPos.z < -50     // 或者 z < -50（根據實際模型位置調整）
        
        if (isFutureRoomSeat) {
          child.userData.isFutureRoomSeat = true
          console.log('✅ Found FUTURE ROOM beanbag seat:', child.name, 'at world position:', worldPos)
        } else {
          console.log('📍 Found FIRST ROOM beanbag seat:', child.name, 'at world position:', worldPos)
        }
        
        // 確保可以點擊
        if (child.isMesh) {
          // 確保 mesh 可以接收射線檢測（raycast）
          child.raycast = THREE.Mesh.prototype.raycast
        }
        
        // 可選：把懶骨頭顏色稍微調亮一點，或者加上邊緣光讓玩家知道可點
        // child.material.emissive = new THREE.Color(0x222222)
      }
      
      // 開啟所有物體的陰影和點擊檢測
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // 確保所有 mesh 都可以接收點擊事件
        // 如果沒有 raycast 方法，使用默認的
        if (!child.raycast) {
          child.raycast = THREE.Mesh.prototype.raycast
        }
      }
    })
    
    // 清理函数：停止所有视频更新
    return () => {
      clonedScene.traverse((child) => {
        if (child.userData && child.userData.videoUpdateCleanup) {
          child.userData.videoUpdateCleanup()
        }
      })
    }
  }, [clonedScene, videoTexture])

  // 4. 事件處理函數 - 統一處理藝術品和懶骨頭的互動
  const handlePointerOver = (e) => {
    e.stopPropagation()
    const obj = e.object
    
    // 先恢復之前 hover 的物件（如果有的話）
    if (hovered) {
      clonedScene.traverse((child) => {
        if (child.userData.isInteractable && child.name === hovered) {
          const material = Array.isArray(child.material) 
            ? child.material[0] 
            : child.material
          if (material && material.emissive) {
            material.emissiveIntensity = 0.8
          }
        }
      })
    }
    
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      gl.domElement.style.cursor = 'pointer'
      // 只修改當前 hover 的物件的材質
      const material = Array.isArray(interactableObj.material) 
        ? interactableObj.material[0] 
        : interactableObj.material
      if (material && material.emissive) {
        material.emissiveIntensity = 2.0
      }
      setHovered(interactableObj.name)
    }
  }

  const handlePointerOut = (e) => {
    const obj = e.object
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      gl.domElement.style.cursor = 'auto'
      // 只恢復當前離開的物件的材質
      const material = Array.isArray(interactableObj.material) 
        ? interactableObj.material[0] 
        : interactableObj.material
      if (material && material.emissive) {
        material.emissiveIntensity = 0.8
      }
      // 只有當離開的物件是當前 hover 的物件時，才清除 hover 狀態
      if (hovered === interactableObj.name) {
        setHovered(null)
      }
    }
  }

  const handleClick = (e) => {
    e.stopPropagation()
    const obj = e.object
    
    console.log('GalleryModel clicked:', obj.name, 'isInteractable:', obj.userData.isInteractable, 'isSeat:', obj.userData.isSeat)
    
    // 先檢查是否是懶骨頭
    const isSeat = obj.userData.isSeat || obj.parent?.userData.isSeat
    if (isSeat && onSit) {
      // 檢查是否是第二展間（final room）的懶骨頭
      const targetObject = obj.userData.isSeat ? obj : obj.parent
      const isFutureRoomSeat = 
        targetObject.userData.isFutureRoomSeat || 
        obj.userData.isFutureRoomSeat ||
        obj.parent?.userData.isFutureRoomSeat
      
      console.log('Seat clicked! isFutureRoom:', isFutureRoomSeat)
      // 只傳遞 isFutureRoom 標識，不傳遞位置（因為不需要移動視角）
      onSit(null, isFutureRoomSeat)
      return
    }
    
    // 檢查是否是藝術品
    let interactableObj = obj
    while (interactableObj && !interactableObj.userData.isInteractable) {
      interactableObj = interactableObj.parent
    }
    
    if (interactableObj && interactableObj.userData.isInteractable) {
      console.log('Found interactable object:', interactableObj.name)
      const data = ARTWORK_DATA[interactableObj.name] || { 
        title: interactableObj.name || '未命名作品', 
        desc: '這是一件美麗的藝術品。',
        description: '這是一件美麗的藝術品。',
        audio: '' 
      }
      
      // 播放聲音
      if (data.audio && audioPlayer.current) {
        try {
          if (!audioPlayer.current.paused) {
            audioPlayer.current.pause()
          }
          audioPlayer.current.currentTime = 0
          const audioPath = data.audio.startsWith('/') ? data.audio : `/${data.audio}`
          audioPlayer.current.src = audioPath
          audioPlayer.current.volume = 0.7
          audioPlayer.current.load()
          audioPlayer.current.play().catch(err => {
            console.warn('Audio play failed:', err)
          })
        } catch (error) {
          console.warn('Audio error:', error)
        }
      }
      
      // 打開 UI
      if (openModal) {
        openModal({
          title: data.title,
          description: data.desc || data.description,
          audio: data.audio,
          ...data
        })
      }
    }
  }

  // 添加调试信息并通知父组件 scene 已准备好
  useEffect(() => {
    console.log('GalleryModel rendered - Position:', position)
    console.log('Video texture:', videoTexture ? 'loaded' : 'not loaded')
    console.log('Model scene children count:', clonedScene.children.length)
    
    // 通知父组件 scene 已准备好（用于 Exhibits 组件）
    if (onSceneReady && clonedScene) {
      onSceneReady(clonedScene)
    }
  }, [position, videoTexture, clonedScene, onSceneReady])

  return (
    <primitive 
      object={clonedScene} 
      position={position} 
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}

useGLTF.preload('/models/exhibition_full.glb')

// 牆壁文字組件
function WallText() {
  // 標題使用 GenMin 字體
  const titleFont = "/fonts/GenMin.ttf"
  // 前言內文使用 GenYoMin.ttf（更適合橫排，標點符號位置正確）
  const bodyFont = "/fonts/GenYoMin.ttf" 

  return (
    // 建立一個 Group 把整塊文字包起來，方便統一移動位置
    // 這裡設在原本兩個位置的中間點附近
    <group position={[32, 13, 47]} rotation={[0, 0, 0]}>
      
      {/* --- 左側區塊：標題區 (向左移動 -6) --- */}
      <group position={[-2, 1, 0]}>
        {/* 英文裝飾小字 (增加設計感) */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.5}
          color="#aaaaaa"
          font={titleFont}
          anchorX="right" // 靠右對齊中線
          anchorY="bottom"
          letterSpacing={0.2}
        >
          ORANGE TECH EXHIBITION
        </Text>

        {/* 主標題 */}
        <Text
          position={[0, 0, 0]}
          fontSize={4.5} // 稍微加大
          color="#222222" // 深炭灰比純黑更有質感
          font={titleFont}
          anchorX="right" // 靠右對齊中線
          anchorY="middle"
        >
          有你的橘
        </Text>

        {/* 副標題 - 使用橘色點綴 */}
        <Text
          position={[0, -2.5, 0]} 
          fontSize={1.0}
          color="#ffaa00" // 展覽主題色
          font={titleFont}
          anchorX="right" // 靠右對齊中線
          anchorY="top"
          letterSpacing={0.05}
        >
          ( 橘色科技不是橘色柯基 )
        </Text>
      </group>

      {/* --- 中間：視覺分割線 --- */}
      <mesh position={[0, 0, 0]}>
        {/* 一條細長的豎線：寬0.1, 高12 */}
        <boxGeometry args={[0.1, 12, 0.1]} />
        <meshStandardMaterial color="#dddddd" />
      </mesh>

      {/* --- 右側區塊：前言內文 (向右移動 +2) --- */}
      <group position={[2, 0, 0]}>
        <Text
          position={[0, 4, 0]} // 從上往下排
          fontSize={0.7}
          color="#444444"
          font={bodyFont}
          anchorX="left" // 🔥 關鍵：靠左對齊
          anchorY="top"  // 🔥 關鍵：從頂部開始
          maxWidth={7}   // 限制寬度，形成漂亮的長條狀
          lineHeight={1.6} // 行距拉大，增加呼吸感
          textAlign="justify" // 左右對齊 (如果字體支援) 或 left
        >
          從古至今，科技的發展已替人類解決不少問題。
          從改善生存條件的水道建設和食品改良，到讓我們能探索世界的交通工具，
          再到治療曾經致命的疾病。人類已經克服不少困境，彷彿無所不能。
          {'\n\n'}
          然而，在追求越來越大的發現時，我們似乎經常忽略日常中仍有許多待解決的問題。
          儘管這些問題往往被認為微不足道，但卻會在不知不覺中大大影響身邊人們生活的舒適度。
          {'\n\n'}
          因此，我們希望能透過這個展覽，邀請各位思考並發掘更多不同的可能性。
          說不定，更舒適友善的世界，就在各位的一念之間呢！
        </Text>
      </group>

    </group>
  )
}


export default function Experience({ onArtifactInteract, onSit, wordCloudData = [] }) {
  const [exhibitionScene, setExhibitionScene] = useState(null)
  
  // 處理懶骨頭點擊：只觸發手機輸入界面，不改變視角
  const handleSeatClick = useCallback((position, isFutureRoom = false) => {
    console.log('handleSeatClick called:', { position, isFutureRoom })
    if (onSit) {
      // 只傳遞 isFutureRoom 標識，不傳遞位置（因為不需要移動視角）
      onSit(null, isFutureRoom)
    }
  }, [onSit])
  
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['w', 'W', 'ArrowUp'] },
        { name: 'backward', keys: ['s', 'S', 'ArrowDown'] },
        { name: 'left', keys: ['a', 'A', 'ArrowLeft'] },
        { name: 'right', keys: ['d', 'D', 'ArrowRight'] },
      ]}
    >
      <Physics gravity={[0, 0, 0]}>
        {/* Fog - 增加空間的空氣感 */}
        <fog attach="fog" args={['#000000', 50, 200]} />
        
        {/* Basic Lighting - 低強度環境光，讓場景可見但保持展品發光效果 */}
        {/* 低強度環境光，讓場景可見 */}
        <ambientLight intensity={2} />
        {/* 定向光已關閉，避免過亮 */}
        <directionalLight intensity={0.4} />

        {/* Environment - 使用更輕量的設定 */}
        {/* <Environment preset="city" intensity={0.2} /> */}

        {/* Grid helper - 開發時使用，可以註解掉以提升性能 */}
        {/* <gridHelper args={[240, 240]} position={[0, 0, 0]} /> */}

        {/* Ground plane for physics */}
        <RigidBody type="fixed" position={[0, 0, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[240, 240]} />
            <meshStandardMaterial color="#888888" transparent opacity={0} />
          </mesh>
        </RigidBody>

        {/* Gallery Model - 整合了藝術品互動和懶骨頭功能（第一展間） */}
        <GalleryModel 
          onSit={handleSeatClick} 
          onSceneReady={setExhibitionScene}
          openModal={onArtifactInteract}
        />

        {/* Future Room - 第二展間：共創體驗（穹頂文字雲） */}
        {/* 注意：需要 /models/final_room.glb 文件存在才能使用 */}
        {/* 如果模型文件不存在，ErrorBoundary 會捕獲錯誤，不會導致整個應用崩潰 */}
        <ErrorBoundary fallback={null}>
          <FutureRoom 
            onSit={handleSeatClick}
            wordData={wordCloudData}
            clonedScene={exhibitionScene}
          />
        </ErrorBoundary>

        {/* Wall Text - 展覽標題 */}
        <WallText />

        {/* Example Artworks for testing (you can remove these and mark your own artworks in the model) */}
        {/* <mesh position={[5, 2, 0]} userData={{ isArtwork: true, artworkData: { title: '示例藝術品 1', description: '這是一個測試用的藝術品。在您的模型中，任何名稱包含 "art"、"painting" 或 "artwork" 的物件都會自動被識別為藝術品。', artist: '測試藝術家', year: '2024' } }}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        
        <mesh position={[-5, 2, 0]} userData={{ isArtwork: true, artworkData: { title: '示例藝術品 2', description: '點擊藝術品可以查看詳情。您可以通過修改模型中的物件名稱或添加 userData 來標記藝術品。', artist: '另一位藝術家', year: '2023' } }}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="#654321" />
        </mesh> */}

        {/* Test Artifact 測試組件已移除 */}

        {/* Player Controller - 调整 Y 轴高度，第二个值是 Y 轴位置 */}
        {/* 例如：[0, 1.5, 0] 会让 Player 更低，[0, 3, 0] 会让 Player 更高 */}
        <Player 
          position={[35, 8, 60]} 
        />
      </Physics>
      
      {/* Post Processing - Bloom effect for glowing edges */}
      {/* 暂时注释掉，避免错误 */}
      {/* <EffectComposer multisampling={0}>
        <Bloom 
          intensity={1.5} 
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
        />
      </EffectComposer> */}
    </KeyboardControls>
  )
}
