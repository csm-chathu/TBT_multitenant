import { useEffect, useRef, useState, MutableRefObject } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchMe, selectCurrentUser, selectUserLoading } from '@/redux/user/userSlice'

type UseProfilePopoverReturn = {
  open: boolean
  toggle: () => void
  close: () => void
  containerRef: MutableRefObject<HTMLDivElement | null>
  user: any
  loading: boolean
}

export const useProfilePopover = (): UseProfilePopoverReturn => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)
  const loading = useAppSelector(selectUserLoading)

  useEffect(() => {
    if (!user) dispatch(fetchMe())
  }, [dispatch, user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const toggle = () => setOpen((s) => !s)
  const close = () => setOpen(false)

  return { open, toggle, close, containerRef, user, loading }
}

export default useProfilePopover
