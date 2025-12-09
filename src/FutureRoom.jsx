import { useEffect } from 'react'

import { useGLTF, useVideoTexture } from '@react-three/drei'

import * as THREE from 'three'

import { RigidBody } from '@react-three/rapier'

export default function FutureRoom({ onSit }) {

  // 1. 載入模型

  const { scene } = useGLTF('/models/final_room.glb')

  

  // 2. 載入穹頂影片

  // 記得把你的影片放在 public/video/dome_video.mp4

  const videoTexture = useVideoTexture('/video/dome_video.mp4')

  videoTexture.flipY = false // GLB 模型貼圖通常需要翻轉，影片有時不用，視情況調整

  useEffect(() => {

    // 3. 遍歷模型，尋找我們在 Blender 命名的物件

    scene.traverse((child) => {

      

      // --- 處理穹頂 ---

      // 記得我們在 Blender 把材質命名為 "DomeScreen" 嗎？

      if (child.isMesh && child.material.name === 'DomeScreen') {

        child.material = new THREE.MeshBasicMaterial({

          map: videoTexture,

          side: THREE.BackSide, // 關鍵：因為我們在球裡面，要渲染背面

          toneMapped: false,    // 讓影片顏色不被光照影響，保持明亮

        })

      }

      // --- 處理懶骨頭 ---

      // 假設你在 Blender 匯入的懶骨頭物件名稱包含 "BeanBag"

      if (child.name.toLowerCase().includes('bean')) {

        // 這裡我們只是標記它，具體點擊邏輯在下方

        child.userData.isSeat = true

      }

      

      // 開啟陰影

      if (child.isMesh) {

        child.castShadow = true

        child.receiveShadow = true

      }

    })

  }, [scene, videoTexture])

  const handleClick = (e) => {

    e.stopPropagation()

    // 檢查點到的是不是懶骨頭 (或懶骨頭的子物件)

    const object = e.object

    const isSeat = object.userData.isSeat || object.parent?.userData.isSeat

    

    if (isSeat) {

      // 取得懶骨頭的位置

      const seatPosition = new THREE.Vector3()

      object.getWorldPosition(seatPosition)

      

      // 呼叫坐下函式 (傳給外層 App 處理)

      if (onSit) {

        onSit(seatPosition)

      }

    }

  }

  return (

    // 使用 Trimesh 碰撞體，這樣才能走進圓形的房間

    <RigidBody type="fixed" colliders="trimesh">

      <primitive object={scene} onClick={handleClick} />

    </RigidBody>

  )

}

