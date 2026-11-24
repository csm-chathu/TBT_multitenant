import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        theme="colored"
        // inline style to ensure the container is fixed and sits above modal overlays
        style={{ position: 'fixed', top: 0, right: 0, zIndex: 2147483647, width: '520px' }}
        draggable
        pauseOnHover
      />
    </>
  )
}

export default ToastWrapper
