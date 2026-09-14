<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { resources, resourceLimits } from '../plugins/resource'

const gameStore = useGameStore()

// 资源列表
const basicResources = computed(() => [
  { key: 'food', name: '食物', icon: '🍖' },
  { key: 'water', name: '水', icon: '💧' },
  { key: 'wood', name: '木材', icon: '🌲' },
  { key: 'stone', name: '石头', icon: '🗿' },
  { key: 'metal', name: '金属', icon: '⚙️' },
  { key: 'herb', name: '草药', icon: '🌿' },
  { key: 'rare_herb', name: '稀有草药', icon: '🌱' },
])

const advancedResources = computed(() => [
  { key: 'medicine', name: '药品', icon: '💊' },
  { key: 'tools', name: '工具', icon: '🔨' },
  { key: 'parts', name: '零件', icon: '⚙️' },
  { key: 'advanced_parts', name: '高级零件', icon: '🔧' },
  { key: 'electronic_components', name: '电子元件', icon: '🔌' },
  { key: 'fuel', name: '燃料', icon: '⛽' },
])

const specialResources = computed(() => [
  { key: 'crystal', name: '水晶', icon: '💎' },
  { key: 'ancientRelic', name: '古代遗物', icon: '🏺' },
  { key: 'techFragment', name: '科技碎片', icon: '💾' },
])

// 获取资源数量
const getResourceAmount = (key) => {
  return Math.ceil(gameStore.resources[key] || 0)
}

// 获取资源上限
const getResourceLimit = (key) => {
  return Math.ceil(gameStore.resourceLimits[key] || 0)
}

// 计算资源百分比
const getResourcePercentage = (key) => {
  const amount = getResourceAmount(key)
  const limit = getResourceLimit(key)
  // 防止除以零或未定义值导致NaN
  if (!limit || limit <= 0) return 0
  // 确保百分比不超过100
  return Math.ceil(Math.min((amount / limit) * 100, 100))
}

// 重置资源上限到基础值
const resetResourceLimits = () => {
  for (const resource in resourceLimits) {
    // 资源
    if (typeof gameStore.resources[resource] !== 'number') {
      gameStore.resources[resource] = resources[resource]
    }
    // 资源上限
    if (typeof gameStore.resourceLimits[resource] !== 'number') {
      gameStore.resourceLimits[resource] = resourceLimits[resource]
    }
  }
}

// 同步资源上限数据
const refreshResourceData = () => {
  ElMessageBox.confirm('是否需要同步资源的数据?', '提示', {
    confirmButtonText: '确定',
    showCancelButton: true,
    cancelButtonText: '取消',
    lockScroll: false
  }).then(() => {
    resetResourceLimits()
    gameStore.saveGame()
    ElMessage.success('资源上限数据已同步')
  }).catch(() => { })
}
</script>

<template>
  <div class="resource-panel">
    <h3 class="resource-panel-h3">
      <span>资源</span>
      <span class="resource-panel-name" @click="refreshResourceData">
        <el-icon>
          <Refresh />
        </el-icon>
      </span>
    </h3>
    <div class="resource-section">
      <h4>基础资源</h4>
      <div class="resource-grid">
        <div v-for="resource in basicResources" :key="resource.key" class="resource-item">
          <div class="resource-icon">{{ resource.icon }}</div>
          <div class="resource-info">
            <div class="resource-name">{{ resource.name }}</div>
            <el-progress :percentage="getResourcePercentage(resource.key)"
              :format="() => `${getResourceAmount(resource.key)}/${getResourceLimit(resource.key)}`" :stroke-width="10"
              :color="getResourcePercentage(resource.key) < 20 ? '#F56C6C' : ''" />
          </div>
        </div>
      </div>
    </div>
    <div class="resource-section">
      <h4>高级资源</h4>
      <div class="resource-grid">
        <div v-for="resource in advancedResources" :key="resource.key" class="resource-item">
          <div class="resource-icon">{{ resource.icon }}</div>
          <div class="resource-info">
            <div class="resource-name">{{ resource.name }}</div>
            <el-progress :percentage="getResourcePercentage(resource.key)"
              :format="() => `${getResourceAmount(resource.key)}/${getResourceLimit(resource.key)}`"
              :stroke-width="10" />
          </div>
        </div>
      </div>
    </div>
    <div class="resource-section">
      <h4>特殊资源</h4>
      <div class="resource-grid">
        <div v-for="resource in specialResources" :key="resource.key" class="resource-item">
          <div class="resource-icon">{{ resource.icon }}</div>
          <div class="resource-info">
            <div class="resource-name">{{ resource.name }}</div>
            <el-progress :percentage="getResourcePercentage(resource.key)"
              :format="() => `${getResourceAmount(resource.key)}/${getResourceLimit(resource.key)}`" :stroke-width="10"
              color="#67C23A" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resource-panel {
  background-color: var(--el-bg-color-overlay);
  border-radius: 4px;
  padding: 10px;
}

.resource-panel-h3 {
  display: flex;
}

.resource-panel-name {
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.resource-section {
  margin-bottom: 15px;
}

.resource-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1em;
  color: var(--el-text-color-secondary);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.resource-item {
  display: flex;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
  transition: background-color 0.3s;
}

.resource-item:hover {
  background-color: var(--el-fill-color-light);
}

.resource-icon {
  font-size: 1.5em;
  margin-right: 10px;
  width: 30px;
  text-align: center;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-size: 0.9em;
  margin-bottom: 5px;
}
</style>