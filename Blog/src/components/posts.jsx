import React, { useContext, useEffect, useState } from 'react';
import { Context } from '../context/Datacontext';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router';
import Like_And_Comment from './like_comment';
import api, { baseURL } from '../utils/api';

function Posts() {
    const { accountDetails, setCommentCounter, CommentCountCollection, formatDateToText } = useContext(Context);
    const { postID } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [post, setPost] = useState(() => {
        const savedPost = sessionStorage.getItem("postdetails");
        return savedPost ? JSON.parse(savedPost) : null;
    });

    const [RenderComments, SetComments] = useState([]);

    const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();
    const Commenting = watch('comment');

    useEffect(() => {
        if (!post && postID) {
            setLoading(true);
            const fetchPostById = async () => {
                try {
                    // Get all posts and find the one with matching ID
                    const response = await api.get('/PostView');
                    const foundPost = response.data.posts.find(p => p._id === postID);
                    
                    if (foundPost) {
                        setPost(foundPost);
                        sessionStorage.setItem("postdetails", JSON.stringify(foundPost));
                    } else {
                        navigate('/home');
                    }
                } catch (error) {
                    console.error("Error:", error);
                    navigate('/home');
                } finally {
                    setLoading(false);
                }
            };
            fetchPostById();
        }
    }, [postID, navigate, post]);

    const fetchComments = async () => {
        try {
            if (!postID) {
                console.error("No post ID available for fetching comments");
                return;
            }
            
            const res = await api.post('/ViewComments', { ID: String(postID) });

            if (res.data && res.data.comments) {
                CommentCountCollection(String(postID), res.data.comments.length);
                SetComments(res.data.comments);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        if (postID) fetchComments();
    }, [postID]);
    
    const onSubmit = async (d) => {
        try {
            if (!post || !post._id) {
                console.error("No post ID available for commenting");
                return;
            }
            
            const newComment = {
                postedby: accountDetails.username,
                comments: d.comment,
                postID: String(post._id)
            };
            const response = await api.post('/postComment', newComment);
            reset();
            fetchComments();
        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const handleEdit = () => {
        sessionStorage.setItem("postToEdit", JSON.stringify(post));
        navigate(`/update/${post._id}`);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!post) {
        return <div className="error">Post not found</div>;
    }

    return (
        <div className="post-container bg-white rounded-xl shadow-xl p-6 mb-8">
            <div className="post-header">
                <h2>{post.tittle}</h2>
                <p className="post-meta">Posted by {post.username} on {formatDateToText(post.created_at)}</p>
                {accountDetails && (accountDetails.username === post.username || accountDetails.isAdmin) && (
                    <button className="edit-button" onClick={handleEdit}>Edit Post</button>
                )}
            </div>
            <div className="post-content">
                <p>{post.Description}</p>
                {post.ImageCover && (
                    <div className="post-image">
                        <img src={`${baseURL}/${post.ImageCover}`} alt="Post" />
                    </div>
                )}
            </div>
            <Like_And_Comment postId={String(post._id)} />
            <div className="comments-section border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-xl font-semibold mb-4">Comments</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="mb-6">
                    <textarea
                        {...register('comment', { required: true })}
                        placeholder="Add a comment..."
                        className="comment-input w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                    {errors.comment && <span className="error text-red-500 block mt-1">Comment is required</span>}
                    <button
                        type="submit"
                        disabled={!Commenting || isSubmitting}
                        className="comment-button mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
                <div className="comments-list space-y-4">
                    {RenderComments.length > 0 ? (
                        RenderComments.map((comment, index) => (
                            <div key={index} className="comment bg-gray-50 p-4 rounded-lg">
                                <div className='flex gap-2 items-center'>
                                <img src="https://www.freeiconspng.com/uploads/account-profile-icon-2.png" alt="userAvater" className='rounded-full bg-green-300' width={'30px'} />
                                <p className="comment-author font-semibold">{comment.postedby}</p>
                                </div>
                                <p className="comment-text mt-2 text-gray-700">{comment.comments}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No comments yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Posts;
