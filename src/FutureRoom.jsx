import { useEffect, useState, useRef } from 'react'
import { Text, Stars, Sparkles, Cloud } from '@react-three/drei'
import * as THREE from 'three'
import DomeWordCloud from './WordCloud' // 引入文字雲組件

export default function FutureRoom({ onSit, wordData = [], clonedScene }) {
  // 使用 GalleryModel 傳遞過來的克隆場景（如果有的話）
  // 這樣可以確保修改的是實際渲染的場景
  // 移除了視頻相關代碼，改用純黑背景和 Stars 組件
  
  // 用來定位穹頂中心的 Ref
  const domeCenterRef = useRef(new THREE.Vector3(0, 0, 0))
  const domeRadiusRef = useRef(6) // 穹頂半徑，用於限制星星範圍
  const [domeReady, setDomeReady] = useState(false)
  
  // 手動調整位置偏移（用於測試）
  // 可以修改這些值來調整星空和文字雲的位置
  const positionOffset = {
    x: 0,  // 左右偏移
    y: 0,  // 上下偏移
    z: -8   // 前後偏移
  }

  // 單獨調整 Stars 的位置偏移（相對於 group 的位置）
  const starsOffset = {
    x: 0,  // 左右偏移
    y: 0,  // 上下偏移
    z: -20   // 前後偏移
  }

  useEffect(() => {
    if (!clonedScene) {
      console.log('FutureRoom: clonedScene not ready yet')
      return
    }
    
    console.log('FutureRoom: Processing clonedScene for dome and word cloud')
    
    // 先遍歷一次，找出所有可能的穹頂對象（用於調試）
    const possibleDomes = []
    const allMeshesWithDomeScreen = []
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        // 處理材質可能是數組的情況
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        const firstMaterial = materials[0]
        const materialName = firstMaterial?.name || 'no material name'
        const objectName = child.name || 'unnamed'
        
        // 記錄所有有 DomeScreen 材質的 mesh
        if (materialName === 'DomeScreen') {
          allMeshesWithDomeScreen.push({
            name: objectName,
            materialName: materialName,
            position: child.position,
            worldPosition: new THREE.Vector3().setFromMatrixPosition(child.matrixWorld),
            materialType: firstMaterial?.type || 'unknown'
          })
        }
        
        // 檢查是否可能是穹頂（名稱包含 dome、圓頂、或材質名稱相關）
        if (materialName.toLowerCase().includes('dome') || 
            materialName.toLowerCase().includes('screen') ||
            objectName.toLowerCase().includes('dome') ||
            objectName.toLowerCase().includes('圓頂')) {
          possibleDomes.push({
            name: objectName,
            materialName: materialName,
            position: child.position,
            worldPosition: new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
          })
        }
      }
    })
    
    if (allMeshesWithDomeScreen.length > 0) {
      console.log('FutureRoom: ✅ Found meshes with DomeScreen material:', allMeshesWithDomeScreen)
    }
    
    if (possibleDomes.length > 0) {
      console.log('FutureRoom: Found possible dome objects:', possibleDomes)
    } else {
      console.log('FutureRoom: No dome objects found by name/material search')
    }
    
    // 遍歷克隆場景，處理 final room 相關的對象
    // 1. 找到穹頂並設置視頻材質（如果視頻存在）
    // 2. 定位穹頂中心用於文字雲
    let domeFound = false
    clonedScene.traverse((child) => {
      // --- 處理穹頂 ---
      if (!child.isMesh || !child.material) return
      
      // 處理材質可能是數組的情況
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      const firstMaterial = materials[0]
      if (!firstMaterial) return
      
      const materialName = firstMaterial.name || ''
      const objectName = child.name || ''
      
      // 檢查是否是穹頂：
      // 1. 對象名稱是 'DomeScreen'
      // 2. 或材質名稱是 'DomeScreen'
      // 3. 或材質名稱包含 'Screen' 且對象名稱包含 'final'（final room 的穹頂）
      const isDome = 
        objectName === 'DomeScreen' ||
        materialName === 'DomeScreen' ||
        (materialName.toLowerCase().includes('screen') && objectName.toLowerCase().includes('final'))
      
      if (isDome && !domeFound) {
        domeFound = true
        console.log('FutureRoom: ✅ Found DomeScreen mesh!', {
          name: objectName,
          materialName: materialName,
          position: child.position,
          worldPosition: new THREE.Vector3().setFromMatrixPosition(child.matrixWorld)
        })
        
        // 抓取穹頂的世界座標中心，讓文字雲可以對齊（先設置 domeReady）
        const box = new THREE.Box3().setFromObject(child)
        const localCenter = new THREE.Vector3()
        box.getCenter(localCenter)
        
        // 計算穹頂的半徑（使用邊界框的最大尺寸）
        const size = box.getSize(new THREE.Vector3())
        const domeRadius = Math.max(size.x, size.y, size.z) / 2
        // 根據實際測量的半徑調整：24.94 -> 使用 0.8 倍數確保在內部
        domeRadiusRef.current = domeRadius * 0.8 // 稍微小一點，確保在穹頂內部
        console.log('FutureRoom: Calculated dome radius:', domeRadius, 'Adjusted stars radius:', domeRadiusRef.current)
        
        // 獲取世界位置（考慮父級變換）
        const worldPos = new THREE.Vector3()
        child.getWorldPosition(worldPos)
        
        // 使用世界位置作為文字雲的中心點
        domeCenterRef.current.copy(worldPos)
        
        console.log('FutureRoom: Dome center (local):', localCenter)
        console.log('FutureRoom: Dome world position:', worldPos)
        console.log('FutureRoom: Dome radius:', domeRadius, 'Stars radius:', domeRadiusRef.current)
        console.log('FutureRoom: Word cloud will be positioned at:', domeCenterRef.current)
        setDomeReady(true)
        
        // 使用半透明的黑色材質作為背景，讓星星和文字雲可以透過顯示
        console.log('FutureRoom: Applying semi-transparent black material to dome')
        const newMaterial = new THREE.MeshBasicMaterial({
          color: 0x000000, // 純黑色
          side: THREE.FrontSide, // 從內部觀看，使用 BackSide 確保從內部可以看到
          transparent: true, // 啟用透明
          opacity: 0.7 // 30% 透明度，讓星星和文字雲可以透過顯示
        })
        child.material = newMaterial
        
        // 標記這個穹頂已經被 FutureRoom 處理
        child.userData.isFutureRoomDome = true
        
        console.log('FutureRoom: Black material applied successfully')
      }
    })
    
    if (!domeFound) {
      console.warn('FutureRoom: ⚠️ No dome found. Word cloud will not be displayed.')
      console.log('FutureRoom: Please check if the dome material name is "DomeScreen" or contains "dome"')
    }
  }, [clonedScene])

  // 注意：由於場景已經被 GalleryModel 渲染，這裡不需要再次渲染場景
  // 我們只需要：
  // 1. 處理穹頂的純黑材質（已在 useEffect 中完成）
  // 2. 渲染星空和文字雲
  // 3. 懶骨頭的點擊事件會由 GalleryModel 處理，但我們可以通過 userData.isFutureRoomSeat 來識別

  console.log('FutureRoom render:', { 
    domeReady, 
    wordDataLength: wordData.length, 
    domeCenter: domeCenterRef.current,
    wordData: wordData
  })

  return (
    <>
      {/* 當穹頂位置確定後，渲染星空和文字雲 */}
      {domeReady ? (
        <group position={[
          domeCenterRef.current.x + positionOffset.x,
          domeCenterRef.current.y + positionOffset.y,
          domeCenterRef.current.z + positionOffset.z
        ]}>
          {/* 1. 深邃星空 */}
          <group position={[starsOffset.x, starsOffset.y, starsOffset.z]}>
            <Stars 
              radius={domeRadiusRef.current} 
              depth={domeRadiusRef.current * 0.5} 
              count={Math.min(Math.floor(domeRadiusRef.current * 150), 500)} 
              factor={4} 
              saturation={0} 
              fade 
              speed={1} 
            />
          </group>
          
          {/* 2. 流動的粒子 (營造銀河感) - 橘色系 */}
          <Sparkles 
            count={50} 
            scale={domeRadiusRef.current * 0.9} 
            size={4} 
            speed={1} 
            opacity={0.5} 
            color="#ffaa00" 
          />
          
          {/* 3. 淡淡的雲霧 (增加體積感) */}
          {/* <Cloud 
            opacity={0.3} 
            speed={0.2} // 流動速度
            width={domeRadiusRef.current * 0.4} 
            depth={domeRadiusRef.current * 0.06} 
            segments={20} 
            position={[0, domeRadiusRef.current * 0.2, 0]}
            color="#1a1a1a" // 深灰色雲，襯托文字
          /> */}
          
          {/* 4. 文字雲 */}
          {wordData.length > 0 ? (
            <DomeWordCloud words={wordData} radius={domeRadiusRef.current * 0.85} />
          ) : (
            // 調試：即使沒有數據也顯示一個標記，確認位置正確
            <group>
              <Text 
                position={[0, 0, 0]} 
                fontSize={0.5} 
                color="#ffaa00"
                font="/fonts/GenYoMin.ttf"
              >
                等待文字雲數據...
              </Text>
              <Text 
                position={[0, -1, 0]} 
                fontSize={0.3} 
                color="#cccccc"
                font="/fonts/GenYoMin.ttf"
              >
                請在手機輸入界面提交問題和解決方案
              </Text>
            </group>
          )}
        </group>
      ) : (
        <group>
          {/* 調試：顯示文字雲未準備好的原因 */}
          {!clonedScene && <Text position={[0, 5, 0]} fontSize={0.5} color="red">FutureRoom: clonedScene not ready</Text>}
          {clonedScene && !domeReady && <Text position={[0, 5, 0]} fontSize={0.5} color="orange">FutureRoom: Dome not found</Text>}
        </group>
      )}
    </>
  )
}