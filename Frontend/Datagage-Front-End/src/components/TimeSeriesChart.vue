<template>
  <div class="time-series-chart">
    <v-card class="chart-card">
      <v-card-title class="d-flex align-center">
        {{ title }}
        <v-spacer></v-spacer>
        <v-chip size="small" color="info" class="mr-2" v-if="metric">{{ metric }}</v-chip>
        <v-btn-toggle v-model="selectedView" mandatory density="compact" variant="outlined">
          <v-btn value="line" size="small">
            <v-icon>mdi-chart-line</v-icon>
          </v-btn>
          <v-btn value="bar" size="small">
            <v-icon>mdi-chart-bar</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-card-text>
        <div v-if="!timeData || timeData.length === 0" class="d-flex justify-center align-center pa-8">
          <v-icon size="48" color="grey" class="mr-4">mdi-chart-timeline-variant</v-icon>
          <div class="text-subtitle-1">No data available for chart</div>
        </div>
        <div v-else>
          <!-- Line Chart View -->
          <div v-if="selectedView === 'line'" class="line-chart-container">
            <div class="line-chart">
              <div class="chart-y-axis">
                <div v-for="tick in yAxisTicks" :key="tick" class="chart-y-tick">
                  {{ formatValue(tick) }}
                </div>
              </div>
              <div class="chart-canvas">
                <svg class="chart-line" :viewBox="`0 0 ${timeData.length * 60 - 20} 200`">
                  <path :d="linePathD" stroke="var(--v-primary-base)" fill="none" stroke-width="2"></path>
                  <path :d="areaPathD" fill="var(--v-primary-base)" opacity="0.2"></path>
                </svg>
                <div class="chart-points">
                  <div 
                    v-for="(point, index) in timeData" 
                    :key="index"
                    class="chart-point"
                    :style="{
                      left: `${(index / (timeData.length - 1)) * 100}%`,
                      bottom: `${(point.value / maxValue) * 100}%`
                    }"
                    @mouseover="activePoint = index"
                    @mouseleave="activePoint = null"
                  >
                    <div 
                      class="point-marker" 
                      :class="{ 'point-active': activePoint === index }"
                    ></div>
                    <div 
                      v-if="activePoint === index" 
                      class="point-tooltip"
                    >
                      <div>{{ point.label }}</div>
                      <div class="point-value">{{ formatValue(point.value) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="chart-x-axis">
              <div 
                v-for="(point, index) in timeData" 
                :key="index" 
                class="chart-x-label"
                :style="{ left: `${(index / (timeData.length - 1)) * 100}%` }"
              >
                {{ formatLabel(point.label) }}
              </div>
            </div>
          </div>

          <!-- Bar Chart View -->
          <div v-else-if="selectedView === 'bar'" class="bar-chart-container">
            <div class="chart-y-axis">
              <div v-for="tick in yAxisTicks" :key="tick" class="chart-y-tick">
                {{ formatValue(tick) }}
              </div>
            </div>
            <div class="bar-chart">
              <div 
                v-for="(bar, index) in timeData" 
                :key="index" 
                class="bar-column"
              >
                <div 
                  class="bar" 
                  :style="{ height: `${(bar.value / maxValue) * 100}%` }"
                  @mouseover="activeBar = index"
                  @mouseleave="activeBar = null"
                >
                  <div v-if="activeBar === index" class="bar-tooltip">
                    <div>{{ bar.label }}</div>
                    <div class="bar-value">{{ formatValue(bar.value) }}</div>
                  </div>
                </div>
                <div class="bar-label">{{ formatLabel(bar.label) }}</div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  xKey: {
    type: String,
    default: 'month'
  },
  yKey: {
    type: String,
    default: 'total_revenue'
  },
  title: {
    type: String,
    default: 'Time Series Analysis'
  },
  metric: {
    type: String,
    default: ''
  },
  format: {
    type: Function,
    default: (val) => val
  }
});

const selectedView = ref('line');
const activePoint = ref(null);
const activeBar = ref(null);

