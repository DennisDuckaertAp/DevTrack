import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const { code } = req.body

    // Replace this with your actual secret code
    const secretCode = process.env.AUTH_SECRET_CODE

    if (code === secretCode) {
      // If the code matches, return the bearer token
      res.status(200).json({ token: process.env.NEXT_PUBLIC_BEARER_TOKEN })
    } else {
      res.status(401).json({ message: "Invalid code" })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}

