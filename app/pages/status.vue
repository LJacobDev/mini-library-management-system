<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <h1 class="text-4xl text-center font-extrabold tracking-tight text-cyan-200">
      System Status
    </h1>

    <StatusCheckString
      loading-message="Waiting for backend response"
      service-url="/api/check/backend"
      >Checking Backend Status</StatusCheckString
    >

    <StatusCheckStream
      loading-message="Waiting for Backend OpenAI response"
      service-url="/api/check/openai"
      >Checking OpenAI Status</StatusCheckStream
    >

    <StatusCheckString
      loading-message="Waiting for Backend Supabase response"
      service-url="/api/check/supabase"
      >Checking Supabase Status</StatusCheckString
    >
  </div>
</template>
