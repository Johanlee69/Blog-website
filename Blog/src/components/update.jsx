import React, { useContext, useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { Context } from '../context/Datacontext';
import { useNavigate, useParams } from 'react-router-dom';
import api, { baseURL } from '../utils/api';

const Update = () => {
    const { accountDetails } = useContext(Context);
    const navigate = useNavigate();
    const { postID } = useParams();
    const [post, setPost] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm();

    useEffect(() => {
        const fetchPostData = async () => {
            try {
                setLoading(true);
                const storedPost = sessionStorage.getItem("postToEdit");
                
                if (storedPost) {
                    const parsedPost = JSON.parse(storedPost);
                    setPost(parsedPost);
                    setValue("tittle", parsedPost.tittle);
                    setValue("Author", parsedPost.Author || accountDetails.username);
                    setValue("Description", parsedPost.Description);
                    
                    if (parsedPost.ImageCover) {
                        setImageSrc(`${baseURL}/${parsedPost.ImageCover}`);
                    }
                } else if (postID) {
                    const response = await api.get('/PostView');
                    const foundPost = response.data.posts.find(p => p._id === postID);
                    
                    if (foundPost) {
                        setPost(foundPost);
                        setValue("tittle", foundPost.tittle);
                        setValue("Author", foundPost.Author || accountDetails.username);
                        setValue("Description", foundPost.Description);
                        
                        if (foundPost.ImageCover) {
                            setImageSrc(`${baseURL}/${foundPost.ImageCover}`);
                        }
                        
                        sessionStorage.setItem("postToEdit", JSON.stringify(foundPost));
                    } else {
                        setError("Post not found");
                        setTimeout(() => navigate('/home'), 2000);
                    }
                } else {
                    setError("No post ID provided");
                    setTimeout(() => navigate('/home'), 2000);
                }
            } catch (error) {
                console.error("Error fetching post data:", error);
                setError("Error loading post data");
            } finally {
                setLoading(false);
            }
        };
        
        fetchPostData();
    }, [postID, navigate, setValue, accountDetails]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setValue("image", file);
            const reader = new FileReader();
            reader.onloadend = () => setImageSrc(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            
            const updateData = new FormData();
            updateData.append('postID', post._id);
            updateData.append('tittle', data.tittle);
            updateData.append('Author', data.Author);
            updateData.append('Description', data.Description);
            
            if (data.image) {
                updateData.append('Image', data.image);
            }
            
            const response = await api.put('/updatePost', updateData);
            
            sessionStorage.removeItem("postToEdit");
            
            alert("Post updated successfully!");
            navigate('/home');
        } catch (error) {
            console.error("Error updating post:", error);
            if (error.response && error.response.status === 403) {
                alert("You don't have permission to edit this post");
            } else {
                alert("Failed to update post. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
    }

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Update Post</h1>
            
            <form onSubmit={handleSubmit(onSubmit)} className="bg-green-100 p-5 rounded-xl shadow-lg">
                <div className="mb-4">
                    <label className="block font-bold text-xl mb-2">Title</label>
                    <input 
                        {...register('tittle', { required: "Please add a title" })} 
                        className="w-full border-b-2 p-2 rounded-xl outline-0 text-xl" 
                    />
                    {errors.tittle && <span className="text-red-600">{errors.tittle.message}</span>}
                </div>
                
                <div className="mb-4">
                    <label className="block font-bold text-xl mb-2">Author</label>
                    <input 
                        {...register('Author', { required: "Please add Author name" })} 
                        className="w-full border-b-2 p-2 rounded-xl outline-0 text-xl" 
                    />
                    {errors.Author && <span className="text-red-600">{errors.Author.message}</span>}
                </div>
                
                <div className="mb-4">
                    <label className="block font-bold text-xl mb-2">Description</label>
                    <textarea 
                        {...register('Description', { 
                            required: "Please add a Description",
                            maxLength: { value: 2000, message: "Must be under 2000 characters" } 
                        })} 
                        className="w-full border-2 p-2 rounded-xl outline-0 text-xl bg-white min-h-[200px]" 
                    />
                    {errors.Description && <span className="text-red-600">{errors.Description.message}</span>}
                </div>
                
                <div className="mb-4">
                    <label className="block font-bold text-xl mb-2">Image (Optional)</label>
                    <div className="border-2 rounded-xl p-2 bg-green-200">
                        <input 
                            type="file" 
                            accept="image/*" 
                            id="image" 
                            {...register('image')} 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />
                        <label htmlFor="image" className="cursor-pointer block">
                            {imageSrc ? (
                                <img src={imageSrc} alt="Preview" className="max-h-[300px] mx-auto object-contain rounded-xl" />
                            ) : (
                                <div className="h-[200px] flex items-center justify-center">
                                    Click to upload a new image
                                </div>
                            )}
                        </label>
                    </div>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="bg-green-500 px-4 py-2 rounded-xl hover:bg-green-600 disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? "Updating..." : "Update Post"}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => navigate('/home')} 
                        className="bg-gray-300 px-4 py-2 rounded-xl hover:bg-gray-400 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Update;