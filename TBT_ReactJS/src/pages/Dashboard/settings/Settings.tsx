import { cn } from '@/lib/utils';
import { Link, Outlet, useLocation } from 'react-router-dom'

interface SettingLinks {
    title: string;
    path: string;
}
export const Settings = () => {
    const location = useLocation();
    const pathname = location.pathname; // e.g., "/products/electronics/laptop"
    // Split the pathname and get the last non-empty segment
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const lastPathSegment = pathSegments.pop();

    const settingLinks: SettingLinks[] = [
        { title: 'Account', path: 'account' },
        { title: 'Security', path: 'security' },
        { title: 'Database', path: 'database' },
        // { title: 'Notification', path: 'notification' },
        // { title: 'Terms', path: '/terms' },
    ]
  return (
    <>
        <div className='max-w-7xl mx-auto min-h-screen md:mt-6 grid grid-cols-12 gap-4 mb-4'>
            <ul className='col-span-3 space-y-3'>
                {settingLinks.map((link, index) => (
                    <li key={index} >
                        <Link to={link.path}  className={cn(
                            "block text-base font-semibold text-textColor-muted",
                                lastPathSegment === link.path && "text-textColor-base"
                            )}>
                                {link.title}
                        </Link>
                    </li>
                ))} 
            </ul>
            <div className='col-span-6'>
                <Outlet/>
            </div>
        </div>
    </>
  )
}
