export interface Post {
  _id: string
  title: string
  content: string
  imageUrl: string
  category: string
  createdAt: string // ISO string
}

export interface PostWithFormattedDate extends Omit<Post, "createdAt"> {
  createdAt: {
    date: string
    time: string
  }
}