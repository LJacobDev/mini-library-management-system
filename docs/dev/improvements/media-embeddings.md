# Media Recommendation Improvements — Keyword Reduction vs. Embeddings

_Last updated: 2025-11-13_

## 1. Why this document exists

Our current recommendation stub leans on OpenAI chat completions for two tasks:

1. **Keyword reduction** – distill a member’s free-form prompt down to a short list of search terms.
2. **Narrative response** – describe the selected media in a friendly, streaming reply.

That approach works, but it triggers **two OpenAI API calls per member query**, which can impact latency and cost. This note compares the existing pattern with an embedding-based alternative that uses **one embedding call + one chat completion** and sets the stage for upgrading once we are ready.

## 2. Current two-call flow (chat → keywords → chat)

| Step | Description | OpenAI API | Supabase | Notes |
| --- | --- | --- | --- | --- |
| 1 | Send the member’s prompt to OpenAI with instructions to return keywords. | `chat.completions` | — | Output is a JSON array or comma-separated list of search tokens. |
| 2 | Use the returned keywords in a Supabase filter (`ilike`/`or`) against `media` fields. | — | `SELECT ... WHERE title ILIKE ANY(...)` | Performs a traditional keyword/substring search. |
| 3 | Send both the original prompt and the shortlisted media metadata to OpenAI, streaming the narrative response. | `chat.completions` (stream) | — | Generates the final human-friendly recommendation copy. |

**Benefits**
- Simple: only needs base Supabase search.
- Easy to explain and debug (keywords are human-readable).

**Drawbacks**
- Two OpenAI calls per request.
- Keyword extraction can still miss semantically similar titles (e.g., “found family adventures” vs. “ragtag crew in space”).
- Long prompts can exhaust the model’s ability to distill high-quality keywords without extra prompting.

## 3. Embedding-first alternative (preferred upgrade)

| Step | Description | OpenAI API | Supabase | Notes |
| --- | --- | --- | --- | --- |
| 1 | Precompute vectors for each media item (title + description + genre). | — | `media_embeddings` table with `vector` column | Run as a one-time job or nightly refresher. |
| 2 | Embed the member’s prompt on demand. | `embeddings` (`text-embedding-3-small`) | — | One API call per member query. |
| 3 | Run a vector similarity search to fetch the top-N items. | — | `SELECT ... ORDER BY embedding <-> query LIMIT N` | Uses pgvector or Supabase `match_documents` helper. |
| 4 | Feed the winning items + member intent to a single streaming chat completion. | `chat.completions` (stream) | — | Generates the same friendly response, now with more relevant inputs. |

**Benefits**
- Still **one chat completion** for the conversational output.
- Semantic search handles nuanced preferences better than raw keywords.
- Lower OpenAI usage: one embedding call vs. one chat + one chat.

**Trade-offs**
- Requires maintaining an embeddings table and a small ingestion pipeline.
- Slightly higher start-up cost to backfill vectors for the existing catalog.

## 4. Implementation sketch

1. **Create a Supabase table** `media_embeddings`:
   ```sql
   CREATE TABLE media_embeddings (
     media_id uuid PRIMARY KEY REFERENCES media(id) ON DELETE CASCADE,
     embedding vector(1536),
     source text NOT NULL DEFAULT 'text-embedding-3-small',
     updated_at timestamptz NOT NULL DEFAULT now()
   );
   ```

2. **Backfill embeddings** using a server-side script or Supabase Edge Function:
   - Fetch each media row (title + description + genre + subject).
   - Call `client.embeddings.create({ model: 'text-embedding-3-small', input })`.
   - Store the result in `media_embeddings.embedding`.

3. **Query path in `/api/ai/recommend`**:
   - Embed the member prompt once.
   - Call Supabase RPC or SQL to pull the nearest neighbours:
     ```ts
     const { data } = await supabase.rpc('match_media', {
       query_embedding: promptVector,
       match_count: limit,
       similarity_threshold: 0.75,
     })
     ```
   - If pgvector is not yet installed, use Supabase’s `match_documents` helper or a manual `order by embedding <-> query` statement.

4. **Fallbacks**
   - If the embedding call fails, fall back to the current keyword search to keep the UX alive.
   - Consider a nightly job to re-embed changed media descriptions.

5. **Final chat completion** (same as today)
   - Stream a single response summarising the selected items.
   - Optionally include the similarity score to justify recommendations (“chosen because it closely matches your request for…”).

## 5. When to adopt embeddings

- **After the fast-start UI stabilises**, schedule a backlog item to:
  1. Add the `media_embeddings` table + backfill job.
  2. Update `/api/ai/recommend` to call the embeddings endpoint instead of the keyword extractor.
  3. Monitor latency/costs vs. the two-chat baseline.

- **Keep the keyword path as fallback** until embeddings are fully tested in staging.

## 6. Summary

| Approach | OpenAI calls per query | Relevance | Complexity |
| --- | --- | --- | --- |
| Chat → keywords → chat (current) | 2 | Good for literal matches | Low |
| Embeddings → vector search → chat (future) | 1 (embedding) + 1 (chat) | Better semantic coverage | Medium |

Moving to embeddings reduces the number of OpenAI calls, handles nuanced prompts more gracefully, and sets us up for richer hybrid search later (e.g., combine availability signals, popularity boosts, or staff picks). Keep this doc handy when we prioritise the next iteration of the recommendation engine.