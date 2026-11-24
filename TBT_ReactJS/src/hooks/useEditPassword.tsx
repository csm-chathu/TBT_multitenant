import { useState, useCallback } from 'react'
import * as yup from 'yup'
import { validateForm } from '@/lib/validationSchemas'
import { useAppDispatch } from '@/redux/hooks'
import { changePassword } from '@/redux/user/userSlice'
import useToast from '@/hooks/useToast'


export const useEditPassword = () => {
  const dispatch = useAppDispatch()

  const [editMode, setEditMode] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const resetForm = useCallback(() => {
    setOldPassword('')
    setNewPassword('')
    setRepeatPassword('')
    setErrors({})
  }, [])

  const toggleEdit = useCallback(() => {
    setEditMode((prev) => {
      const opening = !prev
      if (opening) resetForm()
      return opening
    })
  }, [resetForm])

  const close = useCallback(() => {
    setEditMode(false)
    resetForm()
  }, [resetForm])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      const schema = yup.object({
        oldPassword: yup.string().required('Current password is required'),
        newPassword: yup
          .string()
          .required('New password is required')
          .min(8, 'Password must be at least 8 characters')
          .matches(/(?=.*[A-Za-z])/, 'Password must contain at least one letter')
          .matches(/(?=.*\d)/, 'Password must contain at least one number'),
        repeatPassword: yup
          .string()
          .required('Please repeat the new password')
          .oneOf([yup.ref('newPassword')], 'Passwords must match'),
      })

      const { isValid, errors: validationErrors } = await validateForm(schema, {
        oldPassword,
        newPassword,
        repeatPassword,
      })

      if (!isValid) {
        setErrors(validationErrors)
        return
      }

      try {
        setLoading(true)
        await dispatch(changePassword({ oldPassword, newPassword })).unwrap()

        try { toastSuccess('Password updated successfully.') } catch {}
        resetForm()
        setEditMode(false)
      } catch (err: any) {
        const message = err || err?.message || 'Failed to update password.'
        try { toastError(String(message)) } catch {}
      } finally {
        setLoading(false)
      }
    },
    [oldPassword, newPassword, repeatPassword, dispatch, resetForm]
  )

  return {
    editMode,
    toggleEdit,
    close,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    repeatPassword,
    setRepeatPassword,
    errors,
    loading,
    handleSubmit,
    resetForm,
  }
}

export default useEditPassword
