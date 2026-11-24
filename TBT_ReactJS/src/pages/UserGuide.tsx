import FooterBar from '@/components/Molecules/FooterBar'
import Banner from '@/components/Molecules/landing/Banner'
import NavigationBar from '@/components/Molecules/landing/NavigationBar'
import stepl1 from '@/assets/Images/Landingpage/user-guide/steps-1-l.png'
import stepl2 from '@/assets/Images/Landingpage/user-guide/steps-2-l.png'
import stepl3 from '@/assets/Images/Landingpage/user-guide/steps-3-l.png'
import stepl4 from '@/assets/Images/Landingpage/user-guide/steps-4-l.png'
import stepd1 from '@/assets/Images/Landingpage/user-guide/steps-1-d.png'
import stepd2 from '@/assets/Images/Landingpage/user-guide/steps-2-d.png'
import stepd3 from '@/assets/Images/Landingpage/user-guide/steps-3-d.png'
import stepd4 from '@/assets/Images/Landingpage/user-guide/steps-4-d.png'

export const UserGuide = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Banner />
      <NavigationBar />
      <div className="space-y-14 my-20 w-full max-w-6xl mx-auto px-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-textColor-base">User Guide</h1>
          <p className="mt-2 text-textColor-muted text-base">
            Learn how to create and manage support tickets using simple SMS text messages.
          </p>
        </div>

        <div className='space-y-5'>
          <UserGuideCard
            reverse
            stepNumber={1}
            badgeText="Create Ticket"
            title="Text to Create Ticket"
            description="Simply send any text message to our support number. Your message becomes a support ticket automatically. You don't need to sign up or fill out any forms — just text us and we'll take care of the rest."
            imageLightSrc={stepl1}
            imageDarkSrc={stepd1}
            imageAlt="Step 1 illustration"
          />
          <UserGuideCard
            stepNumber={2}
            badgeText="Confirmation"
            title="A support agent gets assigned"
            description="Once your ticket is created, it's automatically assigned to an agent. You'll receive a confirmation SMS with your unique Ticket ID to track your request."
            imageLightSrc={stepl2}
            imageDarkSrc={stepd2}
            imageAlt="Step 1 illustration"
          />
          <UserGuideCard
            reverse
            stepNumber={3}
            badgeText="updated"
            title="Stay updated via SMS"
            description="Whenever your agent adds a comment or your ticket status changes, you'll get an SMS automatically. No app needed  everything comes to your phone."
            imageLightSrc={stepl3}
            imageDarkSrc={stepd3}
            imageAlt="Step 1 illustration"
          />
          <UserGuideCard
            stepNumber={4}
            badgeText="Reply"
            title="Reply to Add a Comment"
            description="Need to add more info? Reply to the same number using this format."
            imageLightSrc={stepl4}
            imageDarkSrc={stepd4}
            imageAlt="Step 1 illustration"
          />
        </div>

        {/* Quick Reference */}
        <div className="bg-primary-100 border border-borderColor-secondary rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-primary-600 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">tips_and_updates</span>
            Quick Reference
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-textColor-base min-w-[140px]">Create a ticket:</span>
              <span className="text-textColor-muted">Text anything to <span className="font-mono font-semibold text-primary-600">+1 (626) 263-4999</span></span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-textColor-base min-w-[140px]">Add a comment:</span>
              <span className="font-mono text-textColor-muted"><span className="text-primary-600">@ticketID</span> your message</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-textColor-base min-w-[140px]">Get updates:</span>
              <span className="text-textColor-muted">Automatic SMS on every comment or status change</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="font-semibold text-textColor-base min-w-[140px]">Opt out:</span>
              <span className="text-textColor-muted">Reply <span className="font-mono font-semibold">STOP</span> at any time to stop receiving messages</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-textColor-muted">
          Need more help? Contact us at{' '}
          <a href="mailto:support@elifeamerica.com" className="text-primary-500 hover:underline font-medium">
            support@elifeamerica.com
          </a>
        </div>

      </div>
      <FooterBar />
    </div>
  )
}

type UserGuideCardProps = {
  reverse?: boolean
  stepNumber: number | string
  badgeText: string
  title: string
  description: string
  imageLightSrc: string
  imageDarkSrc: string
  imageAlt: string
}

function UserGuideCard({
  reverse,
  stepNumber,
  badgeText,
  title,
  description,
  imageDarkSrc,
  imageLightSrc,
  imageAlt,
}: UserGuideCardProps) {
  return (
    <div className={`flex flex-col md:flex-row ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} md:p-10 p-6 gap-6 md:gap-10 justify-between items-center bg-surface-primary rounded-[32px] shadow-sm`}>
      <div className='md:w-1/2 w-full'>
        <img src={imageLightSrc} alt={imageAlt} className='dark:hidden w-full h-full rounded-[28px] object-cover' />
        <img src={imageDarkSrc} alt={imageAlt} className='hidden dark:block w-full h-full rounded-[28px] object-cover' />
      </div>
      <div className='md:w-1/2 space-y-6'>
        <div className="flex gap-2 p-1 pr-4 w-fit justify-center items-center text-sm uppercase text-green-600 dark:text-green-400 font-medium rounded-full border border-green-500 ">
          <span className='h-6 w-6 flex justify-center items-center bg-green-500 text-white rounded-full'>
            {stepNumber}
          </span>
          {badgeText}
        </div>
        <div className='space-y-4'>
          <h1 className="text-2xl md:text-3xl font-bold text-textColor-base">{title}</h1>
          <p className="text-textColor-muted text-base md:text-lg leading-7">
            {description}
          </p>
          {
            stepNumber === 4 && 
            <div className='space-y-2'>
              <div className='py-2 px-4 bg-surface-secondary space-y-2 rounded-lg'>
                <p className='text-sm text-textColor-muted font-medium uppercase'>Format</p>
                <p className='text-textColor-base'><span className='text-primary-500'>@ticketID</span> your message here</p>
              </div>
              <p className='pl-2 text-xs font-medium text-textColor-muted'>Use the @ticketID format to reply with more info. Your agent is notified instantly.</p>
            </div>
          }

        </div>
      </div>
    </div>
  )
}
