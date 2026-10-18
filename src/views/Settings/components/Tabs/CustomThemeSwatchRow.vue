<template>
    <div class="flex items-center gap-1">
        <button
            v-for="swatch in swatches"
            :key="swatch"
            type="button"
            class="size-5 shrink-0 cursor-pointer rounded-full border border-border transition-transform hover:scale-110"
            :class="
                swatch.toLowerCase() === value.toLowerCase()
                    ? 'ring-2 ring-ring ring-offset-1 ring-offset-background'
                    : ''
            "
            :style="{ backgroundColor: swatch }"
            :title="swatch"
            @click="$emit('select', swatch)" />
    </div>
</template>

<script setup>
    defineProps({
        swatches: { type: Array, required: true },
        value: { type: String, default: '' }
    });

    defineEmits(['select']);
</script>
