import { useGLTF, Environment, KeyboardControls } from '@react-three/drei'
import { Physics, RigidBody } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'
import Player from './Player'

function GalleryModel() {
  const { scene } = useGLTF('/models/gallery.glb')

  // Clone the scene and enable shadows on all meshes
  const { clonedScene, position } = useMemo(() => {
    const cloned = scene.clone()
    
    // Calculate bounding box to understand model size and position
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    // Scale down the model (adjust scale factor as needed)
    const scaleFactor = 0.05 // Scale down to 10% of original size
    cloned.scale.set(scaleFactor, scaleFactor, scaleFactor)
    
    // Recalculate bounding box after scaling
    const scaledBox = new THREE.Box3().setFromObject(cloned)
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3())
    const scaledSize = scaledBox.getSize(new THREE.Vector3())
    
    // Calculate position to center the model horizontally (X and Z axes)
    // Y axis: place model bottom on grid (y=0)
    const positionX = -scaledCenter.x
    const positionY = -scaledBox.min.y  // Bottom aligns with grid
    const positionZ = -scaledCenter.z
    
    // Enable shadows on all meshes and mark artworks
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        // Check if this mesh is an artwork by name patterns
        const name = child.name.toLowerCase()
        const parentName = child.parent?.name?.toLowerCase() || ''
        
        if (name.includes('art') || 
            name.includes('painting') || 
            name.includes('artwork') ||
            name.includes('frame') ||
            parentName.includes('art') ||
            parentName.includes('painting')) {
          // Mark as artwork
          child.userData.isArtwork = true
          
          // Add artwork data (you can customize this based on your model)
          if (!child.userData.artworkData) {
            child.userData.artworkData = {
              title: child.name || child.parent?.name || '藝術品',
              description: '這是一件美麗的藝術品，歡迎欣賞。',
              artist: '未知藝術家',
              year: '未知年份'
            }
          }
          
          // Also mark parent if exists
          if (child.parent) {
            child.parent.userData.isArtwork = true
            if (!child.parent.userData.artworkData) {
              child.parent.userData.artworkData = child.userData.artworkData
            }
          }
        }
        
      }
    })
    
    return {
      clonedScene: cloned,
      position: [positionX, positionY, positionZ]
    }
  }, [scene])

  return (
    <>
      {/* Render model without collision first to test */}
      <primitive object={clonedScene} position={position} />
      
      {/* Add collision only for floor/walls - using a simpler approach */}
      {/* We'll add collision back selectively if needed */}
    </>
  )
}

useGLTF.preload('/models/gallery.glb')

export default function Experience() {
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['w', 'W', 'ArrowUp'] },
        { name: 'backward', keys: ['s', 'S', 'ArrowDown'] },
        { name: 'left', keys: ['a', 'A', 'ArrowLeft'] },
        { name: 'right', keys: ['d', 'D', 'ArrowRight'] },
      ]}
    >
      <Physics gravity={[0, -9.81, 0]}>
        {/* Basic Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Environment for better lighting and reflections */}
        <Environment preset="sunset" />

        {/* Grid helper for development - always visible */}
        <gridHelper args={[240, 240]} position={[0, 0, 0]} />

        {/* Ground plane for physics */}
        <RigidBody type="fixed" position={[0, 0, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[240, 240]} />
            <meshStandardMaterial color="#888888" transparent opacity={0} />
          </mesh>
        </RigidBody>

        {/* Gallery Model with physics colliders */}
        <GalleryModel />

        {/* Example Artworks for testing (you can remove these and mark your own artworks in the model) */}
        <mesh position={[5, 2, 0]} userData={{ isArtwork: true, artworkData: { title: '示例藝術品 1', description: '這是一個測試用的藝術品。在您的模型中，任何名稱包含 "art"、"painting" 或 "artwork" 的物件都會自動被識別為藝術品。', artist: '測試藝術家', year: '2024' } }}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        
        <mesh position={[-5, 2, 0]} userData={{ isArtwork: true, artworkData: { title: '示例藝術品 2', description: '點擊藝術品可以查看詳情。您可以通過修改模型中的物件名稱或添加 userData 來標記藝術品。', artist: '另一位藝術家', year: '2023' } }}>
          <boxGeometry args={[1, 1.5, 0.1]} />
          <meshStandardMaterial color="#654321" />
        </mesh>

        {/* Player Controller - start higher to avoid collision issues */}
        <Player position={[0, 10, 0]} />
      </Physics>
    </KeyboardControls>
  )
}
