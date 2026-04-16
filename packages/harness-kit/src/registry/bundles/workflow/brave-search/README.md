---
title: Brave Search
description: Brave Search MCP server + usage skill — independent index, privacy-focused web search.
category: workflow
slug: brave-search
---
# Brave Search

Brave Search MCP server + usage skill — independent index, privacy-focused web search.

## Artifacts

| Type | Detail |
|------|--------|
| `mcp` | `@brave/brave-search-mcp-server` |
| `skill` | `skills/brave-search` (local) — tool selection, params, examples |

## Environment

| Key | Required | Source |
|-----|----------|--------|
| `BRAVE_API_KEY` | Yes | [brave.com/search/api](https://brave.com/search/api) |

## What it does

MCP server exposes 6 tools: web search, news, video, image, local, and summarizer. Skill teaches Claude which tool to use, key params (freshness, count, goggles, summary chaining).

## Setup

1. Get an API key at [brave.com/search/api](https://brave.com/search/api) (free tier: 2,000 queries/month)
2. Add `BRAVE_API_KEY` to `.env` in your project
3. Run `harness-kit add brave-search`

## Notes

- Official package: `@brave/brave-search-mcp-server` (replaces archived `@modelcontextprotocol/server-brave-search`)
- Free tier is generous for development; paid tier for production
- Independent index (not Google/Bing reskin) — sometimes better for technical queries
