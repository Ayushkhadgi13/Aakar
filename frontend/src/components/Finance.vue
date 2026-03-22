<template>
  <div class="finance-page">
    <header class="finance-header">
      <div class="header-left">
        <h1>Finance & Analytics</h1>
        <p>Manage procurement, view exact expenditures, and process payroll.</p>
      </div>
      <div class="header-right">
        <div v-if="isAdmin" class="action-buttons">
          <button @click="showVendorModal = true" class="btn secondary">New Vendor</button>
          <button @click="showTransactionModal = true" class="btn primary">+ Transaction</button>
        </div>
      </div>
    </header>

    <!-- SEARCH & DATE FILTERS -->
    <div class="filter-bar" v-if="isAdmin">
      <div class="filter-item">
        <label>Filter by Project</label>
        <select v-model="filters.project_id" @change="loadData" class="project-filter">
          <option value="">All Projects</option>
          <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>Start Date</label>
        <input type="date" v-model="filters.start_date" @change="loadData" />
      </div>
      <div class="filter-item">
        <label>End Date</label>
        <input type="date" v-model="filters.end_date" @change="loadData" />
      </div>
      <button @click="clearFilters" class="btn filter-clear">Clear</button>
    </div>

    <!-- KPI STATS -->
    <section class="stats-container" v-if="isAdmin && summary">
      <div class="stat-box">
        <label>All-Time Available Balance</label>
        <div class="value">Rs. {{ summary.total_balance?.toLocaleString() || 0 }}</div>
      </div>
      <div class="stat-box">
        <label>Filtered Revenue</label>
        <div class="value positive">Rs. {{ summary.total_income?.toLocaleString() || 0 }}</div>
      </div>
      <div class="stat-box">
        <label>Filtered Expenses</label>
        <div class="value negative">Rs. {{ summary.total_expense?.toLocaleString() || 0 }}</div>
      </div>
    </section>

    <!-- IN-DEPTH CHARTS -->
    <div class="detailed-charts" v-if="isAdmin && summary">
        
        <!-- NEW STACKED CHART: Monthly breakdown showing exactly what project cost what -->
        <div class="chart-card full-width-chart">
            <div class="chart-header">
              <h3>Monthly Expense Breakdown by Project</h3>
              <span class="hint-text">Hover over segments to see specific project costs</span>
            </div>
            <apexchart type="bar" height="350" :options="trendChartOptions" :series="trendSeries" />
        </div>

        <!-- Expense Distribution -->
        <div class="chart-card">
            <div class="chart-header"><h3>Expenses by Category</h3></div>
            <apexchart type="donut" height="300" :options="categoryChartOptions" :series="categorySeries" />
        </div>

        <!-- Material Cost Details -->
        <div class="chart-card">
            <div class="chart-header"><h3>Deep Dive: Exact Material Costs</h3></div>
            <apexchart type="bar" height="300" :options="materialChartOptions" :series="materialSeries" />
        </div>
    </div>

    <div class="finance-grid" :class="{ 'full-width': !isAdmin }">
      <!-- EMPLOYEE PAYROLL -->
      <section class="content-card" v-if="isAdmin">
        <div class="card-head">
          <h2>Employee Payroll</h2>
          <span class="badge">{{ employees.length }} Staff</span>
        </div>
        <div class="payroll-month-label">{{ currentMonthLabel }}</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Salary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="employees.length === 0">
              <td colspan="4" style="text-align:center; color: var(--text-muted);">No employees found.</td>
            </tr>
            <tr v-for="emp in employees" :key="emp.id">
              <td><strong>{{ emp.name }}</strong></td>
              <td>{{ emp.role }}</td>
              <td>Rs. {{ Number(emp.salary_amount).toLocaleString() }}</td>
              <td>
                <span v-if="emp.paid_this_month" class="paid-badge">✓ Paid</span>
                <button v-else @click="processSalary(emp)" class="pay-btn">Pay Salary</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- VENDOR LIST -->
      <section class="content-card vendor-section">
        <div class="card-head">
          <h2>Vendor Directory</h2>
          <span class="hint-text">(Click to view details)</span>
        </div>
        <div class="vendor-list">
          <div v-if="vendors.length === 0" style="text-align:center; color: var(--text-muted); padding: 20px;">
            No vendors registered.
          </div>
          <div
            v-for="vendor in vendors"
            :key="vendor.id"
            class="vendor-item clickable"
            @click="viewVendor(vendor)"
          >
            <div class="v-info">
              <h3>{{ vendor.name }}</h3>
              <span class="p-link">Project: {{ vendor.project?.name || 'Unlinked' }}</span>
              <div class="v-meta" v-if="vendor.contact_person">Contact: {{ vendor.contact_person }}</div>
            </div>
            <div class="v-amount">Rs. {{ calculateVendorTotal(vendor.materials).toLocaleString() }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- 1. VENDOR DETAILS MODAL -->
    <div v-if="showDetailModal && selectedVendor" class="modal-backdrop">
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Vendor Details</h3>
          <button @click="showDetailModal = false" class="close-btn">×</button>
        </div>
        <div class="detail-content">
          <div class="vendor-profile">
            <div class="vp-row">
              <div class="vp-item">
                <label>Company Name</label>
                <span>{{ selectedVendor.name }}</span>
              </div>
              <div class="vp-item">
                <label>Assigned Project</label>
                <span class="highlight-text">{{ selectedVendor.project?.name || 'N/A' }}</span>
              </div>
            </div>
            <div class="vp-row">
              <div class="vp-item">
                <label>Contact Person</label>
                <span>{{ selectedVendor.contact_person || '-' }}</span>
              </div>
              <div class="vp-item">
                <label>Phone / Contact</label>
                <span>{{ selectedVendor.phone || '-' }}</span>
              </div>
            </div>
          </div>
          <h4 class="section-title">Supplied Materials</h4>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!selectedVendor.materials || selectedVendor.materials.length === 0">
                  <td colspan="4" class="text-center">No materials recorded.</td>
                </tr>
                <tr v-for="(mat, idx) in selectedVendor.materials" :key="idx">
                  <td>{{ mat.material_name }}</td>
                  <td>Rs. {{ Number(mat.unit_price).toLocaleString() }}</td>
                  <td>{{ mat.quantity }}</td>
                  <td><strong>Rs. {{ Number(mat.total_price).toLocaleString() }}</strong></td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right"><strong>Grand Total:</strong></td>
                  <td><strong>Rs. {{ calculateVendorTotal(selectedVendor.materials).toLocaleString() }}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn secondary full-width">Close</button>
        </div>
      </div>
    </div>

    <!-- 2. REGISTER VENDOR MODAL -->
    <div v-if="showVendorModal" class="modal-backdrop">
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Register Vendor</h3>
          <button @click="showVendorModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveVendor">
          <div class="form-row">
            <div class="form-group">
              <label>Vendor Name</label>
              <input type="text" v-model="formV.name" required placeholder="Birat Steel etc." />
            </div>
            <div class="form-group">
              <label>Assigned Project</label>
              <select v-model="formV.project_id" required>
                <option value="" disabled>Select a Project</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Contact Person</label>
              <input type="text" v-model="formV.contact_person" placeholder="Manager Name" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" v-model="formV.phone" placeholder="98XXXXXXXX" />
            </div>
          </div>
          <div class="material-builder">
            <label>Materials</label>
            <div v-for="(mat, idx) in formV.materials" :key="idx" class="builder-row">
              <input type="text" v-model="mat.material_name" placeholder="Item Name" required />
              <input type="number" v-model="mat.unit_price" placeholder="Price/Unit" required min="0" />
              <input type="number" v-model="mat.quantity" placeholder="Qty" required min="1" />
              <button type="button" @click="removeMaterial(idx)" class="del-row">×</button>
            </div>
            <button type="button" @click="addMaterial" class="add-row">+ Add Item</button>
          </div>
          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? 'Saving...' : 'Register Vendor' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 3. TRANSACTION MODAL -->
    <div v-if="showTransactionModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Record Transaction</h3>
          <button @click="showTransactionModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveTransaction">
          <div class="form-group">
            <label>Type</label>
            <select v-model="formT.type" required>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="pre-payment">Pre-payment</option>
            </select>
          </div>
          
          <!-- New Project Link feature inside transaction creation -->
          <div class="form-group" v-if="formT.type !== 'income'">
            <label>Link to Project (Optional)</label>
            <select v-model="formT.project_id">
              <option value="">General / No Specific Project</option>
              <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Category</label>
            <input type="text" v-model="formT.category" required placeholder="e.g. Logistics, Consulting" />
          </div>
          <div class="form-group">
            <label>Amount (Rs.)</label>
            <input type="number" v-model="formT.amount" required min="0" />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input type="date" v-model="formT.date" required />
          </div>
          <div class="form-group">
            <label>Description (Optional)</label>
            <textarea v-model="formT.description" rows="2" placeholder="Details..."></textarea>
          </div>
          <button type="submit" class="btn-save full-width">Save Transaction</button>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import apexchart from "vue3-apexcharts";
import { useAuth } from '../useAuth';

const { isAdmin, loadUser } = useAuth();
const summary = ref({});
const vendors = ref([]);
const employees = ref([]);
const projects = ref([]);

// Extended filter mappings
const filters = ref({ start_date: '', end_date: '', project_id: '' });

// 1. STACKED BAR CHART: Expenses by Project
const trendSeries = ref([]);
const trendChartOptions = ref({
    chart: { type: 'bar', stacked: true, fontFamily: 'Plus Jakarta Sans, sans-serif', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    xaxis: { categories:[], labels: { style: { colors: 'var(--text-muted)' } } },
    yaxis: { labels: { style: { colors: 'var(--text-muted)' }, formatter: (val) => `Rs. ${(val/1000).toFixed(1)}k` } },
    // Vibrant array of colors to represent different stacked projects clearly
    colors:['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#A65D43', '#0EA5E9', '#F43F5E'],
    legend: { position: 'top', horizontalAlign: 'right', labels: { colors: 'var(--text-main)' } },
    fill: { opacity: 1 },
    grid: { borderColor: 'var(--border)' }
});

const categorySeries = ref([]);
const categoryChartOptions = ref({
    labels:[],
    chart: { type: 'donut', fontFamily: 'Plus Jakarta Sans, sans-serif' },
    colors:['#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#10B981', '#64748B'],
    dataLabels: { enabled: false },
    legend: { position: 'bottom', labels: { colors: 'var(--text-main)' } }
});

const materialSeries = ref([]);
const materialChartOptions = ref({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    xaxis: { categories:[], labels: { style: { colors: 'var(--text-muted)' } } },
    yaxis: { labels: { style: { colors: 'var(--text-muted)' }, formatter: (val) => `Rs. ${(val/1000).toFixed(1)}k` } },
    colors:['#A65D43'],
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    dataLabels: { enabled: true, formatter: (val) => `Rs. ${(val/1000).toFixed(1)}k`, style: { colors: ['#fff'] } },
    grid: { borderColor: 'var(--border)' }
});

const showVendorModal = ref(false);
const showTransactionModal = ref(false);
const showDetailModal = ref(false);
const selectedVendor = ref(null);
const isSaving = ref(false);
const currentMonthLabel = ref(
  new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
);

const formV = ref({ name: '', project_id: '', contact_person: '', phone: '', materials:[{ material_name: '', unit_price: '', quantity: '' }] });
const formT = ref({ type: 'expense', amount: '', category: '', project_id: '', date: new Date().toISOString().split('T')[0], description: '' });

const clearFilters = () => {
    filters.value = { start_date: '', end_date: '', project_id: '' };
    loadData();
};

const loadData = async () => {
  try {
    await loadUser();

    // Mapping our filter variables dynamically
    const params = {};
    if (filters.value.start_date && filters.value.end_date) {
        params.start_date = filters.value.start_date;
        params.end_date = filters.value.end_date;
    }
    if (filters.value.project_id) {
        params.project_id = filters.value.project_id;
    }

    const commonReqs =[
      axios.get('/finance/vendors'),
      axios.get('/projects')
    ];

    if (isAdmin.value) {
      commonReqs.push(axios.get('/finance/summary', { params }));
      commonReqs.push(axios.get('/finance/employees'));
    }

    const responses = await Promise.all(commonReqs);
    vendors.value = responses[0].data;
    projects.value = responses[1].data;

    if (isAdmin.value) {
      summary.value = responses[2].data;
      employees.value = responses[3].data;

      // 1. PROCESS STACKED TREND CHART (Monthly Expense grouped by Project)
      const stats = summary.value.project_monthly_stats;
      const months = [...new Set(stats.map(s => s.month))];
      const projectNames = [...new Set(stats.map(s => s.project_name))];

      trendSeries.value = projectNames.map(pName => {
        return {
          name: pName,
          data: months.map(m => {
            const record = stats.find(s => s.project_name === pName && s.month === m);
            return record ? Number(record.cost) : 0;
          })
        };
      });
      trendChartOptions.value = { ...trendChartOptions.value, xaxis: { categories: months } };

      // 2. Process Categories
      categorySeries.value = summary.value.category_breakdown.map(c => Number(c.total));
      categoryChartOptions.value = {
          ...categoryChartOptions.value,
          labels: summary.value.category_breakdown.map(c => c.category)
      };

      // 3. Process Material specific costs
      materialSeries.value =[{
          name: 'Material Cost',
          data: summary.value.material_breakdown.map(m => Number(m.total_cost))
      }];
      materialChartOptions.value = {
          ...materialChartOptions.value,
          xaxis: { categories: summary.value.material_breakdown.map(m => m.material_name) }
      };
    }
  } catch (e) {
    console.error("Data load failed", e);
  }
};

const viewVendor = (vendor) => { selectedVendor.value = vendor; showDetailModal.value = true; };
const addMaterial = () => { formV.value.materials.push({ material_name: '', unit_price: '', quantity: '' }); };
const removeMaterial = (idx) => {
  if (formV.value.materials.length > 1) { formV.value.materials.splice(idx, 1); }
  else { alert("At least one material is required."); }
};

const saveVendor = async () => {
  isSaving.value = true;
  try {
    await axios.post('/finance/vendors', formV.value);
    showVendorModal.value = false;
    formV.value = { name: '', project_id: '', contact_person: '', phone: '', materials:[{ material_name: '', unit_price: '', quantity: '' }] };
    loadData();
  } catch (e) { alert("Failed to save vendor. Please check all fields."); }
  finally { isSaving.value = false; }
};

const processSalary = async (emp) => {
  if (confirm(`Record salary payment of Rs. ${emp.salary_amount} for ${emp.name}?`)) {
    try {
      await axios.post(`/finance/employees/${emp.id}/pay`);
      alert("Salary payment added to expenses!");
      loadData();
    } catch (e) {
      if (e.response && e.response.status === 422) { alert(e.response.data.message); }
      else { alert("Failed to process salary payment."); }
    }
  }
};

const saveTransaction = async () => {
  try {
    // Drop project_id if they selected "income" or "none"
    const payload = { ...formT.value };
    if (!payload.project_id || payload.type === 'income') {
        delete payload.project_id;
    }

    await axios.post('/finance/transactions', payload);
    showTransactionModal.value = false;
    formT.value = { type: 'expense', amount: '', category: '', project_id: '', date: new Date().toISOString().split('T')[0], description: '' };
    loadData();
  } catch (e) { alert("Failed to save transaction."); }
};

const calculateVendorTotal = (mats) => mats?.reduce((acc, m) => acc + parseFloat(m.total_price || 0), 0) || 0;

onMounted(loadData);
</script>

<style scoped>
.finance-page { padding: 40px; animation: fadeIn 0.4s ease-out; }
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-right { display: flex; gap: 10px; }
.action-buttons { display: flex; gap: 10px; }
h1 { color: var(--text-main); font-size: 2rem; font-weight: 800; margin: 0; }
p { color: var(--text-secondary); margin-top: 5px; }

/* FILTERS */
.filter-bar { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; background: var(--bg-surface); padding: 15px 25px; border-radius: 16px; border: 1px solid var(--border); align-items: flex-end; }
.filter-item { display: flex; flex-direction: column; gap: 5px; }
.filter-item label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.filter-item input, .filter-item select { margin: 0; padding: 8px 12px; height: 38px; }
.project-filter { min-width: 220px; }
.filter-clear { padding: 8px 15px; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-body); height: 38px;}

/* KPI CARDS */
.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
.stat-box { background: var(--bg-surface); padding: 25px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.stat-box label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.stat-box .value { font-size: 1.5rem; font-weight: 800; margin-top: 10px; color: var(--text-main); }
.positive { color: var(--success-text) !important; }
.negative { color: var(--danger-text) !important; }

/* CHARTS SECTION */
.detailed-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
.chart-card { background: var(--bg-surface); padding: 20px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.full-width-chart { grid-column: 1 / -1; }
.chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.chart-header h3 { margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main); }

/* GRID */
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.finance-grid.full-width { grid-template-columns: 1fr; }

.content-card { background: var(--bg-surface); padding: 30px; border-radius: 24px; border: 1px solid var(--border); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-head h2 { color: var(--text-main); margin: 0; font-size: 1.25rem; font-weight: 800; }
.hint-text { font-size: 0.8rem; color: var(--text-muted); font-weight: normal; }
.badge { background: var(--bg-input); color: var(--text-body); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid var(--border); }

/* PAYROLL MONTH LABEL */
.payroll-month-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 15px; }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; color: var(--text-main); }
.data-table th { text-align: left; font-size: 12px; color: var(--text-secondary); padding-bottom: 15px; }
.data-table td { padding: 12px 0; border-top: 1px solid var(--border); font-size: 14px; color: var(--text-body); }
.data-table strong { color: var(--text-main); }
.data-table tfoot td { border-top: 2px solid var(--border); padding-top: 15px; font-size: 1.1rem; }
.text-right { text-align: right; }
.text-center { text-align: center; }

/* PAY BUTTON */
.pay-btn { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; transition: 0.2s; }
.pay-btn:hover { opacity: 0.9; }

/* PAID BADGE */
.paid-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: 700; }

