import { useParams } from "react-router"
import {
  Text,
  Flex,
  Card,
  Badge,
  Spinner,
} from "@radix-ui/themes"
import { useGetPublicProfile } from "@/api/generated"

const PublicProfilePage = () => {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = useGetPublicProfile(slug ?? "", {
    query: { enabled: !!slug },
  })

  if (isLoading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Spinner size="3" />
      </Flex>
    )
  }

  if (isError || !data) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        gap="4"
        className="min-h-screen"
      >
        <Text size="5" weight="bold">
          Profile not found
        </Text>
        <Text size="2" color="gray">
          This creator profile doesn't exist or isn't published yet.
        </Text>
      </Flex>
    )
  }

  const { platforms, ...profile } = data

  return (
    <Flex direction="column" className="min-h-screen bg-[var(--gray-2)]">
      <Flex
        justify="center"
        align="center"
        className="border-b border-[var(--gray-6)] px-6 py-3"
      >
        <Text size="4" weight="bold">
          Noshi
        </Text>
      </Flex>

      <Flex direction="column" align="center" gap="6" className="px-4 py-10">
        <Flex direction="column" align="center" gap="2">
          <Text size="8" weight="bold">
            {profile.slug}
          </Text>
          <Text size="4" color="gray">
            {profile.headline}
          </Text>
        </Flex>

        {profile.niches.filter(Boolean).length > 0 && (
          <Flex gap="2" wrap="wrap" justify="center" className="max-w-md">
            {profile.niches.filter(Boolean).map((niche) => (
              <Badge key={niche} size="2" variant="soft" color="iris">
                {niche}
              </Badge>
            ))}
          </Flex>
        )}

        {platforms.length > 0 && (
          <Card size="3" className="w-full max-w-md">
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

        <Card size="3" className="w-full max-w-md">
          <Flex direction="column" gap="2" align="center">
            <Text size="2" color="gray">
              Want to work with this creator?
            </Text>
            <Text size="2" weight="medium">
              Contact them directly or check back soon for media kits.
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}

export default PublicProfilePage
