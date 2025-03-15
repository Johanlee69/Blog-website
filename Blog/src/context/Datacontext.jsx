import React, { createContext, useState, useEffect } from "react";
import api, { baseURL } from "../utils/api";

export const Context = createContext();

export const ContextProvider = ({ children }) => {
    const [accountDetails, setAccountDetails] = useState(() => {
        const saved = sessionStorage.getItem("accountDetails");
        return saved ? JSON.parse(saved) : {};
    });
    
    const [loggedIn, setLoggedIn] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [commentCounter, setCommentCounter] = useState({});

    useEffect(() => {
        if (Object.keys(accountDetails).length > 0) {
            sessionStorage.setItem("accountDetails", JSON.stringify(accountDetails));
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
    }, [accountDetails]);

    const CommentCountCollection = (postID, count) => {
        setCommentCounter(prev => ({
            ...prev,
            [postID]: count
        }));
    };

    const formatDateToText = (dateString) => {
        if (!dateString) return "Unknown date";
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const logout = () => {
        sessionStorage.removeItem("accountDetails");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("postdetails");
        setAccountDetails({});
        setLoggedIn(false);
    };

    return (
        <Context.Provider
            value={{
                accountDetails,
                setAccountDetails,
                loggedIn,
                setLoggedIn,
                baseURL,
                isLiked,
                setIsLiked,
                commentCounter,
                setCommentCounter,
                CommentCountCollection,
                formatDateToText,
                logout
            }}
        >
            {children}
        </Context.Provider>
    );
};

export default ContextProvider;