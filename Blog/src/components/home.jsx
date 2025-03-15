import React, { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Context } from '../context/Datacontext'
import { useNavigate } from 'react-router'
import Like_And_Comment from './like_comment'
import api, { baseURL } from '../utils/api'

function HomePage() {
  const [showCreate, setshowCreate] = useState(false)
  const [theposts, setposts] = useState([])
  const [loading, setLoading] = useState(true)

  const {
    accountDetails,
    CommentCountCollection,
    formatDateToText
  } = useContext(Context)

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting, } } = useForm()
  const Navigate = useNavigate()

  const handlePostCreation = () => {
    showCreate ? setshowCreate(false) : setshowCreate(true)
    reset();
  }

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/PostView');
      setposts(res.data.posts)
      for (const post of res.data.posts) {
        try {
          const commentsRes = await api.post('/ViewComments', { ID: post._id });
          if (commentsRes.data && commentsRes.data.comments) {
            CommentCountCollection(post._id, commentsRes.data.comments.length);
          }
        } catch (error) {
          console.error(`Error fetching comments for post ${post._id}:`, error);
        }
      }
    }
    catch (error) {
      console.error("Error fetching posts:", error);
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, [])

  const onSubmit = async (data) => {
    try {
      const Postdata = new FormData();
      Postdata.append('username', accountDetails.username)
      Postdata.append('tittle', data.tittle)
      Postdata.append('Author', data.Author)
      Postdata.append('Description', data.Description)
      Postdata.append('Image', data.image)

      await api.post('/Post', Postdata)
      fetchPosts();
      setImageSrc(null)
      handlePostCreation();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  }

  const [imageSrc, setImageSrc] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImageSrc(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handlePostClick = (data) => {
    sessionStorage.setItem("postdetails", JSON.stringify(data));
    Navigate(`/posts/${data._id}`);
  }

  return (
    <>
      <div className='bg-green-200'>
        <div className='flex justify-center'>
          {showCreate ? <div className='create-post bg-green-100 fixed rounded-2xl border-2 '>
            <div className='relative m-2 p-2' style={{ height: '80vh' }}>
              <div className='flex justify-between'>
                <span>Create new post</span>
                <div type="button" onClick={handlePostCreation} className='bg-green-800 p-1 rounded-xl w-8 flex justify-center cursor-pointer hover:bg-green-950'>X</div>
              </div>
              <div >
                <form action="submit" onSubmit={handleSubmit(onSubmit)} className='flex flex-col' >
                  <div className='flex flex-col relative'>
                    <span className='font-bold text-xl'>Author</span>
                    <input autoComplete='off'{...register('Author', { required: "Please add Author name", maxLength: { value: 20, message: "Length must be under 20" } })} placeholder='Author name' className='w-10/12 border-b-2 outline-0 text-xl' defaultValue={accountDetails.username} />
                    {errors.Author && <span className='error_msg absolute left-20 text-red-600 bg-green-300 flex justify-center rounded-2xl mb-2'>! {errors.Author.message}</span>}
                  </div>
                  <div className='flex flex-col relative'>
                    <span className='font-bold text-xl mt-2'>Tittle</span>
                    <input autoComplete='off' {...register('tittle', { required: "Please add a tittle", maxLength: 100 })} placeholder='what is your tittle' className='w-10/12 border-b-2 outline-0 text-xl' />
                    {errors.tittle && <span className='error_msg absolute left-20  text-red-600 bg-green-300 w-50 flex justify-center rounded-2xl mt-2 '>! {errors.tittle.message}</span>}
                  </div>
                  <div className='flex flex-col relative'>
                    <span className='font-bold text-xl mt-2'>Description</span>
                    <textarea type='text' {...register('Description', { required: "Please add a Description", maxLength: { value: 2000, message: "must be under 500 characters (Space also counts as a character)" } })} placeholder='what is your Description' className='w-10/12 border-2 rounded-xl outline-0 text-xl bg-white' style={{ height: '20vh' }} />
                    {errors.Description && (<span className='error_msg absolute left-20 text-red-600 bg-green-300 w-50 flex justify-center rounded-2xl mt-2 p-2'>! {errors.Description.message}</span>)}
                  </div>

                  <div>
                    <span className='font-bold text-xl mt-2'>Upload image</span>
                    <div className='impage-upload border-2 rounded-2xl flex justify-center cursor-pointer bg-green-300'>
                      <input accept='image/*' id='image' type='file'{...register('image')} className='text-xl outline-0 hidden' onChange={handleFileChange} />
                      <label htmlFor="image" className='flex items-center '>{imageSrc ? <img src={imageSrc} alt="imageloader" className='w-screen h-full  object-cover rounded-xl' /> : 'Choose a file to Upload'}</label>
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className='w-23 rounded-xl p-2 m-2 cursor-pointer absolute bottom-0 '>Submit</button>

                </form>
              </div>
            </div>
          </div> : null}
        </div>
        <div className='flex justify-between items-center'>
          <div className='p-2 '>Available posts</div>
          <button type="button" onClick={handlePostCreation} className='p-2 rounded-xl m-2 cursor-pointer '>Create posts</button>
        </div>
      </div>
      <div className='p-3'>
        {loading ? (
          <div className='flex items-center justify-center p-4'>
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0e/SDLG_Compact_Wheel_Loaders.png" width={30} alt="loader" className="animate-spin mr-2" />
            <span>Loading posts...</span>
          </div>
        ) : theposts.length === 0 ? (
          <div className='flex justify-center p-4'>
            <span>No posts available at the moment</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
            {theposts.map((post, index) => (
              <div key={index} onClick={() => handlePostClick(post)} className='card flex flex-col w-full h-96 cursor-pointer border border-gray-200 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden'>
                {/* Image Section */}
                <div className='h-40 w-full overflow-hidden'>
                  {post.ImageCover ? (
                    <img src={`${baseURL}/${post.ImageCover}`} className='w-full h-full object-cover' alt="Post" />
                  ) : (
                    <img src='https://png.pngtree.com/png-vector/20210604/ourmid/pngtree-gray-network-placeholder-png-image_3416659.jpg' className='w-full h-full object-cover' alt="Post" />
                  )}
                </div>
                
                {/* Content Section */}
                <div className='flex-grow p-4 flex flex-col'>
                  <h2 className='text-xl font-bold mb-2 line-clamp-1'>{post.tittle}</h2>
                  <p className='text-gray-700 mb-4 overflow-hidden line-clamp-3'>{post.Description}</p>
                  
                  {/* Footer Section */}
                  <div className='mt-auto flex justify-between items-center'>
                    <div className='pointer-events-none'>
                      <Like_And_Comment postId={String(post._id)} disableClick={true} />
                    </div>
                    <div className='text-sm text-gray-500'>
                      {formatDateToText(post.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default HomePage
