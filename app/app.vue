<template>
  <div class="min-h-screen bg-slate-950 p-10 text-slate-100">
    <NuxtRouteAnnouncer />
    <div class="mx-auto max-w-3xl space-y-8">
      <h1 class="text-4xl font-extrabold tracking-tight text-cyan-200">
        Mini Library Management System
      </h1>
      <StatusCheck loading-message="Waiting for backend response"
        >Checking Backend Status</StatusCheck
      >
      <StatusCheck loading-message="Waiting for Backend OpenAI response"
        >Checking OpenAI Status</StatusCheck
      >
      <StatusCheck loading-message="Waiting for Backend Supabase response"
        >Checking Supabase Status</StatusCheck
      >
    </div>
  </div>
</template>
