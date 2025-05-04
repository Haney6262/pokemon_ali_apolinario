import { useEffect } from "react"
import "./Notification.css"

function Notification({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
      <button className="notification-close" onClick={onClose}>
        ×
      </button>
    </div>
  )
}

export default Notification
