import { useNavigate } from "react-router"
import {
  Button,
  Card,
  Flex,
  Text,
  Badge,
  Progress,
  Separator,
  Spinner,
} from "@radix-ui/themes"
import { useGetProfile, useGetManualPlatforms } from "@/api/generated"
import { useAuth } from "@/context"

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: profile, isLoading: profileLoading } = useGetProfile()
  const { data: platforms, isLoading: platformsLoading } =
    useGetManualPlatforms()

  const isLoading = profileLoading || platformsLoading

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Spinner size="3" />
      </Flex>
    )
  }

  if (!profile) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        className="min-h-screen"
      >
        <Text size="5" weight="bold">
          Welcome to Noshi
        </Text>
        <Text size="2" color="gray">
          Set up your profile to get started.
        </Text>
        <Button onClick={() => navigate("/onboarding")}>Create Profile</Button>
      </Flex>
    )
  }

  const score = profile.completion_score ?? 0

  return (
    <Flex direction="column" className="min-h-screen bg-[var(--gray-2)]">
      <Flex
        justify="between"
        align="center"
        className="border-b border-[var(--gray-6)] px-6 py-3"
      >
        <Text size="4" weight="bold">
          Noshi
        </Text>
        <Flex gap="3" align="center">
          <Text size="2" color="gray">
            {user?.email}
          </Text>
          <Button variant="soft" size="2" onClick={() => logout()}>
            Log out
          </Button>
        </Flex>
      </Flex>

      <Flex direction="column" align="center" gap="4" className="px-4 py-8">
        <Card size="3" className="w-full max-w-lg">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Text size="3" weight="bold">
                Profile
              </Text>
              {profile.is_published ? (
                <Badge color="green">Published</Badge>
              ) : (
                <Badge color="gray">Draft</Badge>
              )}
            </Flex>

            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2" color="gray">
                  Completion
                </Text>
                <Text size="2" weight="medium">
                  {score}%
                </Text>
              </Flex>
              <Progress value={score} size="2" />
            </Flex>

            <Separator size="4" />

            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text size="2" color="gray">
                  Slug
                </Text>
                <Text size="2">@{profile.slug}</Text>
              </Flex>
              <Flex justify="between">
                <Text size="2" color="gray">
                  Headline
                </Text>
                <Text size="2">{profile.headline}</Text>
              </Flex>
              <Flex justify="between" align="start">
                <Text size="2" color="gray">
                  Niches
                </Text>
                <Flex gap="1" wrap="wrap" justify="end" className="max-w-[60%]">
                  {profile.niches.filter(Boolean).map((niche) => (
                    <Badge key={niche} size="1" variant="soft">
                      {niche}
                    </Badge>
                  ))}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Card>

        {platforms && platforms.length > 0 && (
          <Card size="3" className="w-full max-w-lg">
            <Flex direction="column" gap="3">
              <Text size="3" weight="bold">
                Platforms
              </Text>
              {platforms.map((plat) => (
                <Flex
                  key={plat.id}
                  justify="between"
                  align="center"
                  className="rounded-[var(--radius-2)] bg-[var(--gray-3)] px-3 py-2"
                >
                  <Flex gap="2" align="center">
                    <Badge size="2">{plat.platform}</Badge>
                    <Text size="2">{plat.handle}</Text>
                  </Flex>
                  <Text size="2" color="gray">
                    {plat.follower_count.toLocaleString()} followers
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Card>
        )}

        <Card size="3" className="w-full max-w-lg">
          <Flex direction="column" gap="3">
            <Text size="3" weight="bold">
              Quick Actions
            </Text>
            <Flex gap="3">
              <Button variant="soft" onClick={() => navigate("/onboarding")}>
                Edit Profile
              </Button>
              <Button variant="soft" disabled>
                Download Media Kit
              </Button>
            </Flex>
            <Text size="1" color="gray">
              Brands are coming soon.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}

export default DashboardPage
