"use client"

import type React from "react"
import { createPortal } from "react-dom"
import Button from "../../Atomic/Button"

interface PopupModalProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  children?: React.ReactNode
  hideFooter?: boolean
  customFooter?: React.ReactNode
}

const PopupModal: React.FC<PopupModalProps> = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete", 
  children,
  hideFooter = false,
  customFooter
}) => {
  if (!open) return null

  const handleConfirm = async () => {
    if (onConfirm) {
      // Await if onConfirm returns a promise so callers can perform async work
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = (onConfirm as any)()
        if (result && typeof result.then === 'function') {
          await result
        }
      } catch (err) {
        // If onConfirm throws, still allow caller to handle; do not auto-close
        return
      }
    }
    onClose()
  }

  return createPortal(
    <div className="flex items-center justify-center fixed inset-0 bg-black/80 z-[999]">
      <div className="w-full max-w-xl mx-4 bg-surface-primary shadow-lg rounded-lg overflow-hidden">
        <div className="py-2 px-4 flex justify-between items-center border-b border-primary-100">
          <h2 className="text-xl font-medium">{title}</h2>
          <Button style="Icon" icon="close" onClick={onClose} />
        </div>

        <div className="px-4 py-6 bg-surface-primary">
          {children || (
            <p>
              Are you sure you want to delete this Record? You CAN NOT view this Record in your list anymore if you
              delete
            </p>
          )}
        </div>

        {!hideFooter && (
          <div className="py-2 px-4 flex justify-end items-center gap-4 border-t border-primary-100">
            {customFooter || (
              <>
                <Button style="Tertiary" text="No, Don't Delete" onClick={onClose} />
                <Button style="Danger" text="Yes, Delete" onClick={handleConfirm} />
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default PopupModal
