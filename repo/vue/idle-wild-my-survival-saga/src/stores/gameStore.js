import { defineStore } from 'pinia'
import { omit } from 'lodash-es'
import { encryptData, decryptData } from '../plugins/crypto'
import { skillTree, skills } from '../plugins/skillTree'
import { merchants } from '../plugins/merchants'
import { resources, resourceLimits } from '../plugins/resource'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 玩家基本信息
    player: {
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      // 生存天数
      days: 0,
      // 探索次数
      explorationCount: 0,
    },
    // 技能系统
    skillTreeEffects: {
      // 采集效果
      gatheringEfficiency: 0,
      gatheringEnergyCost: 0,
      rareHerbChance: 0,
      gatheringYield: 0,
      // 制作效果
      craftingSpeed: 0,
      resourceSaving: 0,
      extraCraftingOutput: 0,
      toolDurability: 0,
      craftingQuality: 0,
      unlockAdvancedRecipes: false,
      // 生存效果
      foodConsumption: 0,
      waterConsumption: 0,
      weatherResistance: 0,
      energyConsumption: 0,
      healthRecovery: 0,
      allSurvivalStats: 0,
      // 研究效果
      researchSpeed: 0,
      techFragmentYield: 0,
      researchResourceSaving: 0,
      unlockAdvancedTech: false,
      allResearchBonus: 0,
      breakthroughChance: 0,
      // 战斗效果
      damageBonus: 0,
      damageReduction: 0,
      criticalChance: 0,
      retreatEnergyCost: 0,
      allCombatStats: 0,
      unlockSpecialCombat: false
    },
    // 已解锁的技能
    unlockedSkills: {},
    // 季节系统
    season: {
      // 季节长度（天）
      seasonLength: 30,
      // 季节效果
      effects: {
        foodGrowthRate: 1.0,
        herbGrowthRate: 1.0,
        energyConsumption: 1.0,
        waterConsumption: 1.0
      }
    },
    // 天气系统
    weather: {
      current: 'clear', // 当前天气类型
      duration: 6, // 持续时间（小时）
      nextChangeDay: 1, // 下次变化的天数
      nextChangeHour: 6, // 下次变化的小时
      effects: {
        gatheringEfficiency: 1.0, // 采集效率修正
        energyConsumption: 1.0, // 体力消耗修正
        waterConsumption: 1.0, // 水消耗修正
        foodConsumption: 1.0, // 食物消耗修正
        explorationEfficiency: 1.0 // 探索效率修正
      }
    },
    // 今天是否已经触发了事件
    eventTriggered: false,
    // 基础资源
    resources,
    // 资源上限
    resourceLimits,
    // 技能等级
    newSkills: skills,
    // 已解锁的建筑
    buildings: [],
    // 当前进行中的活动
    currentActivities: [],
    // 等待中的活动队列
    pendingActivities: [],
    // 当前进行中的研究
    researchActivities: [],
    // 等待中的研究队列
    pendingResearchActivities: [],
    // 当前进行中的探索
    explorationActivities: [],
    // 等待中的探索队列
    pendingExplorationActivities: [],
    // 当前进行中的建筑
    buildingActivities: [],
    // 等待中的建筑队列
    pendingBuildingActivities: [],
    // 当前进行中的技能
    skillActivities: [],
    // 等待中的技能队列
    pendingSkillActivities: [],
    // 游戏时间
    gameTime: {
      day: 1,
      hour: 6, // 游戏从早上6点开始
      minute: 0,
      // 时间流逝速度，实际秒:游戏分钟
      timeScale: 1, // 1秒 = 1分钟游戏时间
      // 游戏开始的时间戳
      startTime: Date.now(),
      // 当前游戏时间戳
      get timestamp() {
        return Date.now()
      }
    },
    // 已研究
    researched: [],
    recipes: [],
    // 游戏设置
    settings: {
      autoSave: true,
      darkMode: false,
      soundEnabled: true,
      notificationsEnabled: true,
    },
    // 事件日志
    eventLog: [],
    // 成就系统
    achievements: {
      // 已解锁的成就ID列表
      unlocked: [],
      // 成就相关的计数器
      explorationCount: 0,
      extremeWeatherSurvived: false,
      healthyDays: 0,
      // 其他成就相关的状态
      resourcesCollected: {
        food: 0,
        water: 0,
        wood: 0,
        stone: 0,
        metal: 0,
        herb: 0
      }
    },
    // 游戏状态
    gameState: 'playing', // playing, paused, gameover
    // 任务系统
    activeQuests: [], // 进行中的任务
    completedQuests: [] // 已完成的任务
  }),
  getters: {
    // 计算玩家总体实力
    playerPower: (state) => {
      return Object.values(state.skills).reduce((sum, level) => sum + level, 0)
    },
    // 计算资源总量
    totalResources: (state) => {
      return Object.values(state.resources).reduce((sum, amount) => sum + amount, 0)
    },
    // 计算当前时间字符串
    currentTimeString: (state) => {
      const { day, hour, minute } = state.gameTime
      return `第${day}天 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    },
    // 检查资源是否足够
    hasEnoughResources: (state) => (requirements) => {
      for (const [resource, amount] of Object.entries(requirements)) {
        if (state.resources[resource] < amount) return false
      }
      return true
    },
  },
  actions: {
    // 初始化游戏
    initGame() {
      // 重置游戏状态
      this.$reset()
      localStorage.removeItem(__APP_NAME__)
      this.saveGame()
      this.loadGame()
      this.addToEventLog('你醒来了，发现自己身处一片荒野...')
    },
    // 保存游戏
    saveGame() {
      const filteredState = omit(this.$state, ['eventLog'])
      const encryptedData = encryptData(filteredState)
      if (encryptedData) {
        try {
          const encodedAppName = btoa(`+++${__APP_NAME__}`)
          localStorage.setItem(__APP_NAME__, `${encryptedData}${encodedAppName}`)
          this.addToEventLog('游戏数据已保存')
        } catch (error) {
          this.addToEventLog('数据保存失败:', error)
        }
      } else {
        this.addToEventLog('数据加密失败')
      }
    },
    // 加载游戏
    loadGame() {
      const data = localStorage.getItem(__APP_NAME__)
      if (data) {
        const encodedAppName = btoa(`+++${__APP_NAME__}`)
        const saveData = data.replace(encodedAppName, '')
        if (saveData) {
          try {
            this.$state = decryptData(saveData)
            this.resetSkillEffects()
            this.initBuildingEffects()
            this.fixSkills()
            this.addToEventLog('游戏已加载')
            return true
          } catch (error) {
            this.addToEventLog('数据加载失败:', error)
          }
        }
      }
      return false
    },
    // 初始化建筑资源上限效果
    initBuildingEffects() {
      // 遍历所有建筑应用永久效果
      for (const building of this.buildings) {
        if (!building.effects) continue
        // 应用存储上限效果
        if (building.effects.storageMultiplier) {
          for (const resource in resourceLimits) {
            this.resourceLimits[resource] = resourceLimits[resource] * building.effects.storageMultiplier
            if (this.resources[resource] > this.resourceLimits[resource]) {
              this.resources[resource] = this.resourceLimits[resource]
            }
          }
        }
      }
    },
    // 修复技能问题
    fixSkills() {
      // 初始化修复技能问题
      const skillsArray = Object.values(this.newSkills)
      const fixedSkills = {}
      Object.keys(this.newSkills).forEach((key, index) => {
        const item = skillsArray[index]
        fixedSkills[key] = typeof item === 'string' ? Object.values(skills)[index] : item
      })
      this.newSkills = fixedSkills
    },
    // 重置错误的技能效果
    resetSkillEffects() {
      for (const skillId in this.skillTreeEffects) {
        if (typeof this.skillTreeEffects[skillId] === 'number') {
          const skillData = this.findSkillEffectById(skillId)
          if (skillData) {
            const { effects, maxLevel } = skillData
            for (const [effect, value] of Object.entries(effects)) {
              if (this.skillTreeEffects[value[0]] !== undefined) {
                if (typeof value[1] === 'number') {
                  const targetValue = value[1] * maxLevel
                  // 处理正效果（上限）
                  if (value[1] > 0 && this.skillTreeEffects[value[0]] > targetValue) {
                    this.skillTreeEffects[value[0]] = parseFloat(targetValue.toFixed(2))
                  }
                  // 处理负效果（下限）
                  else if (value[1] < 0 && this.skillTreeEffects[value[0]] < targetValue) {
                    this.skillTreeEffects[value[0]] = parseFloat(targetValue.toFixed(2))
                  }
                }
              }
            }
          }
        }
      }
    },
    findSkillEffectById(skillId) {
      for (const branch of Object.values(skillTree)) {
        for (const skill of branch.skills) {
          for (const [effect, value] of Object.entries(skill.effects)) {
            if (effect === skillId) {
              return {
                effects: Object.entries(skill.effects), // 获取键值对
                maxLevel: skill.maxLevel // 获取 maxLevel
              }
            }
          }
        }
      }
      return null // 如果未找到，返回 null
    },
    // 添加资源
    addResource(resource, amount) {
      if (!this.resources.hasOwnProperty(resource)) return false
      // 确保不超过上限
      const newAmount = this.resources[resource] + amount
      this.resources[resource] = Math.min(newAmount, this.resourceLimits[resource])
      return true
    },
    // 消耗资源
    consumeResource(resource, amount) {
      if (!this.resources.hasOwnProperty(resource)) return false
      if (this.resources[resource] < amount) return false
      this.resources[resource] -= amount
      return true
    },
    // 增加技能经验
    addSkillExp(skill, exp) {
      this.newSkills[skill].exp += exp
      this.addToEventLog(`你获得了${exp}点${this.getResourceName(skill)}技能经验`)
      if (this.newSkills[skill].exp >= this.newSkills[skill].expToNextLevel) {
        this.newSkills[skill].exp -= this.newSkills[skill].expToNextLevel
        this.newSkills[skill].level += 1
        // 增加下一级所需经验
        this.newSkills[skill].expToNextLevel = Math.floor(this.newSkills[skill].expToNextLevel * 2.0)
        this.addToEventLog(`${this.getResourceName(skill)}技能提升到${this.newSkills[skill].level}级！`)
      }
      this.saveGame()
    },
    // 计算当前可用的商人
    availableMerchants() {
      const currentDay = this.gameTime.day
      return merchants.filter(merchant => {
        // 检查是否达到最小天数要求
        if (currentDay < merchant.availability.minDay) return false
        // 计算商人是否在当前日期出现
        const daysSinceMinDay = currentDay - merchant.availability.minDay
        const cyclePosition = daysSinceMinDay % merchant.availability.frequency
        return cyclePosition < merchant.availability.duration
      })
    },
    // 获取资源名称
    getResourceName(resourceKey) {
      const resourceNames = {
        exp: '幸存者经验',
        maxHealth: '最大健康',
        maxEnergy: '最大体力',
        health: '健康',
        energy: '体力',
        food: '食物',
        water: '水',
        wood: '木材',
        stone: '石头',
        metal: '金属',
        herb: '草药',
        medicine: '药品',
        tools: '工具',
        parts: '零件',
        fuel: '燃料',
        gathering: '采集',
        crafting: '制作',
        combat: '战斗',
        survival: '生存',
        research: '研究',
        predator: '野兽袭击',
        storm: '遭遇风暴',
        rockslide: '遭遇坍塌',
        radiation: '受到辐射',
        hostiles: '遭遇敌对人员',
        thirst: '消耗额外水资源',
        creatures: '遭遇奇怪的生物',
        ancientRelic: '古代遗物',
        techFragment: '科技碎片',
        advanced_parts: '高级零件',
        electronic_components: '电子元件',
        rare_herb: '稀有草药',
        crystal: '水晶',
        explorationCount: '探索次数',
      }
      return resourceNames[resourceKey] || resourceKey
    },
    // 检查是否需要更新天气
    checkWeatherChange() {
      const currentDay = this.gameTime.day
      const currentHour = this.gameTime.hour
      // 生成天气
      if (currentDay > this.weather.nextChangeDay ||
        (currentDay === this.weather.nextChangeDay &&
          currentHour >= this.weather.nextChangeHour)) {

        // 获取当前季节
        const day = this.gameTime.day
        const seasonLength = 30 // 每个季节30天
        const seasonIndex = Math.floor((day - 1) % (seasonLength * 4) / seasonLength)
        const seasons = ['spring', 'summer', 'autumn', 'winter']
        const currentSeason = seasons[seasonIndex]
        // 各季节天气概率
        const weatherProbabilities = {
          spring: {
            clear: 0.3,
            cloudy: 0.3,
            rainy: 0.25,
            foggy: 0.1,
            windy: 0.05
          },
          summer: {
            clear: 0.4,
            cloudy: 0.2,
            rainy: 0.15,
            hot: 0.15,
            storm: 0.1
          },
          autumn: {
            clear: 0.25,
            cloudy: 0.3,
            rainy: 0.2,
            foggy: 0.15,
            windy: 0.1
          },
          winter: {
            clear: 0.2,
            cloudy: 0.2,
            cold: 0.3,
            snow: 0.2,
            windy: 0.1
          }
        }
        // 获取当前季节的天气概率
        const probabilities = weatherProbabilities[currentSeason]
        // 随机选择天气
        let random = Math.random()
        let cumulativeProbability = 0
        let selectedWeather = 'clear' // 默认晴天
        for (const [weather, probability] of Object.entries(probabilities)) {
          cumulativeProbability += probability
          if (random <= cumulativeProbability) {
            selectedWeather = weather
            break
          }
        }
        // 更新天气状态
        const oldWeather = this.weather.current
        this.weather.current = selectedWeather
        // 设置天气持续时间（4-8小时）
        this.weather.duration = 4 + Math.floor(Math.random() * 5)
        // 更新下次天气变化时间
        let nextHour = this.gameTime.hour + this.weather.duration
        let nextDay = this.gameTime.day
        while (nextHour >= 24) {
          nextHour -= 24
          nextDay += 1
        }
        this.weather.nextChangeDay = nextDay
        this.weather.nextChangeHour = nextHour
        const weatherEffects = {
          clear: '视野良好，采集效率+10%',
          cloudy: '温度适宜，体力消耗-5%',
          rainy: '水资源收集+20%，移动速度-10%',
          foggy: '视野受限，探索效率-20%',
          windy: '体力消耗+10%，有机会发现特殊资源',
          hot: '水分消耗+30%，体力恢复-20%',
          cold: '食物消耗+30%，体力恢复-20%',
          snow: '移动速度-30%，采集效率-20%',
          storm: '无法外出，有触发灾害风险',
          heavyRain: '水资源收集+50%，采集效率-30%，有触发洪水风险'
        }
        // 只有当天气变化时才记录日志
        if (oldWeather !== selectedWeather) this.addToEventLog(`天气变为${this.getWeatherName()}，${weatherEffects[this.weather.current] || ''}`)
        // 重置天气效果
        this.weather.effects = {
          gatheringEfficiency: 1.0,
          energyConsumption: 1.0,
          waterConsumption: 1.0,
          foodConsumption: 1.0,
          explorationEfficiency: 1.0
        }
      }
    },
    // 获取天气名称
    getWeatherName() {
      const weatherNames = {
        clear: '晴朗',
        cloudy: '多云',
        rainy: '小雨',
        foggy: '雾天',
        windy: '大风',
        hot: '酷热',
        cold: '寒冷',
        snow: '降雪',
        storm: '风暴',
        heavyRain: '暴雨'
      }
      return weatherNames[this.weather.current] || '未知'
    },
    // 触发随机事件
    triggerRandomEvent() {
      // 基础事件
      const basicEvents = [
        {
          id: 'rain', name: '下雨了', effect: () => {
            this.addResource('water', 10)
            this.addToEventLog('下雨了，你收集了一些雨水')
          },
          weight: 10 // 权重，决定事件触发概率
        },
        {
          id: 'animal', name: '野生动物', effect: () => {
            if (this.newSkills.combat > 2) {
              this.addResource('food', 15)
              this.addToEventLog('你成功猎到了一只野兔，获得了食物')
            } else {
              this.addToEventLog('你看到一只野兔，但它跑得太快了')
            }
          },
          weight: 8
        },
        {
          id: 'stranger', name: '陌生人', effect: () => {
            this.addToEventLog('你遇到了一个陌生人，他给了你一些建议就离开了')
            this.addSkillExp('survival', 20)
          },
          weight: 6
        },
        {
          id: 'wild_fruits', name: '野果丰收', effect: () => {
            this.addResource('food', 8)
            this.addToEventLog('你发现了一片野果丛，收获了不少食物')
          },
          weight: 10
        },
        {
          id: 'herb_discovery', name: '草药发现', effect: () => {
            this.addResource('herb', 5)
            this.addToEventLog('你发现了一片罕见的草药，这对制作药品很有帮助')
          },
          weight: 7
        },
      ]
      // 危险事件
      const dangerEvents = [
        {
          id: 'storm', name: '暴风雨', effect: () => {
            // 检查是否有庇护所
            const hasShelter = this.buildings.some(b => b.id === 'shelter' && b.level >= 1)
            if (hasShelter) {
              this.addToEventLog('一场暴风雨来袭，但你的庇护所提供了良好的保护')
              this.player.health -= this.player.health * 0.05 // 仍有轻微影响
            } else {
              this.addToEventLog('一场暴风雨来袭，你被淋得浑身湿透，健康都受到了影响')
              this.player.health -= this.player.health * 0.1
            }
          },
          weight: 5,
          minDay: 3 // 最早在第3天触发
        },
        {
          id: 'illness', name: '疾病', effect: () => {
            if (this.resources.medicine > 0) {
              this.consumeResource('medicine', 1)
              this.addToEventLog('你感到身体不适，但幸好有药品治疗，很快就恢复了')
            } else {
              this.player.health -= this.player.health * 0.15
              this.player.energy -= this.player.energy * 0.2
              this.addToEventLog('你生病了，没有药品治疗，健康状况恶化')
            }
          },
          weight: 4,
          minDay: 5
        },
        {
          id: 'predator', name: '掠食者', effect: () => {
            if (this.newSkills.combat >= 3) {
              this.addToEventLog('一只野兽袭击了你，但你成功击退了它，还获得了一些食物')
              this.addResource('food', 20)
              this.addSkillExp('combat', 20)
            } else {
              this.player.health -= this.player.health * 0.2
              this.addToEventLog('一只野兽袭击了你，你勉强逃脱，但受了伤')
            }
          },
          weight: 3,
          minDay: 7
        },
      ]
      // 幸运事件
      const luckyEvents = [
        {
          id: 'abandoned_supplies', name: '废弃物资', effect: () => {
            this.addResource('food', 10)
            this.addResource('water', 10)
            this.addResource('medicine', 1)
            this.addToEventLog('你发现了一些废弃的物资，获得了食物、水和药品')
          },
          weight: 3,
          minDay: 4
        },
        {
          id: 'tech_discovery', name: '科技发现', effect: () => {
            this.addResource('techFragment', 2)
            this.addToEventLog('你发现了一些古老的科技碎片，这对研究很有帮助')
          },
          weight: 2,
          minDay: 10
        },
        {
          id: 'ancient_cache', name: '古代宝藏', effect: () => {
            this.addResource('ancientRelic', 1)
            this.addResource('metal', 15)
            this.addResource('parts', 3)
            this.addToEventLog('你发现了一个古代文明的宝藏，获得了珍贵的资源')
          },
          weight: 1,
          minDay: 15
        },
      ]
      // 根据游戏天数选择可用事件
      let availableEvents = [...basicEvents]
      if (this.gameTime.day >= 3) availableEvents = availableEvents.concat(dangerEvents.filter(e => this.gameTime.day >= (e.minDay || 0)))
      if (this.gameTime.day >= 4) availableEvents = availableEvents.concat(luckyEvents.filter(e => this.gameTime.day >= (e.minDay || 0)))
      // 计算总权重
      const totalWeight = availableEvents.reduce((sum, event) => sum + (event.weight || 1), 0)
      // 25%概率触发随机事件
      if (Math.random() < 0.25) {
        // 根据权重随机选择事件
        let randomWeight = Math.random() * totalWeight
        let selectedEvent = null
        for (const event of availableEvents) {
          randomWeight -= (event.weight || 1)
          if (randomWeight <= 0) {
            selectedEvent = event
            break
          }
        }
        if (selectedEvent) selectedEvent.effect()
      }
    },
    // 游戏结束
    gameOver() {
      this.gameState = 'gameover'
      this.saveGame()
      this.addToEventLog('你没能生存下来...')
    },
    // 添加事件日志
    addToEventLog(message) {
      const timestamp = `${this.gameTime.day}天 ${this.gameTime.hour}:${this.gameTime.minute}`
      this.eventLog.unshift({ timestamp, message })
      // 限制日志长度
      if (this.eventLog.length > 100) this.eventLog.pop()
    },
  },
})