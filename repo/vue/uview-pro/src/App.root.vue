<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { useTheme, useLocale } from 'uview-pro';
// RB INSTRUMENTATION (repair-bench): read-only bridge + the app-level state it exposes.
import { rbPublish, rbStorage, rbPlain } from '@/common/rb-bridge';
import { useExperienceCenter } from '@/common/useExperienceCenter';
import {
    missionPool,
    getAssignedMissionIds,
    getCompletedMissionIds,
    isMissionAssigned,
    isMissionCompleted
} from '@/common/useExperience';
import i18n from '@/locales';
import { getSafeLocale, getDefaultLocale } from '@/locales';
import { onMounted } from 'vue';

const { darkMode, currentTheme, themes, getDarkMode, isInDarkMode, getAvailableThemes } = useTheme();
const { currentLocale, locales } = useLocale();
// (rb-bridge reads these two refs directly; nothing else about the locale wiring changes.)

onLoad(() => {
    console.log('App.root.vue onLoad');
    console.log('darkMode->', darkMode.value);
    console.log('theme->', currentTheme.value?.name);
    console.log('locale->', currentLocale.value?.name);
    console.log('locales->', locales.value);
});

onShow(() => {
    console.log('App.root.vue onShow');
});

onMounted(() => {
    console.log('App.root.vue onMounted');
    // RB INSTRUMENTATION (repair-bench): publish the global read-only areas ONCE, from the root wrapper,
    // through the existing render path. Nothing here writes application state.
    const center = useExperienceCenter();
    rbPublish('boot', {
        appMounted: () => true,
        rootChildren: () => {
            const el = typeof document !== 'undefined' ? document.querySelector('#app') : null;
            return el ? el.children.length : -1;
        },
        publishedAt: () => Date.now()
    });
    rbPublish('theme', {
        currentName: () => (currentTheme && currentTheme.value ? currentTheme.value.name : null),
        currentLabel: () => (currentTheme && currentTheme.value ? currentTheme.value.label : null),
        primary: () => (currentTheme && currentTheme.value && currentTheme.value.color ? currentTheme.value.color.primary : null),
        names: () => rbPlain((themes && themes.value ? themes.value : []).map((t: any) => t && t.name)),
        count: () => (themes && themes.value ? themes.value.length : -1),
        darkMode: () => (darkMode && darkMode.value !== undefined ? darkMode.value : null),
        getDarkMode: () => (typeof getDarkMode === 'function' ? getDarkMode() : null),
        isInDarkMode: () => (typeof isInDarkMode === 'function' ? isInDarkMode() : null),
        available: () => rbPlain((typeof getAvailableThemes === 'function' ? getAvailableThemes() : []).map((t: any) => t && t.name))
    });
    rbPublish('locale', {
        libraryName: () => (currentLocale && currentLocale.value ? currentLocale.value.name : null),
        libraryCount: () => (locales && locales.value ? locales.value.length : -1),
        libraryNames: () => rbPlain((locales && locales.value ? locales.value : []).map((l: any) => l && l.name)),
        i18nLocale: () => (i18n && i18n.global && i18n.global.locale ? i18n.global.locale.value : null),
        safeLocale: () => getSafeLocale(),
        defaultLocale: () => getDefaultLocale(),
        storageUniLocale: () => rbStorage('UNI_LOCALE')
    });
    rbPublish('xp', {
        xp: () => (center.xp && center.xp.value !== undefined ? center.xp.value : null),
        totalInteractions: () => (center.totalInteractions && center.totalInteractions.value !== undefined ? center.totalInteractions.value : null),
        levelId: () => (center.levelInfo && center.levelInfo.value ? center.levelInfo.value.id : null),
        levelTitle: () => (center.levelInfo && center.levelInfo.value ? center.levelInfo.value.title : null),
        levelThreshold: () => (center.levelInfo && center.levelInfo.value ? center.levelInfo.value.threshold : null),
        nextLevelId: () => (center.nextLevel && center.nextLevel.value ? center.nextLevel.value.id : null),
        nextLevelTitle: () => (center.nextLevel && center.nextLevel.value ? center.nextLevel.value.title : null),
        nextLevelThreshold: () => (center.nextLevel && center.nextLevel.value ? center.nextLevel.value.threshold : null),
        levelProgress: () => (center.levelProgress && center.levelProgress.value !== undefined ? center.levelProgress.value : null),
        mapSteps: () => rbPlain((center.mapSteps && center.mapSteps.value ? center.mapSteps.value : []).map((s: any) => ({ id: s.id, title: s.title, threshold: s.threshold, status: s.status, percent: s.percent }))),
        recentLogs: () => rbPlain((center.recentLogs && center.recentLogs.value ? center.recentLogs.value : []).map((l: any) => l && l.message)),
        logCount: () => (center.recentLogs && center.recentLogs.value ? center.recentLogs.value.length : -1),
        components: () => (center.componentSummary && center.componentSummary.value ? center.componentSummary.value.components : null),
        tasksCompleted: () => (center.componentSummary && center.componentSummary.value ? center.componentSummary.value.tasksCompleted : null),
        totalXP: () => (center.componentSummary && center.componentSummary.value ? center.componentSummary.value.totalXP : null),
        mostActiveKey: () => (center.componentSummary && center.componentSummary.value && center.componentSummary.value.mostActive ? center.componentSummary.value.mostActive.key : null),
        mostActiveXp: () => (center.componentSummary && center.componentSummary.value && center.componentSummary.value.mostActive ? center.componentSummary.value.mostActive.xp : null),
        statKeys: () => rbPlain(Object.keys((center.componentStats && center.componentStats.value) || {})),
        lastGainAmount: () => (center.lastGain && center.lastGain.value ? center.lastGain.value.amount : null),
        lastGainSource: () => (center.lastGain && center.lastGain.value ? center.lastGain.value.source : null),
        lastGainComponent: () => (center.lastGain && center.lastGain.value ? center.lastGain.value.componentKey : null)
    });
    rbPublish('missions', {
        poolIds: () => rbPlain(missionPool.map((m) => m.id)),
        poolSize: () => missionPool.length,
        rewardOf: () => rbPlain(missionPool.map((m) => ({ id: m.id, reward: m.reward, componentKey: m.componentKey }))),
        assigned: () => rbPlain(getAssignedMissionIds()),
        completed: () => rbPlain(getCompletedMissionIds()),
        themeAssigned: () => isMissionAssigned('theme'),
        themeCompleted: () => isMissionCompleted('theme')
    });
    rbPublish('storage', {
        center: () => rbPlain(rbStorage('uview-experience-center')),
        assigned: () => rbPlain(rbStorage('uview-experience-assigned-missions')),
        completed: () => rbPlain(rbStorage('uview-experience-completed-missions')),
        mapMission: () => rbPlain(rbStorage('experience-map-mission')),
        uniLocale: () => rbStorage('UNI_LOCALE'),
        lsKeys: () => {
            try { return typeof localStorage === 'undefined' ? null : Object.keys(localStorage).sort(); } catch (e) { return null; }
        },
        rbResidue: () => {
            // §1.8.7 state-isolation sentinel: the ONLY globals this bridge may create are window.__rb and
            // the per-checkpoint freeze objects the dsl setup writes as window.__rb_<cpid>. Anything else
            // with the __rb prefix means a repair leaked a probe-shaped global of its own.
            try {
                if (typeof window === 'undefined') return null;
                return Object.keys(window).filter((k) => k.indexOf('__rb') === 0 && k !== '__rb' && !/^__rb_[a-z]\d\d$/.test(k)).sort();
            } catch (e) { return null; }
        }
    });
});
</script>

<template>
    <u-config-provider>
        <slot />
        <u-toast global></u-toast>
        <u-modal global></u-modal>
    </u-config-provider>
</template>

<style lang="scss"></style>
