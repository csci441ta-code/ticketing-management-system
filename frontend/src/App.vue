<script setup>
import { HomeIcon, BoltIcon, UserCircleIcon } from '@heroicons/vue/24/solid'
</script>

<template>
  <main class="flex flex-col items-center justify-center bg-gray-50 text-gray-800">
    <h1 class="text-2xl font-bold mb-6">Ticketing Demo</h1>

    <div class="grid grid-cols-3 gap-8">
      <div class="flex flex-col items-center">
        <HomeIcon class="h-10 w-10 text-blue-600" />
        <span class="mt-2 text-sm font-medium">Home</span>
      </div>

      <div class="flex flex-col items-center">
        <BoltIcon class="h-10 w-10 text-yellow-500" />
        <span class="mt-2 text-sm font-medium">Fast</span>
      </div>

      <div class="flex flex-col items-center">
        <UserCircleIcon class="h-10 w-10 text-gray-700" />
        <span class="mt-2 text-sm font-medium">Account</span>
      </div>
    </div>
  </main>
</template>
