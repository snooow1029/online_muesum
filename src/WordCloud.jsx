import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'

// 輔助函式：計算球體軌道位置
function getPositionFromSpherical(radius, theta, phi) {
  const x = radius * Math.sin(phi) * Math.sin(theta)
  const z = radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

// 獨立的漂浮文字元件
function FloatingText({ text, type, radius, speed, index, total }) {
    const groupRef = useRef()
    const textRef = useRef()
    
    // 性能優化：緩存材質引用，避免每幀遍歷
    const materialRefs = useRef([])
    const lastOpacityRef = useRef(-1) // 記錄上次的透明度，只在變化時更新
    
    // 初始化位置 - 使用均勻分佈
    const { initialTheta, phi } = useMemo(() => {
      // 1. 均勻分佈角度
      const segmentAngle = (Math.PI * 2) / total
      const baseAngle = index * segmentAngle
      const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.4
      
      return {
        initialTheta: baseAngle + randomOffset,
        phi: 1.0 + Math.random() * 0.5, 
      }
    }, [index, total])
  
    // 用來控制流動
    const currentTheta = useRef(initialTheta)
    
    // 初始化時收集材質引用（只執行一次）
    useEffect(() => {
      if (textRef.current) {
        const materials = []
        textRef.current.traverse((child) => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material]
            materials.push(...mats.filter(m => m))
          }
        })
        materialRefs.current = materials
      }
    }, [])
  
    useFrame((state, delta) => {
      if (groupRef.current && textRef.current) {
        // --- 1. 物理運動 (保持不變) ---
        currentTheta.current += speed * delta * 0.05
        const newPos = getPositionFromSpherical(radius, currentTheta.current, phi)
        groupRef.current.position.copy(newPos)
        groupRef.current.lookAt(0, 0, 0) // 確保文字貼合球面
  
        // --- 2. 🔥 輪流出現邏輯 (探照燈效果) ---
        
        const t = state.clock.elapsedTime
        
        // 設定完整跑一圈需要幾秒 (越久越慢)
        const cycleDuration = 15 
        
        // 計算目前進度 (0.0 ~ 1.0)
        const currentProgress = (t % cycleDuration) / cycleDuration
        
        // 計算我自己在這個圓圈中的位置 (0.0 ~ 1.0)
        // 這裡直接用 index/total，代表我是第幾個
        const myPosition = index / total
        
        // 計算我離「現在的探照燈」有多遠
        let distance = Math.abs(currentProgress - myPosition)
        
        // 處理「頭尾相接」的問題
        // 例如：進度是 0.99，我是 0.01，我們其實很近，不應該被算成很遠
        if (distance > 0.5) distance = 1 - distance
        
        // 設定「探照燈寬度」：數值越小，同時亮起的字越少
        // 0.15 代表大約同時會有 15% 的字是亮的 (約 1-2 個)
        const lightWidth = 0.15 
        
        // 計算透明度：距離越近越亮，距離遠就全黑
        // Math.max(0, ...) 確保不會變成負數
        let opacity = Math.max(0, 1 - (distance / lightWidth))
        
        // 加上平滑曲線 (Ease-in-out)，讓淡入淡出更柔和，不要直上直下
        opacity = Math.pow(opacity, 2) 
  
        // 基礎可見度 (最低亮度)：
        // 如果你希望沒輪到的字完全隱形，設為 0
        // 如果希望保留一點點殘影，設為 0.05
        const baseOpacity = 0
        const finalOpacity = baseOpacity + opacity * (1 - baseOpacity)
  
        // --- 3. 應用透明度（性能優化：只在變化超過閾值時更新）---
        
        // 只在透明度變化超過 0.01 時才更新材質（減少不必要的更新）
        if (Math.abs(finalOpacity - lastOpacityRef.current) > 0.01) {
          lastOpacityRef.current = finalOpacity
          
          // 使用緩存的材質引用，避免每幀遍歷
          materialRefs.current.forEach(mat => {
            if (mat) {
              // 確保材質透明度開啟
              mat.transparent = true
              mat.opacity = finalOpacity
              
              // 如果是「解方(Solution)」，讓它亮的時候「發光」
              if (type === 'solution' && mat.emissiveIntensity !== undefined) {
                // 當 opacity 高時，emissive 強度也變高 (製造呼吸閃爍感)
                mat.emissiveIntensity = opacity * 2.5
              }
            }
          })
          
          // 同時也嘗試修改 fillOpacity（如果 Text 組件支持）
          if (textRef.current && textRef.current.fillOpacity !== undefined) {
            textRef.current.fillOpacity = finalOpacity
          }
          
          // 如果文字有描邊，也一起淡入淡出
          if (textRef.current && textRef.current.outlineOpacity !== undefined) {
            textRef.current.outlineOpacity = finalOpacity
          }
        }
      }
    })
  
    // 樣式設定
    const style = type === 'solution' ? {
      color: "#FFE9A8", fontSize: 0.6, opacity: 1,
      font: "/fonts/LXGWWenKaiMonoTC-Light.ttf"
    } : {
      color: "#BFC7D5", fontSize: 0.45, opacity: 0.5,
      font: "/fonts/LXGWWenKaiMonoTC-Light.ttf"
    }
  
    return (
      <group ref={groupRef}>
        {/* 移除 Billboard，使用 lookAt 配合球體效果更好，或保留 Billboard 視需求而定 */}
        {/* 這裡示範保留 Billboard 的寫法，若要貼合球面請參考上一題解法 */}
        <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
           <Text
              ref={textRef} // 🔥 記得綁定 ref
              fontSize={style.fontSize}
              color={style.color}
              font={style.font}
              anchorX="center"
              anchorY="middle"
              outlineWidth={0} 
              textAlign="center"
              maxWidth={5} 
              lineHeight={1.4}
              // 初始透明度設為 0，完全由 useFrame 控制
              fillOpacity={0} 
            >
              {text}
              {type === 'solution' && (
                 <meshBasicMaterial color={style.color} toneMapped={false} />
              )}
            </Text>
        </Billboard>
      </group>
    )
  }

