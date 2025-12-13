import { useState, useEffect, useRef } from 'react'
import './MobileControls.css'

// 全局移动状态，供 Player 组件读取
window.mobileMoveState = {
  forward: false,
  backward: false,
  left: false,
  right: false
}

export default function MobileControls() {
  const [isVisible, setIsVisible] = useState(false)
  const joystickRef = useRef(null)
  const joystickKnobRef = useRef(null)
  const isDragging = useRef(false)
  const currentPos = useRef({ x: 0, y: 0 })
  const joystickCenter = useRef({ x: 0, y: 0 })
  const joystickRadius = 60 // 摇杆半径

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      // 检查是否有强制启用移动模式的标志（用于测试）
      const forceMobile = window.location.search.includes('mobile=true') || 
                         localStorage.getItem('forceMobileControls') === 'true'
      
      if (forceMobile) {
        setIsVisible(true)
        return
      }
      
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       (window.innerWidth <= 768 && 'ontouchstart' in window)
      setIsVisible(isMobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // 监听键盘快捷键：按 M 键切换移动控制显示（用于测试）
    const handleKeyPress = (e) => {
      if (e.key === 'm' || e.key === 'M') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const current = localStorage.getItem('forceMobileControls') === 'true'
          localStorage.setItem('forceMobileControls', (!current).toString())
          setIsVisible(!current)
          console.log(`移动控制已${!current ? '启用' : '禁用'}`)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  // 初始化摇杆位置
  useEffect(() => {
    if (joystickRef.current && joystickKnobRef.current) {
      const rect = joystickRef.current.getBoundingClientRect()
      joystickCenter.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    }
  }, [isVisible])

  // 使用 useEffect 手动添加触摸事件监听器，设置 passive: false
  useEffect(() => {
    if (!isVisible || !joystickRef.current) return

    const handleTouchStart = (e) => {
      e.preventDefault()
      isDragging.current = true
      if (joystickRef.current) {
        const rect = joystickRef.current.getBoundingClientRect()
        joystickCenter.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        }
      }
    }

    const handleTouchMove = (e) => {
      if (!isDragging.current) return
      e.preventDefault()
      
      const touch = e.touches[0]
      if (!touch) return
      
      const deltaX = touch.clientX - joystickCenter.current.x
      const deltaY = touch.clientY - joystickCenter.current.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // 限制在摇杆范围内
      const angle = Math.atan2(deltaY, deltaX)
      const clampedDistance = Math.min(distance, joystickRadius)
      
      currentPos.current = {
        x: Math.cos(angle) * clampedDistance,
        y: Math.sin(angle) * clampedDistance
      }
      
      // 更新摇杆位置
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(${currentPos.current.x}px, ${currentPos.current.y}px)`
      }
      
      // 计算方向并设置移动状态
      const normalizedX = currentPos.current.x / joystickRadius
      const normalizedY = currentPos.current.y / joystickRadius
      
      // 更新全局移动状态（供 Player 组件读取）
      if (window.mobileMoveState) {
        window.mobileMoveState.forward = normalizedY < -0.3
        window.mobileMoveState.backward = normalizedY > 0.3
        window.mobileMoveState.left = normalizedX < -0.3
        window.mobileMoveState.right = normalizedX > 0.3
      }
    }

    const handleTouchEnd = (e) => {
      e.preventDefault()
      isDragging.current = false
      
      // 重置摇杆位置
      currentPos.current = { x: 0, y: 0 }
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = 'translate(0, 0)'
      }
      
      // 重置所有移动状态
      if (window.mobileMoveState) {
        window.mobileMoveState.forward = false
        window.mobileMoveState.backward = false
        window.mobileMoveState.left = false
        window.mobileMoveState.right = false
      }
    }

    const handleTouchCancel = (e) => {
      e.preventDefault()
      isDragging.current = false
      currentPos.current = { x: 0, y: 0 }
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = 'translate(0, 0)'
      }
      if (window.mobileMoveState) {
        window.mobileMoveState.forward = false
        window.mobileMoveState.backward = false
        window.mobileMoveState.left = false
        window.mobileMoveState.right = false
      }
    }

    const element = joystickRef.current
    
    // 手动添加事件监听器，设置 passive: false 以允许 preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [isVisible, joystickRadius])

  if (!isVisible) return null

  return (
    <div className="mobile-controls">
      {/* 左侧摇杆 */}
      <div 
        className="joystick-container"
        ref={joystickRef}
      >
        <div className="joystick-base"></div>
        <div className="joystick-knob" ref={joystickKnobRef}></div>
      </div>
      
      {/* 操作提示 */}
      <div className="mobile-instructions">
        <p>拖動左側搖桿移動</p>
        <p>拖動右側旋轉視角</p>
      </div>
    </div>
  )
}

