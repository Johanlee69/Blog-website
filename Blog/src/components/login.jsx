import { React, useContext, useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import { Context } from '../context/Datacontext'
import { useNavigate } from 'react-router'
import api from '../utils/api'

function Login() {
    const [newUser, setnewUser] = useState(true)
    const [serverError, setServerError] = useState("")
    const {
        register,
        handleSubmit,
        reset,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm()

    const { setAccountDetails, loggedIn, baseURL } = useContext(Context)
    const Navigate = useNavigate()

    const onSubmit = async (data) => {
        try {
            setServerError("")
            clearErrors()

            if (newUser) {
                await api.post("/SignUP", data)
                alert("Account created successfully!")
                setnewUser(false)
                reset()
            }
            else {
                const response = await api.post("/Login", data)
                sessionStorage.setItem('token', response.data.accessToken)
                sessionStorage.setItem('refreshToken', response.data.refreshToken)
                
                const userDetails = {
                    username: response.data.username,
                    Name: response.data.Name
                }
                sessionStorage.setItem('accountDetails', JSON.stringify(userDetails))
                setAccountDetails(userDetails)
                Navigate('/home')
                reset()
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status
                const message = error.response.data.message

                if (status === 400) {
                    setError("username", {
                        type: "server",
                        message: message
                    })
                }
                else if (status === 401) {
                    if (message.includes("password")) {
                        setError("password", {
                            type: "server",
                            message: message
                        })
                    } else {
                        setError("username", {
                            type: "server",
                            message: message
                        })
                    }
                }
                else {
                    setServerError(message)
                }
            } else {
                setServerError("Connection error. Please try again.")
            }
        }
    }

    useEffect(() => {
        if (loggedIn) {
            Navigate('/home')
        }
    }, [loggedIn, Navigate])

    const ToggleAcc_btn = () => {
        setnewUser(!newUser)
        setServerError("")
        clearErrors()
        reset()
    }

    return (
        <>
            <div className='login flex justify-center items-center h-screen'>
                <form onSubmit={handleSubmit(onSubmit)} className='Accounts flex justify-center items-center gap-3 flex-col border-2 rounded-2xl bg-green-200 p-5'>
                    <img src="https://cdn.logojoy.com/wp-content/uploads/2018/05/30164225/572-768x591.png" alt="logo.png" width={100} className='rounded-full' />

                    {serverError && <div className='text-red-600 bg-red-100 p-2 rounded-xl w-full text-center'>{serverError}</div>}

                    {newUser && (
                        <div className='w-full'>
                            <input
                                placeholder='Name'
                                {...register("Name", {
                                    required: "Name is required"
                                })}
                                className='username border-2 p-2 rounded-2xl bg-white w-full'
                            />
                            {errors.Name && <span className='text-red-600 text-sm flex justify-center m-2'>{errors.Name.message}</span>}
                        </div>
                    )}

                    <div className='w-full'>
                        <input
                            placeholder='Username'
                            {...register("username", {
                                required: "Username is required"
                            })}
                            className='username border-2 p-2 rounded-2xl bg-white w-full'
                        />
                        {errors.username && <span className='text-red-600 text-sm flex justify-center m-2'>{errors.username.message}</span>}
                    </div>

                    <div className='w-full'>
                        <input
                            placeholder='Password'
                            type='password'
                            {...register("password", {
                                required: "Password is required",
                                maxLength: { value: 10, message: "Password must be at most 10 characters" },
                                minLength: { value: 5, message: "Password must be at least 5 characters" }
                            })}
                            className='username border-2 p-2 rounded-2xl bg-white w-full'
                        />
                        {errors.password && <span className='text-red-600 text-sm flex justify-center mt-2'>{errors.password.message}</span>}
                    </div>

                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className='login-btn border-1 p-2 rounded-2xl cursor-pointer bg-green-500 hover:bg-green-600 '
                    >
                        {newUser ? "Sign Up" : "Log In"}
                    </button>

                    <button
                        onClick={ToggleAcc_btn}
                        type='button'
                        className='border-1 border-green-800 p-2 rounded-2xl cursor-pointer hover:bg-green-300 '
                    >
                        {newUser ? "Already have an account?" : "Create new account"}
                    </button>
                </form>
            </div>
        </>
    )
}

export default Login
