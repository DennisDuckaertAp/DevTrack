"use client"

import type React from "react"

import { useEffect, useState } from "react"
import type { GetServerSideProps } from "next"
import type { Post, PostWithFormattedDate } from "../../types"
import Image from "next/image"
import Link from "next/link"
import { Search, Code, BookOpen, Server, Coffee, Plus, X, Menu, AlertCircle, CheckCircle } from "lucide-react"
import { getCookie } from "cookies-next"

interface PostsProps {
  posts: PostWithFormattedDate[]
}

export const getServerSideProps: GetServerSideProps<PostsProps> = async (context) => {
  const host = context.req.headers.host || "localhost:3000"
  const protocol = context.req.headers["x-forwarded-proto"] || "http"
  const apiUrl = `${protocol}://${host}/api/mongodb`

  let posts: PostWithFormattedDate[] = []

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Cookie: context.req.headers.cookie || "",
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const { posts: fetchedPosts } = await res.json()
    posts = fetchedPosts.map((post: Post) => {
      const createdAtDate = new Date(post.createdAt)
      const formattedDate = createdAtDate.toLocaleDateString("en-GB")
      const formattedTime = createdAtDate.toLocaleTimeString("en-GB", { hour12: false })

      return {
        ...post,
        createdAt: {
          date: formattedDate,
          time: formattedTime,
        },
      }
    })
  } catch (error) {
    console.error("Error fetching posts:", error)
  }

  console.log("Fetched posts:", posts)

  return {
    props: {
      posts,
    },
  }
}

const Posts = ({ posts: initialPosts }: PostsProps) => {
  const [posts, setPosts] = useState<PostWithFormattedDate[]>(initialPosts)
  const [newPost, setNewPost] = useState({ title: "", content: "", imageUrl: "", category: "" })
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const authToken = getCookie("auth_token")
    setIsAdmin(authToken === process.env.NEXT_PUBLIC_BEARER_TOKEN)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    setError(null)

    const missingFields = []
    if (!newPost.title) missingFields.push("Title")
    if (!newPost.content) missingFields.push("Content")
    if (!newPost.category) missingFields.push("Category")

    if (missingFields.length > 0) {
      setError(`Please fill in the following fields: ${missingFields.join(", ")}.`)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/mongodb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPost),
      })

      if (response.ok) {
        const createdPostResponse = await response.json()
        const createdPost = createdPostResponse.post

        const createdAtDate = new Date(createdPost.createdAt)
        const formattedPost: PostWithFormattedDate = {
          ...createdPost,
          createdAt: {
            date: createdAtDate.toLocaleDateString("en-GB"),
            time: createdAtDate.toLocaleTimeString("en-GB", { hour12: false }),
          },
        }

        setPosts((prevPosts) => [formattedPost, ...prevPosts])
        setSubmitStatus("success")
        setTimeout(() => {
          setIsCreating(false)
          setNewPost({ title: "", content: "", imageUrl: "", category: "" })
          setSubmitStatus("idle")
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to create post.")
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error submitting post:", error)
      setError("An unexpected error occurred.")
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPosts = posts.filter(
    (post) =>
      (selectedCategory === "All" || post.category === selectedCategory) &&
      (post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const categories = ["All", "Frontend", "Backend", "DevOps", "Learning"]

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <header className="md:hidden bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">DevTrack</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          <Menu size={24} />
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`w-full md:w-64 bg-gray-800 p-6 ${isMobileMenuOpen ? "block" : "hidden"} md:block`}>
        <div className="mb-8 hidden md:block">
          <h1 className="text-2xl font-bold mb-2">DevTrack</h1>
          <p className="text-sm text-gray-400">My Internship Journey</p>
        </div>
        <nav>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category}>
                <button
                  onClick={() => {
                    setSelectedCategory(category)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full text-left py-2 px-4 rounded ${
                    selectedCategory === category ? "bg-blue-600" : "hover:bg-gray-700"
                  }`}
                >
                  {category === "Frontend" && <Code className="inline mr-2" size={18} />}
                  {category === "Backend" && <Server className="inline mr-2" size={18} />}
                  {category === "DevOps" && <Coffee className="inline mr-2" size={18} />}
                  {category === "Learning" && <BookOpen className="inline mr-2" size={18} />}
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto bg-gray-700 text-white px-4 py-2 pl-10 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            {isAdmin && (
              <button
                onClick={() => {
                  setIsCreating(true)
                  setError(null)
                }}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center justify-center"
              >
                <Plus size={18} className="mr-2" /> New Post
              </button>
            )}
          </div>

          {/* Post creation modal */}
          {isCreating && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Create New Post</h2>
                  <button
                    onClick={() => {
                      setIsCreating(false)
                      setError(null)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>
                {error && (
                  <div className="mb-4 p-3 bg-red-500 text-white rounded-md flex items-center">
                    <AlertCircle className="mr-2" size={20} />
                    {error}
                  </div>
                )}
                {submitStatus === "success" && (
                  <div className="mb-4 p-3 bg-green-500 text-white rounded-md flex items-center">
                    <CheckCircle className="mr-2" size={20} />
                    Post created successfully!
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    placeholder="Post Title"
                    className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    placeholder="What did you learn today? Share your progress!"
                    rows={4}
                    className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    value={newPost.imageUrl}
                    onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                    placeholder="Image URL (optional)"
                    className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter((cat) => cat !== "All")
                      .map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full p-3 rounded-lg transition duration-300 ${
                      isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {isSubmitting ? "Creating Post..." : "Create Post"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Posts grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link href={`/post/${post._id}`} key={post._id} className="block group">
                <article className="bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full transition-transform duration-300 group-hover:transform group-hover:scale-[1.02]">
                  {post.imageUrl && (
                    <div className="relative h-48">
                      <Image
                        src={post.imageUrl || "/placeholder.svg"}
                        alt={post.title}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>
                  )}
                  <div className="p-6 h-full flex flex-col">
                    <h3 className="text-xl font-bold text-blue-400 mb-2 group-hover:text-blue-300 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-gray-300 mb-4 line-clamp-3 flex-grow">{post.content}</p>
                    <div className="flex justify-between items-center text-sm text-gray-400 mt-auto">
                      <span>{post.createdAt.date}</span>
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs text-white">{post.category}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Posts