export default function DomeWordCloud({ words, radius = 9 }) {
  // 將資料拆解成扁平陣列 (Flatten)
  // 這樣問題跟解法就會分開漂浮，不會黏在一起
  // 只顯示有值的字段，如果 solution 或 problem 為 null/空，就不添加
  const items = useMemo(() => {
    const list = []
    
    words.forEach((pair, index) => {
      // 只加入有值的解法 (Solution)
      if (pair.solution && pair.solution.trim()) {
        list.push({
          id: `sol-${index}`,
          text: pair.solution.trim(),
          type: 'solution',
          // 解法飄得比較快，半徑稍微小一點 (浮在前面)
          speed: (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.2),
          radius: radius * 0.75
        })
      }

      // 只加入有值的問題 (Problem)
      if (pair.problem && pair.problem.trim()) {
        list.push({
          id: `prob-${index}`,
          text: pair.problem.trim(),
          type: 'problem',
          speed: (Math.random() > 0.5 ? 1 : -1) * (0.02 + Math.random() * 0.05),
          // 🔥 修改這裡：原本是 radius (100%)，這一定會穿牆
          // 改成 0.85，讓它離牆壁還有一段距離
          radius: radius * 0.85 
        })
      }
    })

    // 不再洗牌，保持順序以實現均勻分佈
    return list
  }, [words, radius])

  return (
    <group position={[0, -1, 0]}> 
      {items.map((item, index) => (
        <FloatingText 
          key={item.id}
          text={item.text}
          type={item.type}
          radius={item.radius}
          speed={item.speed}
          // 🔥 新增這兩個 props：傳入索引和總數，用於均勻分佈
          index={index}
          total={items.length}
        />
      ))}
    </group>
  )
}