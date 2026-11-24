import React from 'react'
import QrCode from '@/assets/Images/qr.png';
import Button from '@/components/Atomic/Button';
import InputField from '@/components/Molecules/InputField';
import { Copy, Download, Printer } from 'lucide-react';

export const AddTwoFactor = () => {
    const [addTwofactor, setAddtwoFactor] = React.useState(false);
    return (
        <>
            <div className='space-y-5 mt-6'>
                <div className='flex justify-between items-start'>
                    <div className='w-full'>
                        <p className='text-base font-medium'>
                            {addTwofactor? 'Link authenticator app': 'Two - step verification'} </p>
                        <p className='text-sm leading-4 w-full text-textColor-muted '>
                            {addTwofactor ? 'Get an authenticator app on your phone or computer (e.g. Duo, Google Authenticator)' : 'Disabled'}
                        </p>
                    </div>
                    <button onClick={() => setAddtwoFactor(!addTwofactor)} className='hover:text-primary-500 font-medium text-right outline-none'>
                        {addTwofactor ? 'Cancel' : 'Enable'}
                    </button>
                </div>
                { 
                    addTwofactor &&
                    <div className='space-y-4 mt-6'>
                        {/* Scan Qr Code and Verify OTP  */}
                        <div className='p-1 flex gap-10 '>
                            <div className='h-32 w-32 p-1 bg-white rounded-md'>
                                <img src={QrCode}  alt="" />
                            </div>
                            <div className='space-y-4'>
                                <p>EW65-5S17-HQ21-GL35-BVNR- 17WP-CFSH-ECTC</p>
                                <Button style='Secondary' text='Copy key'/>
                            </div>
                        </div>
                        <div className='space-y-5'>
                            <InputField 
                                label={'Verify the code from the app'} 
                                name={''} 
                                className='md:w-1/2'
                                value={undefined}
                                onChange={()=>{}} 
                            />
                            <Button text='Continue' className='w-24'/>
                        </div>

                        {/* Get Backup Code Finish Setup */}
                        <div>
                            <h4 className='font-medium'>Backup codes</h4>
                            <p className='text-sm md:w-2/3 text-textColor-muted'>You can use one of these to sign in to account. if you lose access to your authentication device.</p>
                            <div className='mt-4 bg-surface-secondary md:w-1/2 border border-borderColor-secondary rounded-md'>
                                <div className='p-4 flex gap-5'>
                                    <ul className='space-y-2'>
                                        <li>b4fa7d905</li>
                                        <li>c803eab66</li>
                                        <li>1636d689e</li>
                                        <li>94576d433</li>
                                        <li>62f2c51d9b</li>
                                    </ul>
                                    <ul className='space-y-2'>
                                        <li>b4fa7d905</li>
                                        <li>c803eab66</li>
                                        <li>1636d689e</li>
                                        <li>94576d433</li>
                                        <li>62f2c51d9b</li>
                                    </ul>
                                </div>
                                <div className='flex border-t border-borderColor-secondary'>
                                    <button className='w-1/3 p-2 flex justify-center text-primary-500 border-r border-borderColor-secondary'><Download size={18}/></button>
                                    <button className='w-1/3 p-2 flex justify-center text-primary-500 border-r border-borderColor-secondary'><Printer size={18}/></button>
                                    <button className='w-1/3 p-2 flex justify-center text-primary-500'><Copy size={18}/></button>
                                </div>
                            </div>
                        </div>  
                        {/* Remove */}
                         <div>
                            <Button style='Text' text='Backup codes' />
                            <div className='mt-4 p-4 bg-surface-secondary space-y-4  rounded-md'>
                                <h3 className='text-xl font-medium'>Remove two-step verification</h3>
                                <p>Verification codes from this authenticator will no longer be required when signing in. </p>
                                <p>Your account may not be as secure, Are you sure you want to continue?</p>
                                <div className='flex gap-2'>
                                    <Button style='Tertiary' text='Cancel' />
                                    <Button style='Danger' text='Remove' />
                                </div>
                            </div>
                         </div>
                    </div>
                }
            </div>
        </>
    )
}
