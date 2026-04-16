import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

export function MdxContent({ source }: { source: string }) {
  return (
    <article className="bundle-content">
      <MDXRemote source={source} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </article>
  );
}
