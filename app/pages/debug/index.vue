<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { createError } from "h3";

type SessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; role: string | null; email: string | null };

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
    label: "AI: recommend sample",
    description: "POST /api/ai/recommend with a prompt payload (requires member session)",
    method: "POST",
    path: "/api/ai/recommend",
    prepare: () => {
      if (typeof window === "undefined") {
        return {
          body: {
            prompt: "I love space adventures with found families.",
            filters: { mediaType: "book", limit: 4 }
          }
        };
      }

      const promptText = window.prompt(
        "Describe the books or media you want recommendations for",
        "Epic sci-fi with strong female leads"
      );
      if (!promptText || !promptText.trim().length) {
        throw new Error("Recommendation cancelled: prompt text required.");
      }

      const mediaType = window.prompt(
        "Media type filter (book, video, audio, other, optional)",
        ""
      );
      const limit = window.prompt("How many recommendations? (1-12)", "6");

      const filters: Record<string, unknown> = {};
      if (mediaType && mediaType.trim().length) {
        filters.mediaType = mediaType.trim().toLowerCase();
      }
      if (limit && limit.trim().length) {
        const parsed = Number.parseInt(limit, 10);
        if (!Number.isNaN(parsed)) {
          filters.limit = parsed;
        }
      }

      return {
        body: {
          prompt: promptText.trim(),
          filters: Object.keys(filters).length ? filters : undefined
        }
      };
    }
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
  },
  {
    label: "Loans: list",
    description: "GET /api/loans?page=1 (requires librarian/admin session)",
    method: "GET",
    path: "/api/loans",
    prepare: () => ({ path: "/api/loans?page=1" }),
  },
  {
    label: "Loans: checkout",
    description: "POST /api/loans to checkout media to a member",
    method: "POST",
    path: "/api/loans",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const memberId = window.prompt("Member ID (UUID)", "");
      const mediaId = window.prompt("Media ID (UUID)", "");
      const dueDate = window.prompt("Due date (ISO, optional)", "");
      const note = window.prompt("Checkout note (optional)", "");

      if (!memberId || !mediaId) {
        throw new Error("Checkout cancelled: member and media IDs required.");
      }

      return {
        body: {
          memberId: memberId.trim(),
          mediaId: mediaId.trim(),
          dueDate: dueDate && dueDate.trim().length ? dueDate.trim() : undefined,
          note: note && note.trim().length ? note.trim() : undefined,
        },
      };
    },
  },
  {
    label: "Loans: return",
    description: "POST /api/loans/:id/return with optional condition note",
    method: "POST",
    path: "/api/loans/:id/return",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const loanId = window.prompt("Loan ID", "");
      if (!loanId) {
        throw new Error("Return cancelled: loan ID required.");
      }

      const condition = window.prompt("Condition notes (optional)", "");
      const notes = window.prompt("General notes (optional)", "");

      return {
        path: `/api/loans/${loanId.trim()}/return`,
        body: {
          condition: condition && condition.trim().length ? condition.trim() : undefined,
          notes: notes && notes.trim().length ? notes.trim() : undefined,
        },
      };
    },
  },
  {
    label: "Loans: renew",
    description: "POST /api/loans/:id/renew (member or staff, requires no reservations)",
    method: "POST",
    path: "/api/loans/:id/renew",
    prepare: () => {
      if (typeof window === "undefined") {
        return {};
      }

      const loanId = window.prompt("Loan ID", "");
      if (!loanId) {
        throw new Error("Renew cancelled: loan ID required.");
      }

      const dueDate = window.prompt("New due date (ISO)", "");
      if (!dueDate || !dueDate.trim().length) {
        throw new Error("Renew cancelled: due date required.");
      }

      const note = window.prompt("Renewal note (optional)", "");

      return {
        path: `/api/loans/${loanId.trim()}/renew`,
        body: {
          dueDate: dueDate.trim(),
          note: note && note.trim().length ? note.trim() : undefined,
        },
      };
    },
  }
];

const result = ref<string>("Press a button to run a check.");
const loadingKey = ref<string | null>(null);
const sessionState = ref<SessionState>({ status: "loading" });

const sessionLabel = computed(() => {
  if (sessionState.value.status === "loading") {
    return "Loading session…";
  }

  if (sessionState.value.status === "guest") {
    return "Signed out";
  }

  const { role, email } = sessionState.value;
  const roleLabel = typeof role === "string" && role.length ? role.toUpperCase() : "UNKNOWN ROLE";
  return `${roleLabel} — ${email ?? "unknown email"}`;
});

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

  loadingKey.value = endpoint.label;

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

async function fetchSessionState() {
  try {
    const data = await $fetch<{ role?: string | null; email?: string | null } | null>("/api/debug/auth-check");
    if (!data) {
      sessionState.value = { status: "guest" };
      return;
    }

    sessionState.value = {
      status: "authenticated",
      role: data.role ?? null,
      email: data.email ?? null,
    };
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null ? (error as { statusCode?: number }).statusCode : undefined;
    if (statusCode === 401) {
      sessionState.value = { status: "guest" };
      return;
    }

    console.error("Failed to load debug session state", error);
    sessionState.value = { status: "guest" };
  }
}

onMounted(() => {
  fetchSessionState();
});

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
      <header class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm uppercase tracking-widest text-primary-300">Developer Console</p>
            <h1 class="text-3xl font-bold text-white">Debug controls</h1>
          </div>
          <NuxtCard class="border border-white/10 bg-slate-900/80 px-4 py-3 text-sm font-medium text-slate-200">
            <div class="flex items-center gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="{
                  'bg-amber-400 animate-pulse': sessionState.status === 'loading',
                  'bg-emerald-400': sessionState.status === 'authenticated',
                  'bg-slate-500': sessionState.status !== 'authenticated'
                }"
              />
              <span>{{ sessionLabel }}</span>
            </div>
          </NuxtCard>
        </div>
        <p class="text-sm text-slate-400">
          Quick buttons for hitting Nuxt server endpoints while we wire Supabase-backed catalog + circulation routes.
        </p>
        <button
          class="text-xs font-medium uppercase tracking-wide text-primary-300 underline-offset-4 hover:underline"
          type="button"
          @click="fetchSessionState"
        >
          Refresh session
        </button>
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
                :loading="loadingKey === endpoint.label"
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
