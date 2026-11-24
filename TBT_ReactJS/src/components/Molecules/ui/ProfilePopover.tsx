import React, { useEffect, useRef } from 'react'

import { Link } from 'react-router-dom'
import { LogOut, Settings } from 'lucide-react'
import AvatarPlaceholder from '@/assets/Images/pngegg.png'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useLogout } from '@/hooks/useLogout'
import { getDisplayName, getDisplayEmail } from '@/lib/userUtils'

export const ProfilePopover: React.FC = () => {
    const [Popover, setPopOver] = React.useState(false)
    const { user, loading } = useCurrentUser()
    const logout = useLogout()

    // Ref for detecting outside clicks
    const profileRef = useRef<HTMLDivElement | null>(null);
    
    // Close popover on outside click
    useEffect(() => {
        const handler = (event: MouseEvent) => {
          if (
            profileRef.current &&
            !profileRef.current.contains(event.target as Node)
          ) {
            setPopOver(false);
          }
        };
        document.addEventListener("mousedown", handler);
        return () => {
          document.removeEventListener("mousedown", handler);
        };
      }, []);

    const displayName = getDisplayName(user)
    const displayEmail = getDisplayEmail(user)
    const avatarSrc = user?.avatar || AvatarPlaceholder

  return (
    <>
        <div className='relative' ref={profileRef}>

        <button onClick={() => setPopOver(!Popover)} className='min-h-6 min-w-6 h-10 w-10 flex justify-center items-center rounded-full overflow-hidden  relative'>
            <img src={avatarSrc} alt="user_picture" />
        </button>
        {Popover &&
            <div className=' absolute right-2 top-[52px] z-20  bg-surface-primary border border-borderColor-secondary rounded-md shadow-2xl'>
                <div className='p-4 border-b border-borderColor-secondary'>
                    <h4 className='font-medium'>{loading ? 'Loading...' : (displayName || '—')}</h4>
                    <p className='text-sm text-textColor-muted'>{loading ? '' : (displayEmail || '—')}</p>
                </div>
                <div className='px-4 py-3'>
                    <Link to={'/dashboard/settings/account'} className='flex gap-3 items-center p-2 hover:bg-primary-100 rounded-md'>
                        <Settings size={16} />
                        Settings
                    </Link>
                    <button 
                        onClick={logout} 
                        className="flex gap-3 items-center p-2 hover:text-danger-600 hover:bg-danger-100 rounded-md w-full text-left"
                        type="button"
                        aria-label="Log out"
                    >
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            </div>
        }
        </div>
    </>
  )
}
