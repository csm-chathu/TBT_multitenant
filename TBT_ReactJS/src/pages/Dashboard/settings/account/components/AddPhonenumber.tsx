import Button from '@/components/Atomic/Button';
import InputField from '@/components/Molecules/InputField';
import React, { useState } from 'react'

interface AddPhoneProps {
  phone?: string
}

export const AddPhonenumber: React.FC<AddPhoneProps> = ({ phone }) => {
        const [addPhonenumber, ] = useState(false);
        const [value, setValue] = useState<string | undefined>(phone || undefined)
  return (
    <div className='pt-5'>
        <div className='flex justify-between items-start'>
            <div className='w-full'>
                <p className='text-base font-medium'>{addPhonenumber ?'Add phone number': 'Phone number'}</p>
                <p className='text-sm leading-4 text-textColor-muted w-[90%]'>
                    {addPhonenumber ? 'Including an area code for easy dialling.':(phone || 'Add phone number')} 
                </p>
            </div>
            {/* <button onClick={()=>setAddPhonenumber(!addPhonenumber)} className='hover:text-primary-500  text-right font-medium outline-none'>
                {addPhonenumber ? 'Cancel' : 'Add'}
            </button> */}
        </div>
        {
            addPhonenumber && 
                <div className='space-y-5 mt-6'>
                    <InputField 
                        label={'Phone number'} 
                        name={'phoneNumber'} 
                        value={value}
                        onChange={setValue} 
                    />
                    <Button text='Save' className='w-24'/>
                </div>
        }
    </div>
  )
}
