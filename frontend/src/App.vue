<script setup lang="ts">
import { ref } from 'vue'
import { API_URL } from './constants'

const LIMIT = 10

const requestsCount = ref(10)
const delayMs = ref(100)
const isRunning = ref(false)
const testStarted = ref(false)
const isCancel = ref(false)
const isParallel = ref(false)

const sentCount = ref(0)
const successCount = ref(0)
const errorCount = ref(0)
const startTime = ref<number | null>(null)
const elapsedTime = ref(0)
const errorMessages = ref<string[]>([])

async function makeRequest(name: number, offset = 0, limit = LIMIT) {
  sentCount.value++
  const url = `${API_URL}/items?offset=${offset}&limit=${limit}&name=${name}` // Убедитесь, что бэкенд запущен на этом адресе

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Статус HTTP: ${response.status}`)
    }
    await response.json()
    successCount.value++
  } catch (error) {
    errorCount.value++
    let errorMessage
    if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = 'Internal server error'
    }
    errorMessages.value.push(
      `Ошибка запроса (${sentCount.value}): ${errorMessage}`,
    )
  }
}

async function startTest() {
  if (isRunning.value || requestsCount.value <= 0) {
    return
  }

  resetData()
  testStarted.value = true
  isRunning.value = true
  startTime.value = Date.now()
  isCancel.value = false
  const limit = LIMIT

  for (let i = 0; i < requestsCount.value; i++) {
    if (isCancel.value) {
      break
    }

    await makeRequest(i, i * limit, limit)

    elapsedTime.value = Date.now() - startTime.value

    if (i < requestsCount.value - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs.value))
    }
  }

  isRunning.value = false
  elapsedTime.value = Date.now() - startTime.value
}

async function startParallelTest() {
  if (isRunning.value || requestsCount.value <= 0) {
    return
  }

  resetData()
  testStarted.value = true
  isRunning.value = true
  startTime.value = Date.now()
  const limit = LIMIT

  const requests = []
  for (let i = 0; i < requestsCount.value; i++) {
    if (isCancel.value) {
      break
    }

    const request = makeRequest(i, i * limit, limit)
    requests.push(request)
  }

  await Promise.all(requests)

  isRunning.value = false
  elapsedTime.value = Date.now() - startTime.value
}

function resetData() {
  sentCount.value = 0
  successCount.value = 0
  errorCount.value = 0
  startTime.value = null
  elapsedTime.value = 0
  errorMessages.value = []
  testStarted.value = false
}

function cancel() {
  isCancel.value = true
}
</script>

<template>
  <div class="test-container">
    <h1>Инструмент для нагрузочного тестирования</h1>

    <div class="form-group">
      <label for="requestsCount">Количество запросов:</label>
      <input
        id="requestsCount"
        v-model.number="requestsCount"
        type="number"
        min="1"
        :disabled="isRunning"
      />
    </div>

    <div class="form-group">
      <label for="delayMs">Задержка между запросами (мс):</label>
      <input
        id="delayMs"
        v-model.number="delayMs"
        type="number"
        min="0"
        :disabled="isRunning || isParallel"
      />
    </div>
    <div class="actions">
      <div class="start-test">
        <div class="start-test__control">
          <button
            @click="isParallel ? startParallelTest() : startTest()"
            :disabled="isRunning || requestsCount <= 0"
          >
            {{ isRunning ? 'Тест выполняется...' : 'Старт нагрузочного теста' }}
          </button>
          <div>
            <input id="parallel" type="checkbox" v-model="isParallel" />
            <label for="parallel">Параллельно</label>
          </div>
        </div>
      </div>

      <button @click="resetData" :disabled="isRunning">Сбросить данные</button>

      <button @click="cancel" :disabled="!isRunning">Отменить</button>
    </div>

    <div v-if="testStarted" class="results-container">
      <h2>Результаты:</h2>
      <p>
        Статус: <strong>{{ isRunning ? 'Активно' : 'Завершено' }}</strong>
      </p>
      <p>
        Отправлено запросов:
        <strong>{{ sentCount }} / {{ requestsCount }}</strong>
      </p>
      <p style="color: green">
        Успешно: <strong>{{ successCount }}</strong>
      </p>
      <p style="color: red">
        Ошибок: <strong>{{ errorCount }}</strong>
      </p>
      <p>
        Примерное время выполнения: <strong>{{ elapsedTime }} мс</strong>
      </p>

      <div v-if="errorMessages.length" class="errors-list">
        <h3>Ошибки (последние 5):</h3>
        <ul>
          <li v-for="(error, index) in errorMessages.slice(-5)" :key="index">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style>
.test-container {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: sans-serif;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.actions {
  display: flex;
  align-items: start;
}

button {
  padding: 10px 15px;
  margin-right: 10px;
  cursor: pointer;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}

.start-test {
  display: inline-block;
}

.start-test__control {
  display: flex;
  flex-direction: column;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.results-container {
  margin-top: 20px;
  padding: 15px;
  border-top: 1px solid #eee;
}

.errors-list {
  margin-top: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 10px;
  border-radius: 4px;
}

.errors-list ul {
  list-style-type: none;
  padding: 0;
}
</style>
