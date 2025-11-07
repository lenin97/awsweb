// Add this inside your post page component (server-rendered) where you want the breadcrumb HTML to appear
import Link from 'next/link'

export function BreadCrumbPost({ slug, title }: { slug: string; title: string }) {
    const postHref = `/posts/${encodeURIComponent(slug)}`;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex flex-wrap items-center gap-1 text-sm text-gray-600 dark:text-gray-300"
      >
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center"
        >
          {/*
            Put microdata on the rendered anchor by passing itemProp via Link.
            Some strict TypeScript setups may complain — the cast below avoids that.
          */}
          <Link
            href="/"
            // cast to any only if your TS build complains about itemProp
            {...({ itemProp: 'item' })}
            className="text-blue-600 dark:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 rounded"
          >
            <span itemProp="name">Home</span>
          </Link>

          <meta itemProp="position" content="1" />
        </li>

        <span aria-hidden="true" className="mx-2 text-gray-400 dark:text-gray-500">
          ›
        </span>

        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center max-w-full"
        >
          <Link
            href={postHref}
            {...({ itemProp: 'item' })}
            aria-current="page"
            className="text-gray-700 dark:text-gray-100 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 rounded truncate max-w-[55vw] sm:max-w-[40vw]"
          >
            <span itemProp="name" className="truncate">
              {title}
            </span>
          </Link>

          <meta itemProp="position" content="2" />
        </li>
      </ol>
    </nav>
  );

}
