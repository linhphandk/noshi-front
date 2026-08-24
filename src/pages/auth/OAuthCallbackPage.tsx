import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router"
import { Flex, Text, Spinner } from "@radix-ui/themes"
import { useConnect } from "@/api/generated"

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const connectMutation = useConnect()

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        console.error("OAuth error:", error)
        navigate("/dashboard?error=oauth_failed")
        return
      }

      if (!code || !state) {
        console.error("Missing code or state")
        navigate("/dashboard?error=invalid_callback")
        return
      }

      try {
        await connectMutation.mutateAsync({
          data: { platform: "instagram", code, state },
        })
        navigate("/dashboard")
      } catch (err) {
        console.error("Failed to connect Instagram:", err)
        navigate("/dashboard?error=connection_failed")
      }
    }

    handleCallback()
  }, [code, state, error, connectMutation, navigate])

  return (
    <Flex align="center" justify="center" className="min-h-screen">
      <Flex direction="column" gap="4" align="center">
        <Spinner size="3" />
        <Text size="2" color="gray">
          Connecting Instagram...
        </Text>
      </Flex>
    </Flex>
  )
}

export default OAuthCallbackPage