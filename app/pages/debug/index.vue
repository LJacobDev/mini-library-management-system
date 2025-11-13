<script setup lang="ts">
import { ref } from "vue";
import { createError } from "h3";

const devOnlyGuard = defineNuxtRouteMiddleware(() => {
  if (import.meta.dev) {
    return;
  }

  if (import.meta.server) {
    throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
  }

  return navigateTo("/");
});

definePageMeta({
  middleware: devOnlyGuard
});

type HttpVerb = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";

type PreparedRequest = {
  path?: string;
  method?: HttpVerb;
  body?: Record<string, unknown>;
};

type DebugEndpoint = {
  label: string;
  description: string;
  method: HttpVerb | "LOCAL";
  path: string;
  stream?: boolean;
  prepare?: () => PreparedRequest | Promise<PreparedRequest>;
};

const endpoints: DebugEndpoint[] = [
  {
    label: "Ping OpenAI check",
    description: "Calls /api/check/openai to verify streaming bridge.",
    method: "GET",
    path: "/api/check/openai",
    stream: true
  },
  {
    label: "Ping Supabase check",
    description: "Calls /api/check/supabase to confirm database connectivity.",
    method: "GET",
    path: "/api/check/supabase"
  },
  {
    label: "Preview catalog (mock)",
    description: "Uses current mock composable for quick comparison.",
    method: "LOCAL",
    path: "mock"
  },
  {
    label: "Admin: list media",
    description: "GET /api/admin/media?page=1 (requires admin session)",
    method: "GET",
    path: "/api/admin/media",
    prepare: () => ({ path: "/api/admin/media?page=1" })
  },
  {
    label: "Admin: create media sample",
    description: "POST /api/admin/media with sample payload (requires admin session)",
    method: "POST",
    path: "/api/admin/media",
    prepare: () => {
      const timestamp = new Date().toISOString();
      return {
        body: {
          title: `Debug Sample ${timestamp}`,
          creator: "System Debug",
          mediaType: "book",
          mediaFormat: "print",
          genre: "debug",
          subject: "automation",
          description: "Seeded via /debug console",
        },
      };
    },
  },
  {
    label: "Admin: update media title",
    description: "PATCH /api/admin/media/:id to tweak title (requires admin session)",
    method: "PATCH",
    path: "/api/admin/media/:id",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const id = window.prompt("Media ID to update?", "");
      if (!id) {
        throw new Error("Update cancelled: media ID required.");
      }

      const newTitle = window.prompt("New title", "");
      const newGenre = window.prompt("Optional genre", "");

      const payload: Record<string, unknown> = {};
      if (newTitle && newTitle.trim().length) {
        payload.title = newTitle.trim();
      }
      if (newGenre && newGenre.trim().length) {
        payload.genre = newGenre.trim();
      }

      if (Object.keys(payload).length === 0) {
        throw new Error("No fields provided for update.");
      }

      return {
        path: `/api/admin/media/${id}`,
        body: payload,
      };
    },
  },
  {
    label: "Admin: delete media",
    description: "DELETE /api/admin/media/:id (requires admin session)",
    method: "DELETE",
    path: "/api/admin/media/:id",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const id = window.prompt("Media ID to delete?", "");
      if (!id) {
        throw new Error("Delete cancelled: media ID required.");
      }

      return {
        path: `/api/admin/media/${id}`,
      };
    },
  }
];

const result = ref<string>("Press a button to run a check.");
const loadingKey = ref<string | null>(null);

