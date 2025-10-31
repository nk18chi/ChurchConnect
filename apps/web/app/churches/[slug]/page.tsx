import { gql } from "@apollo/client";
import { getClient } from "@/lib/apollo-client";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ChurchHero } from "@/components/church-detail/church-hero";
import { ChurchTabs } from "@/components/church-detail/church-tabs";

const GET_CHURCH = gql`
  query GetChurch($slug: String!) {
    church(slug: $slug) {
      id
      name
      slug
      address
      postalCode
      phone
      email
      website
      contactEmail
      heroImageUrl
      isVerified
      prefecture {
        name
        nameJa
      }
      city {
        name
        nameJa
      }
      denomination {
        name
        nameJa
      }
      languages {
        id
        name
        nameJa
      }
      profile {
        whoWeAre
        vision
        statementOfFaith
        storyOfChurch
        kidChurchInfo
        whatToExpect
        dressCode
        worshipStyle
        accessibility
        howToGive
        bankName
        bankAccountNumber
        bankAccountName
        externalDonationUrl
      }
      social {
        youtubeUrl
        podcastUrl
        instagramUrl
        twitterUrl
        facebookUrl
        spotifyUrl
        lineUrl
      }
      staff {
        id
        name
        title
        role
        bio
        photoUrl
        email
      }
      serviceTimes {
        id
        dayOfWeek
        startTime
        endTime
        serviceType
        language {
          name
        }
      }
      events {
        id
        title
        description
        startDate
        endDate
        location
        isOnline
        registrationUrl
        imageUrl
      }
      sermons {
        id
        title
        description
        preacher
        passage
        date
        youtubeUrl
        podcastUrl
      }
    }
  }
`;

interface ChurchPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ChurchPageProps): Promise<Metadata> {
  const { data } = await getClient().query({
    query: GET_CHURCH,
    variables: { slug: params.slug },
  });

  const church = data?.church;

  if (!church) {
    return {
      title: "Church Not Found",
    };
  }

  return {
    title: `${church.name} | ChurchConnect Japan`,
    description: church.profile?.whoWeAre || `Visit ${church.name} in ${church.city.name}, ${church.prefecture.name}`,
    openGraph: {
      title: church.name,
      description: church.profile?.whoWeAre || `Visit ${church.name}`,
      images: church.heroImageUrl ? [church.heroImageUrl] : [],
    },
  };
}

export default async function ChurchPage({ params }: ChurchPageProps) {
  const { data } = await getClient().query({
    query: GET_CHURCH,
    variables: { slug: params.slug },
  });

  const church = data?.church;

  if (!church) {
    notFound();
  }

  return (
    <div>
      <ChurchHero church={church} />
      <ChurchTabs church={church} />
    </div>
  );
}
