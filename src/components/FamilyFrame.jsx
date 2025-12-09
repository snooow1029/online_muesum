import { useRef, useState } from 'react'
import { useTexture, Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function FamilyFrame({ 
  position = [0, 2, -5], 
  onOpen, 
  rotation = [0, 0, 0],
  size = { width: 8, height: 5 } // 照片本體大小
}) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const { gl } = useThree()
  
  // 1. 下載圖片
  const texture = useTexture('/images/family_portrait.jpg')

  // 2. 尺寸計算
  const matBorder = 0.8 // 留白邊框寬度 (Mat Board)
  const frameThick = 0.3 // 外框厚度
  
  const totalWidth = size.width + (matBorder * 2)
  const totalHeight = size.height + (matBorder * 2)

  // 3. Hover 動畫：改為「緩慢浮起」而非變色
  useFrame((state) => {
    if (groupRef.current) {
      // 懸停時，相框稍微往前浮一點點 (Z軸)，並稍微變大一點點，感覺比較優雅
      const targetZ = hovered ? position[2] - 0.5 : position[2]
      const targetScale = hovered ? 1.02 : 1.0
      
      // 平滑移動
      groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ, 0.1)
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    }
  })

  // 游標事件
  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    gl.domElement.style.cursor = 'pointer'
  }

  const handlePointerOut = (e) => {
    setHovered(false)
    gl.domElement.style.cursor = 'auto'
  }

  return (
    <group 
      ref={groupRef} 
      position={position} 
      rotation={rotation}
      onClick={(e) => { e.stopPropagation(); onOpen && onOpen() }}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* --- A. 外框 (深色木頭質感) --- */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[totalWidth + frameThick, totalHeight + frameThick, 0.2]} />
        <meshStandardMaterial 
          color="#3b2e2a" // 深胡桃木色
          roughness={0.8} // 粗糙一點，像木頭
          metalness={0.0} // 不要金屬感
        />
      </mesh>

      {/* --- B. 裱框紙板 (Mat Board) - 關鍵的藝術感來源 --- */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[totalWidth, totalHeight]} />
        <meshStandardMaterial 
          color="#fdfbf7" // 米白色紙張質感
          roughness={0.9} 
          metalness={0.0}
        />
      </mesh>

      {/* --- C. 照片本體 --- */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[size.width, size.height]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} /> 
          // 使用 BasicMaterial 讓照片不受光影影響變暗，或者用 StandardMaterial 但加強環境光
        ) : (
          <meshStandardMaterial color="#cccccc" />
        )}
      </mesh>

      {/* --- D. 玻璃反光 (選用，增加質感) --- */}
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[totalWidth, totalHeight]} />
        <meshPhysicalMaterial 
          roughness={0.0} 
          transmission={0.9} // 透光
          thickness={0.5} 
          color="white"
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* --- E. 實體說明牌 (Caption Card) --- */}
      <group position={[0, -(totalHeight / 2) - 1.2, 0]}>
        {/* 牌子底座 */}
        <mesh>
          <planeGeometry args={[5, 1.2]} />
          <meshStandardMaterial color="#f0f0f0" /> {/* 淺灰紙卡 */}
        </mesh>
        
        {/* 牌子上的字 */}
        <Text
          position={[0, 0, 0.01]} // 稍微浮出紙面
          fontSize={0.35}
          color="#333333" // 深灰字，不要純黑比較柔和
          anchorX="center"
          anchorY="middle"
          font="/fonts/GenMin.ttf" // 建議改用宋體/明體
          letterSpacing={0.05} // 字距稍微拉開比較有質感
        >
          點擊認識我們這一家
        </Text>
        
        {/* 如果 Hover，顯示一個細細的底線或提示 */}
        {hovered && (
          <mesh position={[0, -0.4, 0.02]}>
            <planeGeometry args={[4, 0.05]} />
            <meshBasicMaterial color="#ffaa00" />
          </mesh>
        )}
      </group>
    </group>
  )
}