<template>
  <section class="comparison-panel">
    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-label">Estimated Qty</span>
        <strong>{{ formatNumber(comparison.summary?.estimated_quantity) }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Actual Qty</span>
        <strong>{{ formatNumber(comparison.summary?.actual_quantity) }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">Variance</span>
        <strong :class="{ danger: (comparison.summary?.variance_quantity || 0) > 0 }">
          {{ formatNumber(comparison.summary?.variance_quantity) }}
        </strong>
      </div>
    </div>

    <div class="table-shell">
      <div class="table-head">
        <div>
          <h3>Estimated vs Actual Materials</h3>
          <p>Usage logs are matched with BOQ estimates by material name.</p>
        </div>
        <button class="btn ghost" @click="fetchComparison" :disabled="isLoading">
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Estimated</th>
            <th>Actual</th>
            <th>Variance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoading && comparison.materials.length === 0">
            <td colspan="5" class="empty-cell">No comparison data available yet.</td>
          </tr>
          <tr v-for="item in comparison.materials" :key="item.material_name">
            <td>{{ item.material_name }}</td>
            <td>{{ formatNumber(item.estimated_quantity) }}</td>
            <td>{{ formatNumber(item.actual_quantity) }}</td>
            <td :class="{ danger: item.quantity_variance > 0 }">{{ formatNumber(item.quantity_variance) }}</td>
            <td>
              <span :class="['status-pill', statusClass(item.status)]">{{ item.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  projectId: {
    type: [String, Number],
    required: true,
  },
});

const comparison = ref({
  summary: {},
  materials: [],
});
const isLoading = ref(false);

const fetchComparison = async () => {
  if (!props.projectId) return;

  isLoading.value = true;
  try {
    const response = await axios.get(`/projects/${props.projectId}/materials/comparison`);
    comparison.value = response.data;
  } catch (error) {
    comparison.value = { summary: {}, materials: [] };
  } finally {
    isLoading.value = false;
  }
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const statusClass = (status) => {
  if (status === 'Overused') return 'danger';
  if (status === 'Unused') return 'muted';
  return 'success';
};

watch(() => props.projectId, fetchComparison);
onMounted(fetchComparison);

defineExpose({ fetchComparison });
</script>

<style scoped>
.comparison-panel { display: flex; flex-direction: column; gap: 20px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.summary-card { padding: 18px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 8px; }
.summary-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 700; }
.summary-card strong { font-size: 1.35rem; color: var(--text-main); }
.summary-card strong.danger { color: #dc2626; }

.table-shell { border: 1px solid var(--border); border-radius: 18px; background: var(--bg-surface); overflow: hidden; }
.table-head { padding: 22px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.table-head h3 { margin: 0 0 6px; color: var(--text-main); font-size: 1.05rem; }
.table-head p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); color: var(--text-secondary); padding: 16px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; }
.data-table td { padding: 16px 24px; border-bottom: 1px solid var(--border); color: var(--text-body); }
.data-table tr:last-child td { border-bottom: none; }
.empty-cell { text-align: center; color: var(--text-muted); }
.danger { color: #dc2626; }

.status-pill { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.status-pill.success { background: rgba(16, 185, 129, 0.12); color: #059669; }
.status-pill.danger { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
.status-pill.muted { background: var(--bg-input); color: var(--text-secondary); }

.btn { height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-main); font-weight: 700; cursor: pointer; }
.btn.ghost:hover { border-color: var(--primary); color: var(--primary); }

@media (max-width: 768px) {
  .table-head { flex-direction: column; align-items: stretch; }
  .data-table th,
  .data-table td { padding-left: 16px; padding-right: 16px; }
}
</style>
