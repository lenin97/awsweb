// app/posts/[slug]/page.tsx (Server Component)
import { getMdxComponent } from '@/lib/mdxCache';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = 'MDXupdates';

export default async function PostPage() {
  // 1. Fetch the entry in MDXupdates that contains the slugs
  const { Item } = await ddb.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { id: 0 },
  }));

  if (!Item || !Item.slug) return <p className="text-white">Not found</p>;

  // 2. Parse the concatenated slugs (MDX filenames)
  const fileNames: string[] = (Item.slug as string).split('||');

  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const postData = await ddb.send(
        new GetCommand({
          TableName: process.env.DYNAMO_TABLE!,
          Key: { pk: fileName },
        })
      );

      if (!postData.Item) return null;
      const { compiledSource, frontmatter } = JSON.parse(postData.Item.payload);
      const MDXContent = getMdxComponent(compiledSource);

      return { frontmatter, MDXContent };
    })
  );

  // 3. Filter out null entries and render all posts
  return (
    <div className="text-white bg-black min-h-screen px-4 py-6">
    {posts.filter(Boolean).map((post, index) => {
      const { frontmatter, MDXContent: PostComponent } = post!; // rename here
      return (
        <article key={index} className="mb-12 border-b border-gray-700 pb-8">
          <h1 className="text-3xl font-bold mb-4">{frontmatter.title}</h1>
          <PostComponent {...frontmatter} />  {/* now PascalCase */}
        </article>
      );
    })}
  </div>
  );
}
