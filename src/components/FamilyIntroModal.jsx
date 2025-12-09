import { useEffect } from 'react'
import { FAMILY_MEMBERS } from '../data/familyMembers'
import './FamilyIntroModal.css'

export default function FamilyIntroModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="family-modal-overlay" onClick={onClose}>
      <div className="family-modal" onClick={(e) => e.stopPropagation()}>
        <button className="family-modal-close" onClick={onClose}>
          <span className="close-icon">×</span>
        </button>
        
        <div className="family-modal-content">
          {/* Header 區塊 */}
          <header className="modal-header">
            <h1 className="family-modal-title">關於這個家</h1>
            <div className="title-underline"></div>
            <p className="intro-text">
              歡迎來到這個平凡卻特別的家。<br/>
              這不僅是一個虛擬展場，更是一份可以搬進真實公寓的生活藍圖。
            </p>
          </header>

          {/* 觀展視角 (新增的區塊) 🔥 */}
          <div className="curatorial-note">
            <h3 className="note-title">寫在進門之前</h3>
            <div className="note-content">
              <div className="note-item">
                <div>
                  <h4>真實與對照</h4>
                  <p>
                  這裡有兩間風格鮮明、且同樣舒適的房間，它們共享著完全一樣的真實公寓格局。
                  我們想傳達的，並非橘色科技是唯一的解答，而是希望透過這場實驗，與您一同發現：
                  當『人』成為設計的圓心時，那些微小的空間改變與科技輔助，將如何創造出與過往經驗截然不同的生活體驗？
                  </p>
                </div>
              </div>
              <div className="note-item">
                <div>
                  <h4>轉場與沉澱</h4>
                  <p>
                    展間之間設有模擬玄關的轉場空間。請在這裡稍作停留，轉換心情，準備從冰冷的現實進入溫暖的解方。
                  </p>
                </div>
              </div>
              <div className="note-item">
                <div>
                  <h4>聆聽與凝視</h4>
                  <p>
                  請像一位隱形的訪客，漫步在這些生活場景中。
                  尋找那些<b>微微發光</b>的物件，那是我們留下的線索。
                  點擊後，你將透過文字或<b>家人的語音對話</b>，一窺這看似日常的生活縫隙中，究竟<b>隱藏著什麼樣的難題</b>？
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 觀展指引 (雜誌風格) */}
          <div className="exhibition-flow-container">
            <div className="flow-card">
              <span className="flow-number">01</span>
              <div className="flow-text">
                <h3>隱藏的困境</h3>
                <p>看見產品誕生前的不便與日常掙扎。</p>
              </div>
            </div>
            <div className="flow-divider"></div>
            <div className="flow-card">
              <span className="flow-number">02</span>
              <div className="flow-text">
                <h3>科技的解答</h3>
                <p>體驗輔助科技如何帶來新的可能性。</p>
              </div>
            </div>
          </div>

          {/* 家庭成員網格 */}
          <div className="family-section-title">成員介紹</div>
          <div className="family-members-grid">
            {FAMILY_MEMBERS.map((member, index) => (
              <div key={index} className="family-member-card">
                <div className="member-main-info">
                  <h3 className="member-name">
                    {member.name} 
                    <span className="member-age">{member.age}</span>
                  </h3>
                  <div className="member-roles">
                    <span className="role-title">{member.roleTitle}</span>
                  </div>
                </div>
                <p className="member-description">{member.description}</p>
              </div>
            ))}
          </div>

          {/* 開始按鈕 */}
          <div className="modal-footer">
            <button className="start-tour-btn" onClick={onClose}>
              進入展覽
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}