import React, { useContext, useEffect, useState } from "react";
import { Context } from "../context/Datacontext";
import { useParams } from "react-router-dom";
import api from "../utils/api";

const Like_And_Comment = ({ postId, disableClick = false }) => {
    const { accountDetails, isLiked, setIsLiked, commentCounter } = useContext(Context);
    const { postID } = useParams();
    const currentPostId = postId || postID;
    const [likeCount, setLikeCount] = useState(0);

    useEffect(() => {
        if (currentPostId && accountDetails?.username) {
            checkIfLiked();
        }
    }, [currentPostId, accountDetails]);

    const checkIfLiked = async () => {
        try {
            if (!currentPostId) {
                console.error("No post ID available for like check");
                return;
            }
            
            const response = await api.post('/getLikes', {
                username: accountDetails.username,
                postID: String(currentPostId)
            });
            setIsLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error("Error checking like status:", error);
        }
    };

    const handleToggleLiked = async (e) => {
        if (disableClick) {
            e.stopPropagation();
            return;
        }
        
        try {
            if (!accountDetails?.username) {
                alert("Please login to like posts");
                return;
            }
            if (!currentPostId) {
                console.error("No post ID available for like toggle");
                return;
            }

            const response = await api.post('/Liked', {
                username: accountDetails.username,
                postID: String(currentPostId)
            });

            setIsLiked(response.data.liked);
            setLikeCount(response.data.likeCount);
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    // Use a more compact layout if this is in a card
    if (disableClick) {
        return (
            <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center">
                    <span className="mr-1">{isLiked ? '❤️' : '🤍'}</span>
                    <span>{likeCount}</span>
                </div>
                <div className="flex items-center">
                    <span className="mr-1">💬</span>
                    <span>{commentCounter && commentCounter[currentPostId] ? commentCounter[currentPostId] : 0}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="like-comment-container">
            <button 
                className={`like-button ${isLiked ? 'liked' : ''}`} 
                onClick={handleToggleLiked}
            >
                {isLiked ? '❤️' : '🤍'} {likeCount} Likes
            </button>
            <div className="comment-count">
                {commentCounter && commentCounter[currentPostId] ? commentCounter[currentPostId] : 0} Comments
            </div>
        </div>
    );
};

export default Like_And_Comment;