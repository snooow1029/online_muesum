import { useState, useEffect } from 'react'
import './PhoneInput.css'

export default function PhoneInput({ isOpen, onSubmit, onClose }) {
  // 模式：'problem' (煩惱) 或 'solution' (解方)
  const [mode, setMode] = useState('problem') 
  const [inputValue, setInputValue] = useState('')
  
  const [animateIn, setAnimateIn] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAnimateIn(true)
      document.body.style.overflow = 'hidden'
      setSubmitSuccess(false)
      setIsSubmitting(false)
      setInputValue('')
      setMode('problem') // 預設為傾訴模式
    } else {
      setAnimateIn(false)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (inputValue.trim() && !isSubmitting) {
      setIsSubmitting(true)
      
      // 只提交用戶實際輸入的內容，不添加默認的 pair 數據
      const payload = mode === 'problem' 
        ? { 
            problem: inputValue.trim(), 
            solution: null // 只提交煩惱，不解方
          }
        : { 
            problem: null, // 只提交解方，不煩惱
            solution: inputValue.trim() 
          }
      
      onSubmit(payload)
      
      setSubmitSuccess(true)
      setInputValue('')
      
      setTimeout(() => {
        setIsSubmitting(false)
        setSubmitSuccess(false)
        onClose()
      }, 2500)
    }
  }

  return (
    <div className={`phone-overlay ${animateIn ? 'active' : ''}`}>
      <div className="phone-frame">
        <div className="phone-notch"></div>
        <div className="phone-screen">
          <div className="status-bar">
            <span>20:25</span>
            <div className="status-icons"><span>5G</span><div className="battery"><div className="battery-level"></div></div></div>
          </div>

          <div className="screen-content">
            <header className="app-header">
              <span className="app-subtitle">FUTURE LAB</span>
              <h2 className="app-title">共創星空</h2>
            </header>
            
            {/* 🔥 新增：模式切換 Tab */}
            <div className="mode-tabs">
              <button 
                className={`mode-tab ${mode === 'problem' ? 'active' : ''}`}
                onClick={() => setMode('problem')}
                type="button"
              >
                分享煩惱
              </button>
              <button 
                className={`mode-tab ${mode === 'solution' ? 'active' : ''}`}
                onClick={() => setMode('solution')}
                type="button"
              >
                想個點子
              </button>
            </div>

            {/* 動態變換的引導文案 */}
            <div className={`prompt-card ${mode}`}>
              <p className="prompt-label">
                {mode === 'problem' ? '跟我們說說…' : '想像一下…'}
              </p>
              <p className="system-question">
                {mode === 'problem' 
                  ? "「最近什麼事情讓你有點卡卡的？」" 
                  : "「有什麼功能是你覺得『有這個就好了』？」"}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="input-form">
              <div className="input-group">
                <label>
                  {mode === 'problem' ? '你的困境 (OS)' : '你的想像 (Idea)'}
                </label>
                <textarea 
                  className="elegant-textarea"
                  placeholder={mode === 'problem' 
                    ? "例如：不想被當作廢人、怕出門找不到路..." 
                    : "例如：導航更直覺、提醒更貼心、生活更不容易出錯…"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  rows={5} // 讓輸入框大一點
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
              
              {submitSuccess ? (
                <div className="submit-success">
                  <div className="success-icon">
                    {mode === 'problem' ? '☁️' : '✨'}
                  </div>
                  <p>{mode === 'problem' ? '你的煩惱我們記住了' : '你的想法已加入星空'}</p>
                </div>
              ) : (
                <button 
                  type="submit" 
                  className={`submit-btn ${mode}`} // 按鈕顏色隨模式變
                  disabled={isSubmitting || !inputValue.trim()}
                >
                  {isSubmitting ? '傳送中...' : (mode === 'problem' ? '釋放煩惱' : '點亮解方')}
                </button>
              )}
            </form>
            
            <button className="exit-text-btn" onClick={onClose}>
                看看別人的想法
            </button>
          </div>
          
          <div className="home-indicator"></div>
        </div>
      </div>
    </div>
  )
}