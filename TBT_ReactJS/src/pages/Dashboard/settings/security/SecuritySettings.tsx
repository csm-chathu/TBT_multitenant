
import { EditPassword } from './components/EditPassword'
// import { AddTwoFactor } from './components/AddTwoFactor'

export const SecuritySettings = () => {

  return (
    <div className="p-5 rounded-md bg-surface-primary">
      <h3 className="mb-2 text-xl font-medium">Security</h3>
      <EditPassword/>
      {/* <AddTwoFactor/> */}
    </div>
  )
}
