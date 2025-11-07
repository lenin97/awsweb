// app/posts/[slug]/page.tsx (Server Component)
import { getMdxComponent } from '@/lib/mdxCache';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.DYNAMO_TABLE!;

export default async function PostPage({ params }: { params: { slug: string } }) {
  // 1. Fetch the pre-compiled payload
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { pk: params.slug },
  }));
  if (!Item) return <p>Not found</p>;

  const { compiledSource, frontmatter } = JSON.parse(Item.payload);

  // 2. Recreate (and cache) the React component
  const MDXContent = getMdxComponent(compiledSource);

  // 3. Render it
  return (
    <article>
      <h1>{frontmatter.title}</h1>
      <MDXContent {...frontmatter} />
    </article>
  );
}
