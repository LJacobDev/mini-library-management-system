<script setup lang="ts">
const route = useRoute();
const sidebarOpen = ref(false);
const sidebarCollapsed = ref(false);

const shellTitle = "Library Console";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: "i-heroicons-home", to: "/status" },
      { label: "Catalog", icon: "i-heroicons-book-open", to: "/catalog" },
      { label: "Loans", icon: "i-heroicons-queue-list", to: "/account/loans" }
    ]
  },
  {
    label: "Operations",
    items: [
      { label: "Desk actions", icon: "i-heroicons-sparkles", to: "/desk" },
      { label: "Reports", icon: "i-heroicons-chart-bar", to: "/reports" }
    ]
  }
];

const navigationItems = computed(() =>
  navGroups.map((group) => [
    { type: "label", label: group.label },
    ...group.items.map((item) => ({
      ...item,
      active: item.to ? route.path.startsWith(item.to) : false
    }))
  ])
);
</script>

<template>
  <NuxtDashboardGroup class="min-h-screen bg-slate-950 text-slate-100">
    <NuxtDashboardNavbar :title="shellTitle" icon="i-heroicons-book-open">
      <template #right>
        <NuxtButton
          color="primary"
          variant="soft"
          icon="i-heroicons-plus-circle"
          label="New media"
          class="hidden md:inline-flex"
        />
        <NuxtButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-bell"
          aria-label="Notifications"
          class="ml-2"
        />
      </template>
    </NuxtDashboardNavbar>

    <div class="flex flex-1 overflow-hidden">
      <NuxtDashboardSidebar
        v-model:open="sidebarOpen"
        v-model:collapsed="sidebarCollapsed"
        orientation="vertical"
        :resizable="false"
        class="border-r border-white/5 bg-slate-950/80 backdrop-blur"
        :toggle="{ class: 'text-slate-100 hover:text-primary-400' }"
      >
        <template #header="{ collapse, collapsed }">
          <div class="flex items-center justify-between px-3 py-2">
            <span v-if="!collapsed" class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Navigation
            </span>
            <NuxtButton
              size="xs"
              variant="ghost"
              color="neutral"
              :icon="collapsed ? 'i-heroicons-arrow-right-end-on-rectangle' : 'i-heroicons-arrow-left-end-on-rectangle'"
              @click="collapse && collapse(!collapsed)"
            />
          </div>
        </template>
        <NuxtNavigationMenu
          orientation="vertical"
          :collapsed="sidebarCollapsed"
          :items="navigationItems"
          :tooltip="sidebarCollapsed"
          :ui="{
            root: 'flex-1 flex w-full flex-col items-start gap-3 px-2 py-2 text-sm',
            list: 'flex w-full flex-col gap-1',
            link: 'w-full justify-start rounded-lg px-3 py-2 text-left text-slate-300 hover:bg-slate-800/80 transition',
            linkLabel: 'truncate font-medium',
            linkLeadingIcon: 'size-5',
            label: 'px-3 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500'
          }"
        />
      </NuxtDashboardSidebar>

      <div class="flex min-h-0 flex-1 flex-col">
        <NuxtDashboardToolbar class="border-b border-white/5 bg-slate-950/70 backdrop-blur">
          <template #left>
            <div class="flex items-center gap-3">
              <NuxtInput
                placeholder="Search catalog"
                size="md"
                icon="i-heroicons-magnifying-glass"
                class="w-64 max-w-xs"
              />
              <NuxtButton
                variant="soft"
                color="neutral"
                icon="i-heroicons-funnel"
                label="Filters"
                class="hidden lg:inline-flex"
              />
            </div>
          </template>
          <template #right>
            <div class="flex items-center gap-3 pr-3">
              <NuxtBadge color="primary" variant="subtle">Librarian</NuxtBadge>
              <NuxtAvatar
                size="sm"
                src="https://i.pravatar.cc/80?img=40"
                alt="Current user avatar"
                class="ring-2 ring-primary-500/40"
              />
            </div>
          </template>
        </NuxtDashboardToolbar>

        <NuxtMain class="flex-1 overflow-y-auto bg-slate-950">
          <div class="mx-auto w-full max-w-7xl px-6 py-8">
            <slot />
          </div>
        </NuxtMain>
      </div>
    </div>
  </NuxtDashboardGroup>
</template>
