import type { NextApiRequest, NextApiResponse } from "next"
import { MongoClient } from "mongodb"
import type { Post } from "../../../types"
import auth from "@/middleware/auth"

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error("MONGODB_URI is not defined")
}

const client = new MongoClient(uri)

type ResponseData = {
  message: string
  posts?: Post[]
  post?: Post
}

const handler = async (req: NextApiRequest, res: NextApiResponse<ResponseData>) => {
  let posts: Post[] = []

  const getPosts = async () => {
    try {
      await client.connect()
      const result = await client.db("devtrack").collection("posts").find<Post>({}).sort({ createdAt: -1 })
      posts = await result.toArray()
      posts = posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        createdAt: new Date(post.createdAt).toISOString(),
      }))
    } catch (error: any) {
      console.error(error)
      throw new Error(error.message || "Error fetching posts")
    }
  }

  const addPost = async () => {
    const { title, content, imageUrl, category } = req.body
    if (!title || !content || !category) {
      res.status(400).json({ message: "Title, content, and category are required" })
      return
    }

    try {
      await client.connect()
      const newPost = {
        title,
        content,
        imageUrl,
        category,
        createdAt: new Date(),
      }
      const result = await client.db("devtrack").collection("posts").insertOne(newPost)
      if (result.acknowledged) {
        const createdPost: Post = {
          _id: result.insertedId.toString(),
          ...newPost,
          createdAt: newPost.createdAt.toISOString(), // Store as ISO string
        }
        res.status(201).json({ message: "Post created successfully", post: createdPost })
      } else {
        res.status(500).json({ message: "Failed to create post" })
      }
    } catch (error: any) {
      console.error(error)
      res.status(500).json({ message: error.message || "An unexpected error occurred" })
    } finally {
      await client.close()
    }
  }

  if (req.method === "GET") {
    try {
      await getPosts()
      res.status(200).json({ message: "Success", posts })
    } catch (error: any) {
      res.status(500).json({ message: error.message || "An unexpected error occurred" })
    } finally {
      await client.close()
    }
  } else if (req.method === "POST") {
    await addPost()
  } else {
    res.status(405).json({ message: "Method not allowed" })
  }
}

export default auth(handler)

