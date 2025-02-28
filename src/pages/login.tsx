"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/router"
import { setCookie } from "cookies-next"

export default function Login() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        const { token } = await response.json()
        setCookie("auth_token", token, { maxAge: 60 * 60 * 24 }) // 24 hours
        router.push("/")
      } else {
        setError("Invalid code. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    }
  }

  const handleGuestLogin = () => {
    setCookie("auth_token", "guest", { maxAge: 60 * 60 * 24 }) // 24 hours
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-400 mb-1">
              Enter Code
            </label>
            <input
              type="password"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your access code"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
          >
            Login
          </button>
        </form>
        <div className="mt-4">
          <button
            onClick={handleGuestLogin}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition duration-300"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}