/* VENDORS LIST */
.vendor-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 15px 0; border-top: 1px solid var(--border); transition: 0.2s; }
.clickable { cursor: pointer; padding: 15px; border-radius: 12px; border: 1px solid transparent; border-top: 1px solid var(--border); }
.clickable:hover { background: var(--bg-input); border-color: var(--border); transform: translateX(5px); }
.v-info h3 { margin: 0; font-size: 15px; color: var(--text-main); }
.p-link { font-size: 12px; color: var(--primary); font-weight: 700; display: block; margin-top: 2px; }
.v-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.v-amount { font-weight: 800; color: var(--text-main); }

/* VENDOR DETAIL */
.vendor-profile { background: var(--bg-input); padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 1px solid var(--border); }
.vp-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
.vp-row:last-child { margin-bottom: 0; }
.vp-item { width: 48%; }
.vp-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
.vp-item span { font-size: 1rem; color: var(--text-main); font-weight: 600; }
.highlight-text { color: var(--primary) !important; }
.section-title { margin: 0 0 15px; color: var(--text-main); font-size: 1.1rem; border-left: 4px solid var(--primary); padding-left: 10px; }

/* MODALS */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); max-height: 90vh; overflow-y: auto; }
.wide { width: 700px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.modal-header h3 { color: var(--text-main); margin: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); }
input, select, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); box-sizing: border-box; background: var(--bg-input); color: var(--text-main); font-family: inherit; }
input:focus, select:focus { border-color: var(--primary); outline: none; }

.material-builder { background: var(--bg-input); padding: 20px; border-radius: 15px; margin: 20px 0; border: 1px solid var(--border); }
.material-builder label { color: var(--text-main); font-weight: 700; margin-bottom: 10px; display: block; }
.builder-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; }
.del-row { background: var(--danger-bg); color: var(--danger-text); border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
.add-row { background: none; border: 1px dashed var(--primary); color: var(--primary); padding: 8px; width: 100%; border-radius: 10px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.add-row:hover { background: var(--bg-surface); }

.btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
.primary { background: var(--primary); color: white; }
.secondary { background: var(--bg-input); color: var(--text-body); border: 1px solid var(--border); }
.secondary:hover { background: var(--bg-body); }
.btn-save { background: var(--text-main); color: var(--bg-surface); padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.full-width { width: 100%; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
.modal-footer { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@media (max-width: 1024px) { 
  .finance-grid { grid-template-columns: 1fr; } 
  .stats-container { grid-template-columns: 1fr; } 
  .detailed-charts { grid-template-columns: 1fr; }
}
</style>