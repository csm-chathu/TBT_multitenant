import type React from "react"
import Button from "../../../components/Atomic/Button"
import UserAvatar from "../../../components/Molecules/ui/UserAvatar"

const UserProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textColor-base">User Profile</h1>
        <p className="text-textColor-muted">Manage your account settings and preferences</p>
      </div>

      <div className="bg-surface-primary rounded-lg shadow-sm  p-6">
        <div className="flex items-center space-x-6 mb-6">
          <UserAvatar name="Ronald" background="#f97316" className="h-20 w-20" />
          <div>
            <h2 className="text-xl font-semibold text-textColor-base">Ronald Smith</h2>
            <p className="text-textColor-muted">Administrator</p>
            <p className="text-sm text-textColor-muted">ronald.smith@company.com</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-textColor-base mb-2">Full Name</label>
            <input
              type="text"
              defaultValue="Ronald Smith"
              className="w-full px-3 py-2 border border-borderColor-secondary bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textColor-base mb-2">Email</label>
            <input
              type="email"
              defaultValue="ronald.smith@company.com"
              className="w-full px-3 py-2 border border-borderColor-secondary bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textColor-base mb-2">Phone</label>
            <input
              type="tel"
              defaultValue="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-borderColor-secondary bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-textColor-base mb-2">Department</label>
            <select className="w-full px-3 py-2 border border-borderColor-secondary bg-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option>Administration</option>
              <option>Technical Support</option>
              <option>Customer Service</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button style="Tertiary" text="Cancel" />
          <Button text="Save Changes" />
        </div>
      </div>
    </div>
  )
}

export default UserProfile
