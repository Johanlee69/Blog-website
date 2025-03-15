import React, { useContext } from 'react'
import { Context } from '../context/Datacontext'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import api from '../utils/api'

function Nav() {
  const { accountDetails, logout } = useContext(Context)
  const Navigate = useNavigate()
  
  const handleLogout = async () => {
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/logout', {
          username: accountDetails.username,
          refreshToken: refreshToken
        });
      }
      logout(); 
      Navigate('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      logout();
      Navigate('/login');
    }
  }

  return (
    <nav className='flex justify-between items-center p-2 bg-green-200'>
      <div className='flex gap-3'>
        <Link to='/home'><img src="https://cdn.logojoy.com/wp-content/uploads/2018/05/30164225/572-768x591.png" alt="logo" width={50} className='rounded-full' /></Link>
      </div>
      <div className='flex gap-3 items-center'>
        {accountDetails.Name && (
          <span className='text-xl'>Welcome! {accountDetails.Name}</span>
        )}
        <button onClick={handleLogout} className='p-2 rounded-xl cursor-pointer'>Logout</button>
      </div>
    </nav>
  )
}

export default Nav
