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

type DebugEndpoint = {
  label: string;
  description: string;
  method: HttpVerb | "LOCAL";
  path: string;
  stream?: boolean;
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
  }
];

const result = ref<string>("Press a button to run a check.");
const loadingKey = ref<string | null>(null);

async function runEndpoint(endpoint: DebugEndpoint) {
  loadingKey.value = endpoint.path;

  if (endpoint.method === "LOCAL") {
    const { items } = useCatalogMock({ take: 3 });
    result.value = JSON.stringify(items.value, null, 2);
    loadingKey.value = null;
    return;
  }

  try {
    if (endpoint.stream) {
      const response = await fetch(endpoint.path, {
        method: endpoint.method,
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
      const res = await $fetch(endpoint.path, {
        method: endpoint.method
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

      <div class="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div class="space-y-4">
          <NuxtCard v-for="endpoint in endpoints" :key="endpoint.label" class="border border-white/5 bg-slate-900/70">
            <div class="space-y-3">
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

        <NuxtCard class="border border-white/5 bg-slate-900/70">
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
