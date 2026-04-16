import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({});
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repositoryName = "harness-kit";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isGitHubActions ? `/${repositoryName}` : "",
  assetPrefix: isGitHubActions ? `/${repositoryName}/` : "",
};

export default withNextra(nextConfig);
