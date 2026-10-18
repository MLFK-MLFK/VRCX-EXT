<template>
    <div class="flex flex-col gap-10 py-2">
        <div
            v-if="!isCustomThemeActive"
            class="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-card/40 px-4 py-3">
            <div class="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                <Info class="mt-0.5 size-4 shrink-0" />
                <span>{{ t('view.settings.custom_theme.inactive_notice') }}</span>
            </div>
            <Button size="sm" class="shrink-0" @click="setThemeMode(CUSTOM_THEME_MODE)">
                {{ t('view.settings.custom_theme.activate') }}
            </Button>
        </div>

        <SettingsGroup :title="t('view.settings.custom_theme.recipe.header')">
            <SettingsItem :label="t('view.settings.custom_theme.recipe.preset')">
                <ToggleGroup
                    type="single"
                    required
                    variant="outline"
                    size="sm"
                    :model-value="activeRecipe ?? ''"
                    @update:model-value="applyRecipe">
                    <ToggleGroupItem v-for="recipe in CUSTOM_THEME_RECIPES" :key="recipe.key" :value="recipe.key">
                        {{ t(`view.settings.custom_theme.recipe.${recipe.key}`) }}
                    </ToggleGroupItem>
                </ToggleGroup>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.custom_theme.reset')"
                :description="t('view.settings.custom_theme.reset_description')">
                <Button size="sm" variant="outline" @click="handleReset">
                    <RotateCcw />
                    {{ t('view.settings.custom_theme.reset') }}
                </Button>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.custom_theme.color.header')">
            <SettingsItem :label="t('view.settings.custom_theme.color.base')">
                <div class="flex items-center gap-2">
                    <SwatchRow
                        :swatches="CUSTOM_THEME_BASE_SWATCHES"
                        :value="customTheme.baseColor"
                        @select="(color) => setCustomTheme({ baseColor: color })" />
                    <ColorPickerButton
                        :model-value="customTheme.baseColor"
                        @change="(color) => setCustomTheme({ baseColor: color })" />
                </div>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.custom_theme.color.accent')"
                :description="t('view.settings.custom_theme.color.accent_description')">
                <div class="flex items-center gap-2">
                    <SwatchRow
                        :swatches="CUSTOM_THEME_ACCENT_SWATCHES"
                        :value="customTheme.accentColor"
                        @select="(color) => setCustomTheme({ accentColor: color })" />
                    <ColorPickerButton
                        :model-value="customTheme.accentColor"
                        @change="(color) => setCustomTheme({ accentColor: color })" />
                </div>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.custom_theme.background.header')">
            <SettingsItem
                :label="t('view.settings.custom_theme.background.enabled')"
                :description="t('view.settings.custom_theme.background.enabled_description')">
                <Switch
                    :model-value="customTheme.backgroundEnabled"
                    :ariaLabel="t('view.settings.custom_theme.background.enabled')"
                    @update:modelValue="(value) => setCustomTheme({ backgroundEnabled: value })" />
            </SettingsItem>

            <SettingsItem :label="t('view.settings.custom_theme.background.image')" :description="backgroundImageName">
                <div class="flex items-center gap-2">
                    <Button size="sm" variant="outline" @click="chooseBackgroundImage">
                        <ImagePlus />
                        {{
                            customTheme.backgroundImage
                                ? t('view.settings.custom_theme.background.replace')
                                : t('view.settings.custom_theme.background.choose')
                        }}
                    </Button>
                    <Button
                        v-if="customTheme.backgroundImage"
                        size="icon-sm"
                        variant="outline"
                        :title="t('view.settings.custom_theme.background.remove')"
                        @click="removeBackgroundImage">
                        <Trash2 />
                    </Button>
                </div>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.custom_theme.background.opacity')">
                <div class="w-75 max-w-full pt-1">
                    <Slider v-model="backgroundOpacityValue" :min="0" :max="100" />
                </div>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.custom_theme.background.blur')"
                :description="t('view.settings.custom_theme.background.hidden_when_off')">
                <div class="flex flex-col items-end gap-2">
                    <div class="w-75 max-w-full pt-1">
                        <Slider v-model="backgroundBlurValue" :min="0" :max="40" />
                    </div>
                    <ToggleGroup
                        type="single"
                        required
                        variant="outline"
                        size="sm"
                        :model-value="activeBlurPreset(CUSTOM_THEME_IMAGE_BLUR_PRESETS, customTheme.backgroundBlur)"
                        @update:model-value="
                            (key) => applyBlurPreset('backgroundBlur', CUSTOM_THEME_IMAGE_BLUR_PRESETS, key)
                        ">
                        <ToggleGroupItem
                            v-for="preset in CUSTOM_THEME_IMAGE_BLUR_PRESETS"
                            :key="preset.key"
                            :value="preset.key">
                            {{ t(`view.settings.custom_theme.blur.${preset.key}`) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.custom_theme.background.fit')">
                <Select
                    :model-value="customTheme.backgroundFit"
                    @update:modelValue="(value) => setCustomTheme({ backgroundFit: value })">
                    <SelectTrigger class="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem v-for="fit in CUSTOM_THEME_BACKGROUND_FITS" :key="fit" :value="fit">
                                {{ t(`view.settings.custom_theme.fit.${fit}`) }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.custom_theme.surface.header')">
            <SettingsItem
                :label="t('view.settings.custom_theme.surface.opacity')"
                :description="t('view.settings.custom_theme.surface.opacity_description')">
                <div class="w-75 max-w-full pt-1">
                    <Slider v-model="surfaceOpacityValue" :min="0" :max="100" />
                </div>
            </SettingsItem>

            <SettingsItem :label="t('view.settings.custom_theme.surface.blur')">
                <div class="flex flex-col items-end gap-2">
                    <div class="w-75 max-w-full pt-1">
                        <Slider v-model="surfaceBlurValue" :min="0" :max="40" />
                    </div>
                    <ToggleGroup
                        type="single"
                        required
                        variant="outline"
                        size="sm"
                        :model-value="activeBlurPreset(CUSTOM_THEME_SURFACE_BLUR_PRESETS, customTheme.surfaceBlur)"
                        @update:model-value="
                            (key) => applyBlurPreset('surfaceBlur', CUSTOM_THEME_SURFACE_BLUR_PRESETS, key)
                        ">
                        <ToggleGroupItem
                            v-for="preset in CUSTOM_THEME_SURFACE_BLUR_PRESETS"
                            :key="preset.key"
                            :value="preset.key">
                            {{ t(`view.settings.custom_theme.blur.${preset.key}`) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.custom_theme.surface.radius')"
                :description="t('view.settings.custom_theme.surface.radius_description')">
                <div class="w-75 max-w-full pt-1">
                    <Slider v-model="radiusValue" :min="0" :max="20" />
                </div>
            </SettingsItem>
        </SettingsGroup>

        <SettingsGroup :title="t('view.settings.custom_theme.overlay.header')">
            <SettingsItem
                :label="t('view.settings.custom_theme.overlay.opacity')"
                :description="t('view.settings.custom_theme.overlay.opacity_description')">
                <div class="w-75 max-w-full pt-1">
                    <Slider v-model="overlayOpacityValue" :min="0" :max="100" />
                </div>
            </SettingsItem>

            <SettingsItem
                :label="t('view.settings.custom_theme.overlay.blur')"
                :description="t('view.settings.custom_theme.overlay.blur_description')">
                <div class="flex flex-col items-end gap-2">
                    <div class="w-75 max-w-full pt-1">
                        <Slider v-model="overlayBlurValue" :min="0" :max="40" />
                    </div>
                    <ToggleGroup
                        type="single"
                        required
                        variant="outline"
                        size="sm"
                        :model-value="activeBlurPreset(CUSTOM_THEME_OVERLAY_BLUR_PRESETS, customTheme.overlayBlur)"
                        @update:model-value="
                            (key) => applyBlurPreset('overlayBlur', CUSTOM_THEME_OVERLAY_BLUR_PRESETS, key)
                        ">
                        <ToggleGroupItem
                            v-for="preset in CUSTOM_THEME_OVERLAY_BLUR_PRESETS"
                            :key="preset.key"
                            :value="preset.key">
                            {{ t(`view.settings.custom_theme.blur.${preset.key}`) }}
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </SettingsItem>
        </SettingsGroup>
    </div>
</template>

<script setup>
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';
    import { toast } from 'vue-sonner';
    import { ImagePlus, Info, RotateCcw, Trash2 } from 'lucide-vue-next';

    import { useAppearanceSettingsStore } from '@/stores';
    import {
        CUSTOM_THEME_ACCENT_SWATCHES,
        CUSTOM_THEME_BACKGROUND_FITS,
        CUSTOM_THEME_BASE_SWATCHES,
        CUSTOM_THEME_IMAGE_BLUR_PRESETS,
        CUSTOM_THEME_IMAGE_FILTER,
        CUSTOM_THEME_MODE,
        CUSTOM_THEME_OVERLAY_BLUR_PRESETS,
        CUSTOM_THEME_RECIPES,
        CUSTOM_THEME_SURFACE_BLUR_PRESETS
    } from '@/shared/constants';
    import ColorPickerButton from '@/components/ColorPickerButton.vue';
    import { Button } from '@/components/ui/button';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Slider } from '@/components/ui/slider';
    import { Switch } from '@/components/ui/switch';
    import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

    import SettingsGroup from '../SettingsGroup.vue';
    import SettingsItem from '../SettingsItem.vue';
    import SwatchRow from './CustomThemeSwatchRow.vue';

    const { t } = useI18n();

    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { customTheme, themeMode } = storeToRefs(appearanceSettingsStore);
    const { setCustomTheme, resetCustomTheme, setThemeMode } = appearanceSettingsStore;

    const isCustomThemeActive = computed(() => themeMode.value === CUSTOM_THEME_MODE);

    const backgroundImageName = computed(() => {
        const path = customTheme.value.backgroundImage;
        if (!path) {
            return t('view.settings.custom_theme.background.none');
        }
        return path.split(/[\\/]/).pop() || path;
    });

    const activeRecipe = computed(() => {
        const current = customTheme.value;
        const matched = CUSTOM_THEME_RECIPES.find((recipe) =>
            Object.entries(recipe.values).every(([key, value]) => current[key] === value)
        );
        return matched?.key ?? null;
    });

    /**
     * @param {string} key
     * @returns {import('vue').WritableComputedRef<number[]>}
     */
    function createSliderModel(key) {
        return computed({
            get: () => [customTheme.value[key]],
            set: (value) => {
                const next = value?.[0];
                if (typeof next === 'number') {
                    setCustomTheme({ [key]: next });
                }
            }
        });
    }

    const backgroundOpacityValue = createSliderModel('backgroundOpacity');
    const backgroundBlurValue = createSliderModel('backgroundBlur');
    const surfaceOpacityValue = createSliderModel('surfaceOpacity');
    const surfaceBlurValue = createSliderModel('surfaceBlur');
    const overlayOpacityValue = createSliderModel('overlayOpacity');
    const overlayBlurValue = createSliderModel('overlayBlur');
    const radiusValue = createSliderModel('radius');

    /**
     * @param {{ key: string; value: number }[]} presets
     * @param {number} value
     * @returns {string}
     */
    function activeBlurPreset(presets, value) {
        return presets.find((preset) => preset.value === value)?.key ?? '';
    }

    /**
     * @param {string} key
     * @param {{ key: string; value: number }[]} presets
     * @param {string} presetKey
     */
    function applyBlurPreset(key, presets, presetKey) {
        const preset = presets.find((item) => item.key === presetKey);
        if (!preset) {
            return;
        }
        setCustomTheme({ [key]: preset.value });
    }

    /**
     * @param {string} recipeKey
     */
    function applyRecipe(recipeKey) {
        const recipe = CUSTOM_THEME_RECIPES.find((item) => item.key === recipeKey);
        if (!recipe) {
            return;
        }
        setCustomTheme(recipe.values);
    }

    async function handleReset() {
        await resetCustomTheme();
        toast.success(t('view.settings.custom_theme.reset_done'));
    }

    async function chooseBackgroundImage() {
        try {
            const selected = await AppApi.OpenFileSelectorDialog(null, '', CUSTOM_THEME_IMAGE_FILTER);
            if (!selected) {
                return;
            }
            const stored = await AppApi.StoreCustomThemeImage(selected);
            if (!stored) {
                toast.error(t('view.settings.custom_theme.background.store_failed'));
                return;
            }
            await setCustomTheme({ backgroundImage: stored, backgroundEnabled: true });
        } catch (error) {
            console.error('Failed to choose custom theme background image:', error);
            toast.error(t('view.settings.custom_theme.background.store_failed'));
        }
    }

    async function removeBackgroundImage() {
        await setCustomTheme({ backgroundImage: '' });
    }
</script>
