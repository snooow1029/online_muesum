import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { PointerLockControls } from '@react-three/drei'
import { useKeyboardControls } from '@react-three/drei'
import * as THREE from 'three'

const SPEED = 10 // move speed
// CapsuleCollider args: [radius, halfHeight]
// So total height = halfHeight * 2 = 0.5 * 2 = 1.0
// Camera should be at top of capsule = center + halfHeight + extra height
const HEAD_HEIGHT = 5 // Increased from 0.5 for higher viewpoint

export default function Player({ position = [0, 5, 0] }) {
  const rigidBodyRef = useRef()
  const controlsRef = useRef()
  const { camera, scene } = useThree()
  const [, get] = useKeyboardControls()
  const raycaster = useRef(new THREE.Raycaster())
  const maxDistance = 10 // Maximum interaction distance

  useEffect(() => {
    // Set initial camera position at head height
    camera.position.set(position[0], position[1] + HEAD_HEIGHT, position[2])
    camera.lookAt(position[0], position[1] + HEAD_HEIGHT, position[2] - 1)
  }, [camera, position])

  useFrame(() => {
    if (!rigidBodyRef.current) return

    // Get keyboard state - get() returns an object with all key states
    const keys = get()
    const forward = keys.forward
    const backward = keys.backward
    const left = keys.left
    const right = keys.right
    
    // Get camera forward direction (horizontal only)
    const forwardVector = new THREE.Vector3()
    camera.getWorldDirection(forwardVector)
    forwardVector.y = 0 // Remove vertical component
    forwardVector.normalize()

    // Calculate right vector using cross product
    const rightVector = new THREE.Vector3()
    rightVector.crossVectors(forwardVector, new THREE.Vector3(0, 1, 0))
    rightVector.normalize()

    // Build movement vector
    const moveVector = new THREE.Vector3()
    
    if (forward) moveVector.add(forwardVector)
    if (backward) moveVector.sub(forwardVector)
    if (right) moveVector.add(rightVector)
    if (left) moveVector.sub(rightVector)
    
    // Apply movement to rigid body
    const velocity = rigidBodyRef.current.linvel()
    
    if (moveVector.length() > 0.01) {
      moveVector.normalize()
      moveVector.multiplyScalar(SPEED)
      velocity.x = moveVector.x
      velocity.z = moveVector.z
    } else {
      // Apply damping when no keys pressed
      velocity.x *= 0.8
      velocity.z *= 0.8
    }
    
    // Keep Y velocity from physics (gravity)
    rigidBodyRef.current.setLinvel(velocity)

    // Update camera position to follow player (at head height)
    const playerPosition = rigidBodyRef.current.translation()
    camera.position.set(
      playerPosition.x,
      playerPosition.y + HEAD_HEIGHT,
      playerPosition.z
    )

    // Raycasting for artwork interaction
    // Cast ray from camera center forward
    raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera)
    const intersects = raycaster.current.intersectObjects(scene.children, true)

    // Check if we're looking at an artwork
    let foundArtwork = null
    for (const intersect of intersects) {
      if (intersect.distance > maxDistance) break
      
      const object = intersect.object
      // Check for artwork by name prefix or userData
      const isArtwork = 
        object.name.toLowerCase().includes('art') ||
        object.name.toLowerCase().includes('painting') ||
        object.name.toLowerCase().includes('artwork') ||
        object.userData.isArtwork === true ||
        (object.parent && (
          object.parent.name.toLowerCase().includes('art') ||
          object.parent.userData.isArtwork === true
        ))

      if (isArtwork) {
        // Get artwork info from userData or parent
        const artworkData = object.userData.artworkData || 
                           (object.parent && object.parent.userData.artworkData) ||
                           {
                             title: object.name || object.parent?.name || '藝術品',
                             description: object.userData.description || '這是一件美麗的藝術品。',
                             artist: object.userData.artist,
                             year: object.userData.year
                           }
        
        foundArtwork = artworkData
        break
      }
    }

    // Update global state for UI
    if (window.setIsLookingAtArtwork) {
      window.setIsLookingAtArtwork(!!foundArtwork)
    }
    if (window.setSelectedArtwork) {
      window.setSelectedArtwork(foundArtwork)
    }
  })

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <RigidBody
        ref={rigidBodyRef}
        position={position}
        type="dynamic"
        colliders={false}
        enabledRotations={[false, false, false]}
        lockRotations
        linearDamping={0.1}
        canSleep={false}
      >
        <CapsuleCollider args={[0.5, 0.5]} />
      </RigidBody>
    </>
  )
}
