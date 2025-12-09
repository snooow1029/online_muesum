import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { PositionalAudio } from '@react-three/drei'
import * as THREE from 'three'

// 定義 Shader (靜態部分)
const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float fresnelPower;
  uniform float opacity;
  uniform float emissiveIntensity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDirection = normalize(vViewPosition);
    float fresnel = pow(1.0 - dot(normal, viewDirection), fresnelPower);
    vec3 color = mix(color1, color2, fresnel);
    color *= emissiveIntensity;
    float alpha = fresnel * opacity;
    gl_FragColor = vec4(color, alpha);
  }
`

export default function TestArtifact({ position = [0, 3, 0], onInteract }) {
  const meshRef = useRef()
  const audioRef = useRef()
  const [isPlaying, setIsPlaying] = useState(false)

  // 1. 使用 useMemo 確保 Uniforms 記憶體穩定，避免 React 重新渲染時出錯
  const uniforms = useMemo(
    () => ({
      color1: { value: new THREE.Color('#4a90e2') },
      color2: { value: new THREE.Color('#00ffff') },
      fresnelPower: { value: 2.0 }, // 調整了一下參數讓邊緣更明顯
      opacity: { value: 1.0 },
      emissiveIntensity: { value: 4.0 } // 增強發光強度以配合 Bloom
    }),
    []
  )

  // 讓物體自轉
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
      meshRef.current.rotation.x += delta * 0.2
    }
  })

  const handleClick = (e) => {
    e.stopPropagation() // 防止點擊穿透到後面

    // 2. 觸發 UI
    if (onInteract) {
      onInteract({
        title: 'Artifact #001',
        description: 'Testing edge-glow shader and 3D positional audio.',
        type: 'artifact'
      })
    }

    // 3. 播放音效
    // 瀏覽器規定：必須使用者有互動過(點擊)才能播放聲音，所以放在 onClick 是對的
    if (audioRef.current) {
      // 如果正在播放，先停止
      if (audioRef.current.isPlaying) {
        audioRef.current.stop()
      }
      // 重新播放
      audioRef.current.play()
      setIsPlaying(true)
      
      // 監聽播放結束事件，重置狀態以便下次可以再次播放
      const handleEnded = () => {
        setIsPlaying(false)
        if (audioRef.current) {
          audioRef.current.removeEventListener('ended', handleEnded)
        }
      }
      audioRef.current.addEventListener('ended', handleEnded)
    }
  }

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* 使用 Icosahedron 幾何體，detail設為 0 看起來比較有科技感 */}
        <icosahedronGeometry args={[1, 0]} />
        
        {/* 將 Uniforms 傳入 */}
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={true}
          side={THREE.DoubleSide}
          depthWrite={false} //這對透明發光體很重要
          blending={THREE.AdditiveBlending} // 讓發光效果疊加更亮
        />
      </mesh>

      { <PositionalAudio
          ref={audioRef}
          url="/audio/intro.mp3"
          distance={5}
          loop={false}
      /> }
      
    </group>
  )
}