async function runEndpoint(endpoint: DebugEndpoint) {
  let activePath = endpoint.path;
  let body: Record<string, unknown> | undefined;
  let method = endpoint.method;

  if (endpoint.prepare) {
    try {
      const prepared = await endpoint.prepare();
      if (prepared.path) {
        activePath = prepared.path;
      }
      if (prepared.body) {
        body = prepared.body;
      }
      if (prepared.method) {
        method = prepared.method;
      }
    } catch (error) {
      result.value = error instanceof Error ? `Cancelled: ${error.message}` : "Cancelled";
      return;
    }
  }

  loadingKey.value = `${endpoint.label}-${activePath}`;

  if (method === "LOCAL") {
    const { items } = useCatalogMock({ take: 3 });
    result.value = JSON.stringify(items.value, null, 2);
    loadingKey.value = null;
    return;
  }

  try {
    if (endpoint.stream) {
      const response = await fetch(activePath, {
        method,
        headers: {
          Accept: "text/event-stream"
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.text();
      const parsed = parseSSEPayload(payload);
      result.value = JSON.stringify(parsed, null, 2);
    } else {
      const res = await $fetch(activePath, {
        method,
        body: method === "GET" ? undefined : body
      });
      result.value = JSON.stringify(res, null, 2);
    }
  } catch (error) {
    if (error instanceof Error) {
      result.value = `Error: ${error.message}`;
    } else {
      result.value = `Unknown error: ${JSON.stringify(error)}`;
    }
  } finally {
    loadingKey.value = null;
  }
}

function parseSSEPayload(payload: string) {
  const blocks = payload
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const tokens: string[] = [];
  const metadata: Record<string, unknown> = {};

  for (const block of blocks) {
    const lines = block.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event:"));
    const dataLine = lines.find((line) => line.startsWith("data:"));

    if (!eventLine || !dataLine) {
      continue;
    }

    const eventName = eventLine.replace("event:", "").trim();
    const dataRaw = dataLine.replace("data:", "").trim();
    let parsedData: unknown = dataRaw;

    try {
      parsedData = JSON.parse(dataRaw);
    } catch (error) {
      console.debug("Non-JSON SSE data", { eventName, dataRaw, error });
    }

    if (eventName === "token") {
      const delta = (parsedData as { delta?: string })?.delta;
      if (typeof delta === "string") {
        tokens.push(delta);
      }
      continue;
    }

    metadata[eventName] = parsedData;
  }

  if (tokens.length) {
    return {
      message: tokens.join(""),
      metadata
    };
  }

  return {
    raw: payload,
    metadata
  };
}
</script>

<template>
  <main class="bg-slate-950 text-slate-100">
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header class="space-y-3">
        <p class="text-sm uppercase tracking-widest text-primary-300">Developer Console</p>
        <h1 class="text-3xl font-bold text-white">Debug controls</h1>
        <p class="text-sm text-slate-400">
          Quick buttons for hitting Nuxt server endpoints while we wire Supabase-backed catalog + circulation routes.
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div class="flex w-full max-w-xs flex-col gap-2">
          <NuxtCard
            v-for="endpoint in endpoints"
            :key="endpoint.label"
            class="flex w-full flex-col gap-1 rounded-lg border border-white/5 bg-slate-900/70 px-4 py-2"
          >
            <div class="space-y-1">
              <div class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-white">{{ endpoint.label }}</h2>
                <span class="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {{ endpoint.method }}
                </span>
              </div>
              <p class="text-sm text-slate-400">
                {{ endpoint.description }}
              </p>
              <NuxtButton
                size="sm"
                color="primary"
                :loading="loadingKey === endpoint.path"
                :disabled="loadingKey !== null"
                @click="runEndpoint(endpoint)"
              >
                Run
              </NuxtButton>
            </div>
          </NuxtCard>
        </div>

        <NuxtCard class="border border-white/5 bg-slate-900/70 lg:sticky lg:top-16">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-white">Result</h2>
              <NuxtButton size="xs" variant="ghost" color="neutral" @click="result = 'Press a button to run a check.'">
                Clear
              </NuxtButton>
            </div>
          </template>

          <pre class="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-950/70 p-4 text-sm text-slate-200">
{{ result }}
          </pre>
        </NuxtCard>
      </div>
    </section>
  </main>
</template>
