import LogoLight from "@/assets/Images/Logo-Light.png"
import LogoDark from "@/assets/Images/Logo-Dark.png"
import { Mail, MapPin } from "lucide-react"

export const Footer = () => {
  return (
    <div className="bg-secondary-500" id="contact">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-12 flex flex-row justify-between gap-4">
            <div className="md:w-4/12 space-y-4">
                <img src={LogoLight} alt="TBT Logo" className="h-10 w-auto dark:hidden"/>
                <img src={LogoDark} alt="TBT Logo" className="h-10 w-auto hidden dark:block"/>
                <p className="text-textColor-muted">eLife America strives to be a trusted and forward-thinking IT platform. We provide consultation and powerful software applications to companies that are shifting to a more online-based business strategy.</p>
            </div>
            <div className="md:w-3/12 space-y-4">
                <h3 className="text-2xl text-textColor-inverted font-bold">Contact Us</h3>
                <ul className="space-y-4">
                    {/* <li>
                        <a href="tel:+16262098347" className="text-textColor-inverted text-xl flex">
                            <MessageSquare className="text-textColor-inverted mr-2"/>
                             <p>+1 626 209 8347</p>
                        </a>
                    </li> */}
                    
                    <li>
                        <a href="tel:+16262098347" className="text-textColor-inverted  flex">
                            <MapPin className="text-textColor-inverted  mr-2"/>
                            <p>910 S Sunset Ave Suite # 1,<br /> West Covina CA 91790, LA, USA</p>
                        </a>
                    </li>

                    <li>
                        <a href="mailto:info@elifeamerica.com" className="text-textColor-inverted  flex">
                            <Mail className="text-textColor-inverted  mr-2"/>
                            <p>info@elifeamerica.com</p>
                        </a>
                    </li>
                </ul>
            </div>

            <div className="md:w-3/12 space-y-4">
                <h3 className="text-2xl text-textColor-inverted font-bold">Quick Links</h3>
                <ul className="space-y-4">
                    <li><a href="#" className="text-lg text-textColor-inverted hover:text-primary-500">Home</a></li>
                    <li><a href="/create-ticket" className="text-lg text-textColor-inverted hover:text-primary-500">Submit Support Ticket</a></li>
                    <li><a href="#features" className="text-lg text-textColor-inverted hover:text-primary-500">Features</a></li>
                    <li><a href="#how-it-works" className="text-lg text-textColor-inverted hover:text-primary-500">How It Works</a></li>
                    <li><a href="/terms" className="text-lg text-textColor-inverted hover:text-primary-500">Terms & Conditions</a></li>
                    <li><a href="/privacy" className="text-lg text-textColor-inverted hover:text-primary-500">Privacy Policy</a></li>
                </ul>
            </div>
        </div>

        <div className="border-t border-borderColor-secondary">
            <p className="text-center text-textColor-inverted py-4">Copyright © 2025 All rights reserved | Powered by eLife America</p>
        </div>
    </div>
  )
}
