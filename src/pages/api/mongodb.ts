import type { NextApiRequest, NextApiResponse } from "next"
import { MongoClient, ObjectId } from "mongodb"
import type { Post } from "../../../types"

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
  // Check authentication
  const authToken = req.cookies.auth_token
  if (!authToken || (authToken !== process.env.NEXT_PUBLIC_BEARER_TOKEN && authToken !== "guest")) {
    return res.status(401).json({ message: "Unauthorized" })
  }

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

  const getPostById = async (id: string) => {
    try {
      await client.connect()

      let objectId
      try {
        objectId = new ObjectId(id)
      } catch (error) {
        console.error(`Invalid ObjectId format: ${id}`)
        return null
      }

      const post = await client.db("devtrack").collection("posts").findOne({ _id: objectId })

      if (!post) {
        console.error(`Post not found with ID: ${id}`)
        return null
      }

      return {
        _id: post._id.toString(),
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl || "",
        category: post.category,
        createdAt: new Date(post.createdAt).toISOString(),
      }
    } catch (error: any) {
      console.error(`Error fetching post with ID ${id}:`, error)
      throw new Error(error.message || "Error fetching post")
    }
  }

  const addPost = async () => {
    // Check if the user has permission to add a post
    if (authToken === "guest") {
      return res.status(403).json({ message: "Guests are not allowed to create posts" })
    }

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
          createdAt: newPost.createdAt.toISOString(),
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
      const { id } = req.query

      if (id && typeof id === "string") {
        const post = await getPostById(id)

        if (!post) {
          res.status(404).json({ message: "Post not found" })
          return
        }

        res.status(200).json({ message: "Success", post })
      } else {
        await getPosts()
        res.status(200).json({ message: "Success", posts })
      }
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

export default handler

