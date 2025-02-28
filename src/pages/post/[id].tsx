"use client"

import type { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import type { Post } from "../../../types"
import Image from "next/image"
import { ArrowLeft, Calendar, Tag, Clock, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import toast, { Toaster } from "react-hot-toast"

interface PostPageProps {
  post: Post
}

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (context) => {
  const { id } = context.params!
  const host = context.req.headers.host || "localhost:3000"
  const protocol = context.req.headers["x-forwarded-proto"] || "http"
  const apiUrl = `${protocol}://${host}/api/mongodb?id=${id}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Cookie: context.req.headers.cookie || "",
      },
    })
    const data = await res.json()

    if (!res.ok || !data.post) {
      console.error("Failed to fetch post or post not found:", data.message)
      return { notFound: true }
    }

    return {
      props: {
        post: data.post,
      },
    }
  } catch (error) {
    console.error("Error fetching post:", error)
    return { notFound: true }
  }
}

const PostPage = ({ post }: PostPageProps) => {
  const router = useRouter()
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const formattedTime = new Date(post.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out this post: ${post.title}`)
    const url = encodeURIComponent(`${window.location.origin}/post/${post._id}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank")
  }

  const shareOnFacebook = () => {
    const url = encodeURIComponent(`${window.location.origin}/post/${post._id}`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank")
  }

  const copyLink = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/post/${post._id}`)
      .then(() => toast.success("Link copied to clipboard! 🎉"))
      .catch(() => toast.error("Failed to copy link ❌"))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors mb-8">
          <ArrowLeft size={20} className="mr-2" />
          Back to all posts
        </Link>

        <article className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {post.imageUrl && (
            <div className="relative w-full h-80 cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
              <Image
                src={post.imageUrl || "/placeholder.svg"}
                alt={post.title}
                layout="fill"
                objectFit="cover"
                priority
                className="w-full"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="inline-flex items-center bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                <Tag size={14} className="mr-1" />
                {post.category}
              </span>
              <span className="inline-flex items-center text-gray-400 text-sm">
                <Calendar size={14} className="mr-1" />
                {formattedDate}
              </span>
              <span className="inline-flex items-center text-gray-400 text-sm">
                <Clock size={14} className="mr-1" />
                {formattedTime}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-blue-400 mb-6">{post.title}</h1>

            <div className="prose prose-lg prose-invert max-w-none">
              {post.content.split("\n").map((paragraph, index) =>
                paragraph ? (
                  <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                    {paragraph}
                  </p>
                ) : (
                  <br key={index} />
                ),
              )}
            </div>
          </div>
        </article>

        <div className="mt-8 border-t border-gray-700 pt-8">
          <h2 className="text-xl font-semibold mb-4">Share this post</h2>
          <div className="flex gap-4">
            <button
              onClick={shareOnTwitter}
              className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Twitter
            </button>
            <button
              onClick={shareOnFacebook}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Facebook
            </button>
            <button
              onClick={copyLink}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <Image
              src={post.imageUrl || "/placeholder.svg"}
              alt={post.title}
              width={1200}
              height={800}
              objectFit="contain"
              className="rounded-lg"
            />
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsImageModalOpen(false)
              }}
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
      <Toaster position="bottom-center" />
    </div>
  )
}

export default PostPage

