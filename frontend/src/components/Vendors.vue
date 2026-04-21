<template>
  <div class="employees-page">
    <header class="page-header">
      <div class="header-left">
        <span class="eyebrow">Finance workspace</span>
        <h1>Vendor Management</h1>
        <p>Track approved vendors, project links, and supplied material line items.</p>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-chip">
            <span class="stat-label">Total vendors</span>
            <strong>{{ vendors.length }}</strong>
          </div>
        </div>
        <button @click="openModal" class="btn primary">New Vendor</button>
      </div>
    </header>

    <div class="table-container">
      <div class="table-header">
        <div>
          <h2>Directory</h2>
          <p>All saved vendors and their linked projects.</p>
        </div>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>Vendor</th>
            <th>Project</th>
            <th>Contact</th>
            <th>Materials</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="vendors.length === 0">
            <td colspan="4" class="text-center">No vendors found.</td>
          </tr>
          <tr v-for="vendor in vendors" :key="vendor.id" class="clickable-row" @click="viewVendor(vendor)">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ vendor.name.charAt(0) }}</div>
                <div class="vendor-meta">
                  <strong>{{ vendor.name }}</strong>
                  <span>{{ vendor.phone || 'No phone added' }}</span>
                </div>
              </div>
            </td>
            <td>{{ vendor.project?.name || 'Unassigned' }}</td>
            <td>{{ vendor.contact_person || 'N/A' }}</td>
            <td>{{ vendor.materials?.length || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailModal && selectedVendor" class="modal-backdrop" @click.self="showDetailModal = false">
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Vendor Details</h3>
          <button @click="showDetailModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <span class="detail-label">Vendor</span>
            <strong>{{ selectedVendor.name }}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">Project</span>
            <strong>{{ selectedVendor.project?.name || 'Unassigned' }}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">Contact Person</span>
            <strong>{{ selectedVendor.contact_person || 'Not provided' }}</strong>
          </div>
          <div class="detail-card">
            <span class="detail-label">Phone</span>
            <strong>{{ selectedVendor.phone || 'Not provided' }}</strong>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-head">
            <div>
              <h4>Supplied Materials</h4>
              <p>Material list and total procurement value for this vendor.</p>
            </div>
            <span class="total-pill">Rs. {{ calculateVendorTotal(selectedVendor.materials).toLocaleString() }}</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!selectedVendor.materials?.length">
                <td colspan="4" class="text-center">No material records found.</td>
              </tr>
              <tr v-for="material in selectedVendor.materials" :key="material.id">
                <td>{{ material.material_name }}</td>
                <td>{{ material.quantity }}</td>
                <td>Rs. {{ Number(material.unit_price || 0).toLocaleString() }}</td>
                <td>Rs. {{ Number(material.total_price || 0).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Create Vendor</h3>
          <button @click="showModal = false" class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <p class="modal-hint">Each vendor needs at least one material line item.</p>

        <form @submit.prevent="saveVendor">
          <div class="form-group">
            <label>Vendor Name</label>
            <input v-model="form.name" type="text" class="styled-input" required placeholder="ABC Supplies" />
          </div>
          <div class="form-group">
            <label>Project</label>
            <div class="select-wrapper">
              <select v-model="form.project_id" class="styled-input" required>
                <option value="" disabled>Select project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Person</label>
              <input v-model="form.contact_person" type="text" class="styled-input" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input v-model="form.phone" type="text" class="styled-input" placeholder="Optional" />
            </div>
          </div>

          <div class="material-block">
            <div class="material-head">
              <h4>Materials</h4>
              <button type="button" class="btn ghost mini" @click="addMaterial">Add Row</button>
            </div>
            <div v-for="(material, index) in form.materials" :key="index" class="material-row">
              <input v-model="material.material_name" type="text" class="styled-input" placeholder="Material" required />
              <input v-model.number="material.quantity" type="number" class="styled-input" min="1" placeholder="Qty" required />
              <input v-model.number="material.unit_price" type="number" class="styled-input" min="0" step="0.01" placeholder="Unit price" required />
              <button v-if="form.materials.length > 1" type="button" class="remove-btn" @click="removeMaterial(index)">Remove</button>
            </div>
          </div>

          <button type="submit" class="btn primary full-width" :disabled="isSaving">
            {{ isSaving ? 'Saving Vendor...' : 'Create Vendor' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuth } from '../useAuth';

const router = useRouter();
const { isAdmin, loadUser } = useAuth();
const vendors = ref([]);
const projects = ref([]);
const showModal = ref(false);
const showDetailModal = ref(false);
const selectedVendor = ref(null);
const isSaving = ref(false);
const form = ref({
  name: '',
  project_id: '',
  contact_person: '',
  phone: '',
  materials: [{ material_name: '', quantity: 1, unit_price: 0 }],
});

const fetchPageData = async () => {
  await loadUser();
  if (!isAdmin.value) {
    router.push('/dashboard');
    return;
  }

  const [vendorRes, projectRes] = await Promise.all([
    axios.get('/finance/vendors'),
    axios.get('/projects'),
  ]);

  vendors.value = vendorRes.data;
  projects.value = projectRes.data;
};

const openModal = () => {
  showModal.value = true;
};

const viewVendor = (vendor) => {
  selectedVendor.value = vendor;
  showDetailModal.value = true;
};

const addMaterial = () => {
  form.value.materials.push({ material_name: '', quantity: 1, unit_price: 0 });
};

const removeMaterial = (index) => {
  form.value.materials.splice(index, 1);
};

const resetForm = () => {
  form.value = {
    name: '',
    project_id: '',
    contact_person: '',
    phone: '',
    materials: [{ material_name: '', quantity: 1, unit_price: 0 }],
  };
};

const saveVendor = async () => {
  isSaving.value = true;
  try {
    await axios.post('/finance/vendors', form.value);
    showModal.value = false;
    resetForm();
    await fetchPageData();
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to create vendor.');
  } finally {
    isSaving.value = false;
  }
};

const calculateVendorTotal = (materials = []) =>
  materials.reduce((sum, material) => sum + Number(material.total_price || 0), 0);

onMounted(fetchPageData);
</script>

<style scoped>
.employees-page { padding: 40px; max-width: 1280px; margin: 0 auto; animation: fadeIn 0.3s ease-out; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 32px; }
.eyebrow { display: inline-block; margin-bottom: 10px; color: var(--primary); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.header-left h1 { color: var(--text-main); font-size: 2.15rem; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.04em; }
.header-left p { color: var(--text-secondary); margin: 0; font-size: 0.98rem; max-width: 540px; }
.header-right { display: flex; align-items: center; gap: 14px; }
.header-stats { display: flex; gap: 12px; }
.stat-chip { min-width: 122px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-surface); display: flex; flex-direction: column; gap: 4px; }
.stat-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.stat-chip strong { font-size: 1.1rem; color: var(--text-main); line-height: 1; }

.table-container { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 18px; overflow: hidden; }
.table-header { padding: 22px 24px 18px; border-bottom: 1px solid var(--border); }
.table-header h2 { margin: 0 0 6px 0; font-size: 1.05rem; color: var(--text-main); font-weight: 700; }
.table-header p { margin: 0; color: var(--text-secondary); font-size: 0.88rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); color: var(--text-secondary); padding: 16px 24px; text-align: left; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.data-table td { padding: 18px 24px; border-bottom: 1px solid var(--border); color: var(--text-body); font-size: 0.95rem; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: color-mix(in srgb, var(--bg-surface) 75%, var(--bg-input) 25%); }
.clickable-row { cursor: pointer; }

.user-cell { display: flex; align-items: center; gap: 12px; }
.avatar { width: 38px; height: 38px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
.vendor-meta { display: flex; flex-direction: column; gap: 4px; }
.vendor-meta span { font-size: 0.8rem; color: var(--text-secondary); }
.text-center { text-align: center; color: var(--text-muted); }

.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.42); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; }
.modal-card { background: var(--bg-surface); padding: 32px; border-radius: 18px; width: 560px; border: 1px solid var(--border); box-shadow: 0 24px 50px rgba(0,0,0,0.12); max-height: 90vh; overflow-y: auto; }
.modal-card.wide { width: 860px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.modal-header h3 { color: var(--text-main); margin: 0; font-size: 1.3rem; font-weight: 800; }
.modal-hint { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; background: var(--bg-input); padding: 10px 12px; border-radius: 10px; border: 1px dashed var(--border); }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }
.detail-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px; background: color-mix(in srgb, var(--bg-surface) 76%, var(--bg-input) 24%); display: flex; flex-direction: column; gap: 6px; }
.detail-label { font-size: 0.76rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; }
.detail-card strong { color: var(--text-main); font-size: 1rem; }
.detail-section { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.section-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 18px 20px; background: color-mix(in srgb, var(--bg-surface) 72%, var(--bg-input) 28%); border-bottom: 1px solid var(--border); }
.section-head h4 { margin: 0 0 4px; color: var(--text-main); font-size: 1rem; }
.section-head p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; }
.total-pill { background: var(--primary); color: white; border-radius: 999px; padding: 10px 14px; font-weight: 700; white-space: nowrap; }
.form-group { margin-bottom: 18px; display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 0.82rem; font-weight: 700; color: var(--text-main); text-transform: uppercase; letter-spacing: 0.08em; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.material-block { border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 18px; background: var(--bg-input); }
.material-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.material-head h4 { margin: 0; color: var(--text-main); }
.material-row { display: grid; grid-template-columns: 2fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; }
.material-row:last-child { margin-bottom: 0; }

.styled-input { appearance: none; -webkit-appearance: none; width: 100%; height: 48px; padding: 12px 16px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--text-main); box-sizing: border-box; font-size: 0.98rem; transition: all 0.2s ease; }
.styled-input:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 4px rgba(166, 93, 67, 0.1); background: var(--bg-surface); }
.select-wrapper { position: relative; }
.select-wrapper::after { content: ''; position: absolute; right: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-size: contain; pointer-events: none; }
.select-wrapper select { padding-right: 48px; cursor: pointer; }

.btn { padding: 0 24px; height: 46px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.94rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
.btn.primary { background: var(--primary); color: white; }
.btn.primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(166, 93, 67, 0.2); }
.btn.primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.ghost { border: 1px solid var(--border); background: transparent; color: var(--text-main); }
.btn.ghost.mini { height: 36px; padding: 0 12px; font-size: 0.82rem; }
.close-btn, .remove-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; }
.close-btn:hover, .remove-btn:hover { color: #dc2626; }
.full-width { width: 100%; margin-top: 8px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 900px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .header-right { flex-direction: column; align-items: stretch; }
}

@media (max-width: 768px) {
  .employees-page { padding: 24px 20px; }
  .data-table th,
  .data-table td { padding-left: 16px; padding-right: 16px; }
  .detail-grid,
  .form-row,
  .material-row { grid-template-columns: 1fr; }
  .section-head { flex-direction: column; align-items: stretch; }
}
</style>
