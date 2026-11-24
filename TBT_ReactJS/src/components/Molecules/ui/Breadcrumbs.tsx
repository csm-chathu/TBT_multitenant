import { Link, useLocation } from 'react-router-dom'

const Breadcrumbs = () => {

   const {pathname} = useLocation();
   const pathnames = pathname.split('/').filter((x) => x);
   
  // Segments to skip in breadcrumb display
  const segmentsToSkip = ['details', 'edit'];

  // Map route names to display names
  const getDisplayName = (name: string) => {
    const routeMap: Record<string, string> = {
      'dashboard': 'Dashboard',
      'applications': 'Applications',
      'tickets': 'Tickets',
      'agents': 'Agents',
      'customers': 'Customers',
      'team': 'Team',
      'add': 'Add',
      'edit': 'Edit',
      'details': 'Details',
      'inventory': 'Inventory',
      'brands': 'Brands',
      'items': 'Items',
      'category': 'Category',
      'locations': 'Locations',
      'messages': 'Messages',
      'profile': 'Profile',
      'overview': 'Overview'
    };
    return routeMap[name] || name;
  };

  // Filter out segments to skip and build breadcrumb items
  let breadcrumbPath = '';
  const breadcrumbItems = pathnames
    .map((name, index) => {
      breadcrumbPath += `/${name}`;
      return {
        name,
        path: breadcrumbPath,
        isLast: index === pathnames.length - 1,
        shouldSkip: segmentsToSkip.includes(name)
      };
    })
    .filter(item => !item.shouldSkip);

  return (
    <div className='text-sm text-info-500 capitalize font-medium truncate min-w-0'>
        <Link to='/' className=" hover:underline">Home</Link>
        {breadcrumbItems.map((item, index)=>{
            const isLast = index === breadcrumbItems.length - 1;
            const displayName = getDisplayName(item.name);
            return isLast? <span key={index} className="text-textColor-muted"> / {displayName}</span> : (
                <span key={index}>
                    {' / '}
                    <Link to={item.path} className="hover:underline">
                        {displayName}
                    </Link>
                </span>
            )
        })}
    </div>
  )
}

export default Breadcrumbs