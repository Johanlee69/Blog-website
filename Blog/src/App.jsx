import { useContext, useEffect } from 'react'
import './App.css'
import AccLogin from './components/login'
import HomePage from './components/home'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Context } from './context/Datacontext'
import Posts from './components/posts'
import Nav from './components/nav'
import Update from './components/update'

function RedirectHandler() {
  const { loggedIn } = useContext(Context);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loggedIn && 
        location.pathname === '/' && 
        !location.pathname.startsWith('/home') && 
        !location.pathname.startsWith('/posts/') && 
        !location.pathname.startsWith('/update/')) {
      navigate('/home');
    }
  }, [location, loggedIn, navigate]);

  return null;
}

function App() {
  const { loggedIn, setLoggedIn, setAccountDetails } = useContext(Context)

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const accountDetailsStr = sessionStorage.getItem('accountDetails');
    
    if (token && accountDetailsStr) {
      try {
        const accountDetails = JSON.parse(accountDetailsStr);
        setAccountDetails(accountDetails);
        setLoggedIn(true);
      } catch (error) {
        console.error("Error parsing account details:", error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('accountDetails');
      }
    }
  }, [setLoggedIn, setAccountDetails]);

  return (
    <BrowserRouter>
      {loggedIn && <Nav />}
      <RedirectHandler />
      <Routes>
        <Route path="/" element={<Navigate to={loggedIn ? '/home' : '/login'} />} />
        <Route path="/login" element={loggedIn ? <Navigate to='/home' /> : <AccLogin />} />
        <Route path="/home" element={loggedIn ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/update/:postID" element={loggedIn ? <Update /> : <Navigate to="/login" />} />
        <Route path="/posts/:postID" element={loggedIn ? <Posts /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={loggedIn ? '/home' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
