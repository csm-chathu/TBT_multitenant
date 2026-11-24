import Button from '@/components/Atomic/Button'
import InputField from '@/components/Molecules/InputField'
import React from 'react'
import useEditPassword from '@/hooks/useEditPassword'

export const EditPassword: React.FC = () => {
    const {
        editMode,
        toggleEdit,
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
    } = useEditPassword()


    return (
        <div className='border-b border-borderColor-secondary py-4'>
            <div className='flex justify-between items-start'>
                <div className='w-full'>
                    <p className='text-base font-medium'>{editMode ? 'Edit Password' : 'Password'} </p>
                    <p className='text-sm leading-4 text-textColor-muted w-[90%]'>
                        {editMode ? 'Password needs to be 8 characters and contain at least one alphabet and one number.' : '••••••••••••'}
                    </p>
                </div>
                <button onClick={() => { toggleEdit(); if (!editMode) resetForm() }} className='hover:text-primary-500 font-medium  text-right outline-none'>
                    {editMode ? 'Cancel' : 'Edit'}
                </button>
            </div>

            {editMode && (
                <form className='space-y-5 mt-6' onSubmit={handleSubmit}>
                    <div>
                        <InputField
                            label={'Current password'}
                            name={'currentPassword'}
                            type='password'
                            className='w-full'
                            value={oldPassword}
                            onChange={setOldPassword}
                            error={errors.oldPassword}
                        />
                    </div>

                    <div className='flex gap-4'>
                        <InputField
                            label={'New password'}
                            name={'newPassword'}
                            type='password'
                            className='w-full'
                            value={newPassword}
                            onChange={setNewPassword}
                            error={errors.newPassword}
                        />
                        <InputField
                            label={'Repeat password'}
                            name={'repeatPassword'}
                            type='password'
                            className='w-full'
                            value={repeatPassword}
                            onChange={setRepeatPassword}
                            error={errors.repeatPassword}
                        />
                    </div>

                    <div className='flex gap-3'>
                        <Button type='submit' text='Save' className='w-24' loading={loading} />
                        <Button text='Cancel' className='w-24' onClick={() => { toggleEdit(); resetForm() }} />
                    </div>
                </form>
            )}

        </div>
    )
}
