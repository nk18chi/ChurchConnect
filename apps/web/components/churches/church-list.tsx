import { gql } from "@apollo/client";
import { getClient } from "@/lib/apollo-client";
import { ChurchCard } from "./church-card";

const GET_CHURCHES = gql`
  query GetChurches(
    $prefectureId: String
    $denominationId: String
    $languageIds: [String!]
  ) {
    churches(
      prefectureId: $prefectureId
      denominationId: $denominationId
      languageIds: $languageIds
      limit: 50
    ) {
      id
      name
      slug
      address
      heroImageUrl
      isVerified
      prefecture {
        name
      }
      city {
        name
      }
      denomination {
        name
      }
      languages {
        name
      }
    }
  }
`;

interface ChurchListProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function ChurchList({ searchParams }: ChurchListProps) {
  const prefectureId = searchParams.prefecture as string | undefined;
  const denominationId = searchParams.denomination as string | undefined;
  const languageId = searchParams.language as string | undefined;

  const { data } = await getClient().query({
    query: GET_CHURCHES,
    variables: {
      prefectureId,
      denominationId,
      languageIds: languageId ? [languageId] : undefined,
    },
  });

  const churches = data?.churches || [];

  if (churches.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center">
        <p className="text-gray-600">
          No churches found matching your criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        Found {churches.length} {churches.length === 1 ? "church" : "churches"}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {churches.map((church: any) => (
          <ChurchCard key={church.id} church={church} />
        ))}
      </div>
    </div>
  );
}
