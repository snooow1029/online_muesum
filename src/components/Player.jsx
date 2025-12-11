import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

const SPEED = 20  // 增加移动速度（原来是 10）
const HEAD_HEIGHT = 6

export default function Player({ position = [0, 5, 0], isSitting = false, seatPosition = null }) {
  const rigidBodyRef = useRef()
  const { camera, scene, gl } = useThree()
  const [, get] = useKeyboardControls()
  
  // 保存站起前的 Y 轴高度
  const standingYRef = useRef(null)
  
  // 優化 1: 建立 Raycaster 變數，不需要每次都在 frame 裡宣告
  const raycaster = useRef(new THREE.Raycaster())
  const maxDistance = 10 
  
  // 優化 2: 用來控制 Raycaster 頻率的計時器
  const raycastTimer = useRef(0) 
  
  // Mouse control refs
  const isMouseDown = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const rotationDelta = useRef({ x: 0, y: 0 })
  const mouseControlEnabled = useRef(true) // 控制是否啟用滑鼠控制
  const PI_2 = Math.PI / 2

  // 新增一個 Ref 來記錄是否剛載入
  const isInitialized = useRef(false)

  useEffect(() => {

    if (!isInitialized.current) {
      // 設定初始位置
      camera.position.set(position[0], position[1] + HEAD_HEIGHT, position[2])
      
      // 設定初始視角 (朝向 Z 軸負方向)
      euler.current.set(0, Math.PI / 2, 0, 'YZX')
      camera.quaternion.setFromEuler(euler.current)
      
      // 標記為已初始化，之後任何 re-render 都不會再進來這裡
      isInitialized.current = true
    } else {
      euler.current.setFromQuaternion(camera.quaternion)
    }
    
    // 以下事件監聽邏輯保持不變 ---
    const handleMouseMove = (event) => {
      if (!isMouseDown.current || !mouseControlEnabled.current) return
      event.preventDefault()
      
      const deltaX = event.clientX - lastMousePos.current.x
      const deltaY = event.clientY - lastMousePos.current.y
      
      rotationDelta.current.x += deltaX
      rotationDelta.current.y += deltaY
      
      lastMousePos.current = { x: event.clientX, y: event.clientY }
    }
    
    const handleMouseDown = (event) => {
      if (event.button === 0 && mouseControlEnabled.current) { 
        event.preventDefault()
        isMouseDown.current = true
        lastMousePos.current = { x: event.clientX, y: event.clientY }
        // 這裡也不要再 reset euler 了
        rotationDelta.current.x = 0
        rotationDelta.current.y = 0
        gl.domElement.style.cursor = 'grabbing'
      }
    }
    
    const handleMouseUp = () => {
      isMouseDown.current = false
      if (mouseControlEnabled.current) {
        gl.domElement.style.cursor = 'grab'
      } else {
        gl.domElement.style.cursor = 'default'
      }
    }
    
    // ESC 鍵處理
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        mouseControlEnabled.current = false
        isMouseDown.current = false
        gl.domElement.style.cursor = 'default'
      }
    }
    
    window.disableMouseControl = () => {
      mouseControlEnabled.current = false
      isMouseDown.current = false
      gl.domElement.style.cursor = 'default'
    }
    
    window.enableMouseControl = () => {
      mouseControlEnabled.current = true
      euler.current.setFromQuaternion(camera.quaternion)
      gl.domElement.style.cursor = 'grab'
    }
    
    gl.domElement.addEventListener('mousemove', handleMouseMove)
    gl.domElement.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp) 
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      gl.domElement.removeEventListener('mousemove', handleMouseMove)
      gl.domElement.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      if (window.disableMouseControl) delete window.disableMouseControl
      if (window.enableMouseControl) delete window.enableMouseControl
    }
  }, [camera, gl]) // 

  useFrame((state, delta) => {
    if (!rigidBodyRef.current) return

    // --- 0. 坐下狀態處理 ---
    if (isSitting && seatPosition) {
      // 如果是剛坐下，保存當前的 Y 軸高度
      if (standingYRef.current === null) {
        const currentPos = rigidBodyRef.current.translation()
        standingYRef.current = currentPos.y
        console.log('Saved standing Y position:', standingYRef.current)
      }
      
      // 禁用移動
      const velocity = rigidBodyRef.current.linvel()
      velocity.x = 0
      velocity.y = 0
      velocity.z = 0
      rigidBodyRef.current.setLinvel(velocity)
      
      // 將 seatPosition 轉換為 THREE.Vector3（如果它是數組）
      const seatPos = seatPosition instanceof THREE.Vector3 
        ? seatPosition 
        : new THREE.Vector3(seatPosition[0] || seatPosition.x, seatPosition[1] || seatPosition.y, seatPosition[2] || seatPosition.z)
      
      // 將玩家位置設置到座位位置（只改變 Y 軸高度，保持 X 和 Z 不變）
      // 保持玩家當前的 X 和 Z 位置，只改變 Y 軸高度
      const currentPos = rigidBodyRef.current.translation()
      const newSeatPos = new THREE.Vector3(
        currentPos.x, // 保持 X 不變
        seatPos.y,    // 使用座位的 Y 高度
        currentPos.z  // 保持 Z 不變
      )
      rigidBodyRef.current.setTranslation(newSeatPos, true)
      
      // 將相機平滑移動到新位置上方（保持當前視角）
      const targetCameraPos = new THREE.Vector3(
        camera.position.x, // 保持 X 不變
        newSeatPos.y + HEAD_HEIGHT, // 只改變 Y 高度
        camera.position.z  // 保持 Z 不變
      )
      // 使用更快的插值速度，讓位置切換更明顯
      camera.position.lerp(targetCameraPos, 0.3)
      
      // 不改變視角，保持當前的相機朝向
      // euler 和 camera.quaternion 保持不變
      
      // 禁用滑鼠控制
      if (mouseControlEnabled.current) {
        mouseControlEnabled.current = false
        gl.domElement.style.cursor = 'default'
        console.log('Mouse control disabled (sitting)')
      }
      
      return // 坐下時不執行其他邏輯
    }
    
    // 如果不在坐下狀態，恢復 Y 軸高度並確保滑鼠控制已啟用
    if (!isSitting) {
      // 如果之前保存了站起時的 Y 軸高度，恢復它
      if (standingYRef.current !== null) {
        const currentPos = rigidBodyRef.current.translation()
        const restoredPos = new THREE.Vector3(
          currentPos.x, // 保持 X 不變
          standingYRef.current, // 恢復站起時的 Y 高度
          currentPos.z  // 保持 Z 不變
        )
        rigidBodyRef.current.setTranslation(restoredPos, true)
        
        // 恢復相機的 Y 高度
        const targetCameraPos = new THREE.Vector3(
          camera.position.x,
          restoredPos.y + HEAD_HEIGHT,
          camera.position.z
        )
        camera.position.lerp(targetCameraPos, 0.3)
        
        console.log('Restored standing Y position:', standingYRef.current)
        standingYRef.current = null // 清除保存的高度
      }
      
      // 確保滑鼠控制已啟用
      if (!mouseControlEnabled.current) {
        mouseControlEnabled.current = true
        gl.domElement.style.cursor = 'grab'
        console.log('Mouse control re-enabled (standing)')
      }
    }

    // --- 1. 相機旋轉邏輯 ---
    // 只有在滑鼠控制啟用時才應用旋轉
    if (mouseControlEnabled.current && (Math.abs(rotationDelta.current.x) > 0 || Math.abs(rotationDelta.current.y) > 0)) {
      // 靈敏度係數，可根據需求微調
      const sensitivity = 0.002 
      euler.current.y -= rotationDelta.current.x * sensitivity
      euler.current.x -= rotationDelta.current.y * sensitivity
      euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x))
      
      camera.quaternion.setFromEuler(euler.current)
      
      // 重置 Delta，避免累積
      rotationDelta.current.x = 0
      rotationDelta.current.y = 0
    }

    // --- 2. 玩家移動邏輯 ---
    // 坐下時不允許移動
    if (isSitting) return
    
    const keys = get()
    // 獲取相機的水平方向（不包含 Y 軸傾斜）
    const forwardVector = new THREE.Vector3()
    camera.getWorldDirection(forwardVector)
    forwardVector.y = 0 
    forwardVector.normalize()

    const rightVector = new THREE.Vector3()
    rightVector.crossVectors(forwardVector, new THREE.Vector3(0, 1, 0))
    rightVector.normalize()

    const moveVector = new THREE.Vector3()
    if (keys.forward) moveVector.add(forwardVector)
    if (keys.backward) moveVector.sub(forwardVector)
    if (keys.right) moveVector.add(rightVector)
    if (keys.left) moveVector.sub(rightVector)
    
    const velocity = rigidBodyRef.current.linvel()
    
    if (moveVector.length() > 0.01) {
      moveVector.normalize()
      moveVector.multiplyScalar(SPEED)
      velocity.x = moveVector.x
      velocity.z = moveVector.z
    } else {
      // 增加阻尼感，讓停止更自然
      velocity.x *= 0.9
      velocity.z *= 0.9
    }
    
    rigidBodyRef.current.setLinvel(velocity)

    // --- 3. 相機跟隨邏輯 (解決抖動的關鍵) ---
    const playerPosition = rigidBodyRef.current.translation()
    const targetCameraPos = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + HEAD_HEIGHT,
      playerPosition.z
    )
    
    // 🔥 使用 lerp (線性插值) 來平滑移動相機，而不是直接 set
    // 0.2 是一個平滑係數，值越大越硬，越小越軟(會有延遲感)
    camera.position.lerp(targetCameraPos, 0.25) 


    // --- 4. 互動檢測邏輯 (效能優化版) ---
    // 累加時間
    raycastTimer.current += delta
    
    // 只有當累積時間超過 0.1秒 (100ms) 才執行一次檢測
    if (raycastTimer.current > 0.1) {
      raycastTimer.current = 0 // 重置計時器

      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
      
      // 優化建議：如果可以，只檢測特定的 Layer 或 Group，不要檢測 scene.children
      // 這裡暫時保持 scene.children 但加上了時間節流
      const intersects = raycaster.current.intersectObjects(scene.children, true)

      let foundArtwork = null
      for (const intersect of intersects) {
        if (intersect.distance > maxDistance) break
        
        const object = intersect.object
        
        // 檢查邏輯：排除畫框（frame），只檢測真正的藝術品
        const objectName = object.name.toLowerCase()
        const parentName = object.parent?.name?.toLowerCase() || ''
        const isArtwork = 
          (objectName.includes('art') && !objectName.includes('frame')) ||
          objectName.includes('painting') ||
          objectName.includes('artwork') ||
          object.userData.isArtwork === true ||
          (object.parent && (
            (parentName.includes('art') && !parentName.includes('frame')) ||
            parentName.includes('painting') ||
            parentName.includes('artwork') ||
            object.parent.userData.isArtwork === true
          ))

        if (isArtwork) {
          // 只使用有 artworkData 的物件，避免顯示默認的 "Artifact"
          foundArtwork = object.userData.artworkData || 
                         (object.parent && object.parent.userData.artworkData)
          // 如果沒有 artworkData，不設置 foundArtwork（避免顯示默認值）
          break
        }
      }

      // 更新全域狀態
      if (window.setIsLookingAtArtwork) {
        window.setIsLookingAtArtwork(!!foundArtwork)
      }
      
      // 更新 selectedArtwork
      // 如果對話框已打開，不要清除 selectedArtwork（保持對話框內容）
      // 如果對話框未打開，只有在找到藝術品時才更新
      const isModalOpen = window.getShowModal && window.getShowModal()
      if (window.setSelectedArtwork) {
        if (foundArtwork) {
          // 找到藝術品時，更新 selectedArtwork
          window.setSelectedArtwork(foundArtwork)
        } else if (!isModalOpen) {
          // 沒找到藝術品且對話框未打開時，清除 selectedArtwork
          window.setSelectedArtwork(null)
        }
        // 如果對話框已打開但沒找到藝術品，保持 selectedArtwork 不變
      }
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, false, false]}
      lockRotations
      linearDamping={0.5} // 增加一點阻尼讓移動更穩
      canSleep={false}
    >
      <CapsuleCollider args={[0.5, 0.5]} />
    </RigidBody>
  )
}