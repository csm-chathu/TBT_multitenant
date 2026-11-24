import FooterBar from '@/components/Molecules/FooterBar'
import Banner from '@/components/Molecules/landing/Banner'
import NavigationBar from '@/components/Molecules/landing/NavigationBar'


export const Privacy = () => {
    return (
        <div className="min-h-screen flex flex-col bg-surface-secondary">
            <Banner />
            <NavigationBar />
            <div className='mt-20 w-2/4 mx-auto'>
                <div className='flex flex-wrap justify-between'>
                    <h2 className='text-2xl font-semibold'>PRIVACY POLICY</h2>
                    <p>Last Updated: 8 Dec 2025</p>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>1. Information We Collect</h3>
                    <p className='pl-4'>When you use TBT, we may collect:</p>
                    <ul className='pl-8 my-4 list-disc space-y-1'>
                        <li>Your mobile phone number</li>
                        <li>The content of SMS messages you send or receive</li>
                        <li>Ticket IDs and related support metadata</li>
                    </ul>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>2. How We Use Information</h3>
                    <p className='pl-4'>Information collected through TBT is used solely to:</p>
                    <ul className='pl-8 my-4 list-disc space-y-1'>
                        <li>Create and manage support tickets</li>
                        <li>Enable communication between customers and support agents</li>
                        <li>Improve service quality and response handling</li>
                    </ul>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>3. Data Sharing</h3>
                    <p className='pl-6'>We do <b>not</b> sell, rent, or share personal information with third parties for marketing purposes. Message data is shared only with service providers required to deliver SMS messages (such as messaging carriers and infrastructure providers).</p>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>4. Data Retention</h3>
                    <p className='pl-6'>Message content and ticket information are retained only as long as necessary to provide support services or to meet operational and legal requirements.</p>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>5. Opt-Out & Your Rights</h3>
                    <p className='pl-6'>You may opt out of SMS communications at any time by replying STOP. Upon opt-out, you will no longer receive messages related to your ticket unless you re-initiate contact.</p>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>6. Security</h3>
                    <p className='pl-6'>Reasonable administrative and technical safeguards are used to protect message data and personal information.</p>
                </div>
                <div className='mt-6'>
                    <h3 className='text-xl font-semibold'>7. Children’s Privacy</h3>
                    <p className='pl-6'>TBT is not intended for use by individuals under the age of 13.</p>
                </div>
                <div className='mt-6 my-20'>
                    <h3 className='text-xl font-semibold'>8. Contact Us</h3>
                    <p className='pl-6'>For privacy-related questions or requests, contact:</p>
                    <a className='pl-6' href="mailto:support@elifeamerica.com">support@elifeamerica.com</a>
                </div>
            </div>
            <FooterBar />
        </div>
    )
}