// Transform raw data into required format for chart
const timeData = computed(() => {
  if (!props.data || !props.data.length) return [];
  
  return props.data
    .map(item => ({
      label: item[props.xKey],
      value: Number(item[props.yKey]) || 0
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});

// Calculate maximum value for scaling
const maxValue = computed(() => {
  if (!timeData.value || !timeData.value.length) return 100;
  
  const max = Math.max(...timeData.value.map(item => item.value));
  // Round up to a nice number for better visualization
  return Math.ceil(max * 1.2 / 100) * 100;
});

// Generate y-axis ticks
const yAxisTicks = computed(() => {
  if (!maxValue.value) return [0, 25, 50, 75, 100];
  
  const tickCount = 5;
  const step = maxValue.value / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
});

// Generate SVG path for line chart
const linePathD = computed(() => {
  if (!timeData.value.length) return '';
  
  return timeData.value.reduce((path, point, i, arr) => {
    const x = i * 60;
    // Prevent NaN values by ensuring we're dividing by a non-zero number
    // and that point.value is a valid number
    const value = Number.isFinite(point.value) ? point.value : 0;
    const safeMaxValue = maxValue.value || 1; // Prevent division by zero
    const y = 200 - (value / safeMaxValue * 190);
    
    if (i === 0) return `M ${x} ${y}`;
    return `${path} L ${x} ${y}`;
  }, '');
});

// Generate SVG path for area fill under line
const areaPathD = computed(() => {
  if (!timeData.value.length) return '';
  
  const linePath = linePathD.value;
  const width = (timeData.value.length - 1) * 60;
  // Only create area path if we have a valid line path
  if (!linePath || linePath === '') return '';
  return `${linePath} L ${width} 200 L 0 200 Z`;
});

// Format x-axis labels
const formatLabel = (label) => {
  // Extract month from date (e.g., "2023-01-01" → "Jan")
  if (label.includes('-')) {
    const date = new Date(label);
    return date.toLocaleDateString(undefined, { month: 'short' });
  }
  return label;
};

// Format values according to the data type
const formatValue = (value) => {
  if (props.format) {
    return props.format(value);
  }
  
  if (props.yKey.toLowerCase().includes('revenue') || props.yKey.toLowerCase().includes('price')) {
    return `$${value.toLocaleString()}`;
  }
  
  return value.toLocaleString();
};
</script>

<style scoped>
.time-series-chart {
  width: 100%;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 25px 0 rgba(0, 0, 0, 0.25);
}

.line-chart-container, .bar-chart-container {
  display: flex;
  height: 250px;
  margin-top: 20px;
  position: relative;
}

.chart-y-axis {
  width: 50px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 10px;
  text-align: right;
}

.chart-y-tick {
  font-size: 0.75rem;
  color: var(--text-secondary-color);
}

.line-chart {
  flex-grow: 1;
  height: 200px;
  position: relative;
  margin-bottom: 30px;
}

.chart-canvas {
  position: relative;
  height: 100%;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-line {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.chart-points {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.chart-point {
  position: absolute;
  transform: translate(-50%, 50%);
}

.point-marker {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--v-primary-base);
  transition: all 0.2s ease;
}

.point-active {
  width: 12px;
  height: 12px;
  box-shadow: 0 0 0 4px rgba(var(--v-primary-base), 0.2);
}

.point-tooltip, .bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--dark-surface);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
  margin-bottom: 8px;
}

.point-value, .bar-value {
  font-weight: 600;
  color: var(--v-primary-base);
}

.chart-x-axis {
  height: 30px;
  position: relative;
  margin-left: 50px;
}

.chart-x-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-secondary-color);
}

.bar-chart {
  flex-grow: 1;
  height: 230px;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
}

.bar-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  max-width: 50px;
  margin: 0 4px;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, rgba(var(--v-primary-base), 0.7), rgba(var(--v-primary-base), 1));
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.2s ease;
}

.bar:hover {
  background: rgba(var(--v-primary-base), 1);
}

.bar-label {
  padding-top: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary-color);
  text-align: center;
}
</style>