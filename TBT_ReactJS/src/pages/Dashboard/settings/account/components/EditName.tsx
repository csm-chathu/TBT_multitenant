import Button from '@/components/Atomic/Button';
import InputField from '@/components/Molecules/InputField'
import React, { useState } from 'react'

interface EditNameProps {
  firstName?: string
  lastName?: string
  fullName?: string
}

export const EditName: React.FC<EditNameProps> = ({ firstName, lastName, fullName }) => {
    const [editName,] = useState(false);
    const [first, setFirst] = useState(firstName || (fullName ? fullName.split(' ')[0] : ''))
    const [last, setLast] = useState(lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : ''))

  return (
    <div className='border-b border-borderColor-secondary py-4'>
        <div className='flex justify-between items-start'>
            <div className='w-full'>
                <p className='text-base font-medium'>{editName? 'Edit name':'Full name'}</p>
                <p className='text-sm leading-4 text-textColor-muted w-[90%]'>
                    {editName ? 'This will be visible on your profile and to your team members.' : (fullName || `${first || ''} ${last || ''}`.trim() || '—')}
                </p>
            </div>
            {/* <button onClick={()=>setEditName(!editName)} className='hover:text-primary-500 font-medium text-right outline-none'>
                {editName ? 'Cancel' : 'Edit'}
            </button> */}
        </div>
        {
            editName && 
            <div className='space-y-5 mt-6'>
                <div className='flex gap-4'>
                    <InputField 
                        label={'First name'} 
                        name={'firstName'} 
                        className='w-full'
                        value={first}
                        onChange={setFirst} 
                    />
                    <InputField 
                        label={'Last name'} 
                        name={'lastName'} 
                        className='w-full'
                        value={last}
                        onChange={setLast} 
                    />
                </div>
                <Button text='Save' className='w-24'/>
            </div>
        }
    </div>
  )
}
