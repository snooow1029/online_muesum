import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <group>
            {/* 在 3D 場景中顯示錯誤提示 */}
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[2, 0.5, 0.1]} />
              <meshBasicMaterial color="red" />
            </mesh>
          </group>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

