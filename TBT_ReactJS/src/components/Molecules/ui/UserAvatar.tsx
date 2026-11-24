import type React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string
  name?: string
  background?: any
  href?: string
  small?: boolean
  className?: string
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  background,
  href,
  small = false,
  className,
}) => {
  const avatarClasses = cn(
    "min-h-6 min-w-6 flex justify-center items-center rounded-full overflow-hidden relative",
    small ? "h-7 w-7" : "h-10 w-10",
    className,
  )

  const getInitial = (str?: string) => {
    if (!str) return null
    const cleaned = str.trim().replace(/^[^a-zA-Z0-9]+/, '')
    if (cleaned.length > 0) {
      return cleaned.charAt(0).toUpperCase()
    }
    const raw = str.trim().charAt(0).toUpperCase()
    return raw !== '+' ? raw : 'U'
  }

  const initialChar = getInitial(name)

  const content = (
    <div className={avatarClasses} style={{ backgroundColor: background }}>
      {src ? (
        <img src={src || "/placeholder.svg"} alt="User avatar" className="w-full h-full object-cover" />
      ) : initialChar ? (
        <p className={cn("font-medium text-white", small ? "text-base" : "text-xl")}>{initialChar}</p>
      ) : null}
    </div>
  )

  if (href) {
    return <Link to={href}>{content}</Link>
  }

  return content
}

export default UserAvatar
