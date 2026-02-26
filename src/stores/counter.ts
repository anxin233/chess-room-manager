import { defineStore } from 'pinia'
import { ref } from 'vue'

interface CounterState {
  count: number
  history: number[]
}

export const useCounterStore = defineStore('counter', () => {
  // 状态
  const count = ref(0)
  const history = ref<number[]>([])

  // 方法
  const increment = () => {
    count.value++
    addToHistory(count.value)
  }

  const decrement = () => {
    count.value--
    addToHistory(count.value)
  }

  const incrementBy = (amount: number) => {
    count.value += amount
    addToHistory(count.value)
  }

  const reset = () => {
    count.value = 0
    history.value = []
  }

  const addToHistory = (value: number) => {
    history.value.push(value)
    // 只保留最近 10 条记录
    if (history.value.length > 10) {
      history.value.shift()
    }
  }

  return {
    // 状态
    count,
    history,
    // 方法
    increment,
    decrement,
    incrementBy,
    reset
  }
})
