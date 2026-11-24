import avatarPlaceholder from "@/assets/Images/pngegg.png";
import { EditName } from "./components/EditName";
import { AddPhonenumber } from "./components/AddPhonenumber";
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getFullName, getDisplayEmail } from '@/lib/userUtils'

export const AccountSetting = () => {
    const { user, loading } = useCurrentUser()

    return (
        <>
        <div className="relative group h-24 w-24 rounded-full overflow-hidden" >
                {/* <button className="group-hover:opacity-100 opacity-0 h-1/2 w-full flex justify-center items-end pb-2 bg-black/20 backdrop-blur-md text-white font-medium text-sm absolute cursor-pointer">
                        Change
                </button>
                <button className="group-hover:opacity-100 opacity-0 h-1/2 w-full flex justify-center items-start pt-2 bg-black/20 backdrop-blur-md text-white font-medium text-sm absolute bottom-0 cursor-pointer">
                        Delete
                </button> */}
                <img src={user?.avatar || avatarPlaceholder} className="object-fill"/>
        </div>
            <div className="mt-4 mb-6">
                <h4 className="font-medium">{loading ? 'Loading...' : (getFullName(user) || '—')}</h4>
                <p className="text-sm text-textColor-muted">{loading ? '' : (getDisplayEmail(user) || '—')}</p>
            </div>
        <div className="p-5 rounded-md bg-surface-primary">
                <h3 className="mb-2 text-xl font-medium">Personal details</h3>
                <EditName fullName={getFullName(user)} />
                <AddPhonenumber phone={user?.mobile_number} />
        </div>
        </>
    )
}
