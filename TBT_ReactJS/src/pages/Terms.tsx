import FooterBar from '@/components/Molecules/FooterBar'
import Banner from '@/components/Molecules/landing/Banner'
import NavigationBar from '@/components/Molecules/landing/NavigationBar'


export const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Banner />
      <NavigationBar />
      <div className='mt-20 w-2/4 mx-auto'>
        <div className='flex flex-wrap justify-between'>
          <h2 className='text-2xl font-semibold'>TERMS OF SERVICE</h2>
          <p>Last Updated: 8 Dec 2025</p>
        </div>

        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>1. Service Description</h3>
          <p className='pl-6'>TBT (Text-Based Ticketing) is a customer support communication system that allows users to submit service issues and receive updates via SMS text messaging. Messages sent to TBT may create support tickets, add comments to existing tickets, or deliver responses from support agents.</p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>2. Consent to Receive Messages</h3>
          <p className='pl-6'>By sending a text message to a TBT service phone number, you provide consent to receive transactional and conversational SMS messages related to your support request. Message frequency varies based on user interaction and support responses.</p>
        </div>
          <div className='mt-6'>
          <h3 className='text-xl font-semibold'>3. Opt-In</h3>
          <p className='pl-6'>
            By sending a text message to a TBT service phone number, you are providing explicit consent (“opt-in”) to receive SMS messages from TBT related to your support ticket. Users are informed via our support documentation and service instructions that texting our number will create a ticket and trigger SMS notifications, including ticket confirmations, updates, and agent replies. This opt-in is user-initiated and no promotional messages are sent.
          </p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>4. Opt-Out</h3>
          <p className='pl-6'>You may opt out of receiving SMS messages at any time by replying <b>STOP</b> to any message. For assistance, reply <b>HELP.</b></p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>5. Message & Data Rates</h3>
          <p className='pl-6'>Message and data rates may apply depending on your mobile carrier and plan.</p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>6. Acceptable Use</h3>
          <p className='pl-6'>The service may only be used for lawful customer support communications. Abuse, spam, or automated misuse of the service is not permitted.</p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>7. Service Availability</h3>
          <p className='pl-6'>SMS delivery is dependent on mobile networks and carriers and may be delayed or unavailable. TBT is not responsible for delayed or undelivered messages.</p>
        </div>
        <div className='mt-6'>
          <h3 className='text-xl font-semibold'>8. Changes</h3>
          <p className='pl-6'>These Terms may be updated from time to time. Continued use of the service constitutes acceptance of the updated Terms.</p>
        </div>
        <div className='mt-6 my-20'>
          <h3 className='text-xl font-semibold'>9. Contact Us</h3>
          <p className='pl-6'>For questions regarding these Terms, contact:</p>
          <a className='pl-6' href="mailto:support@elifeamerica.com">support@elifeamerica.com</a>
        </div>
      </div>
      <FooterBar />
    </div>
  )
}
