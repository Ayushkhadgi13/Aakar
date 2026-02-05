<template>
  <div class="finance-page">
    <header class="finance-header">
      <div class="header-left">
        <h1>Finance & Payroll</h1>
        <p>Manage project procurement and employee salaries.</p>
      </div>
      <div class="header-right">
        <button @click="showEmployeeModal = true" class="btn secondary">Add Employee</button>
        <button @click="showVendorModal = true" class="btn secondary">New Vendor</button>
        <button @click="showTransactionModal = true" class="btn primary">+ Transaction</button>
      </div>
    </header>

    <!-- KPI STATS -->
    <section class="stats-container" v-if="summary">
      <div class="stat-box">
        <label>Total Balance</label>
        <div class="value">Rs. {{ summary.total_balance.toLocaleString() }}</div>
      </div>
      <div class="stat-box">
        <label>Monthly Revenue</label>
        <div class="value positive">Rs. {{ summary.total_income.toLocaleString() }}</div>
      </div>
      <div class="stat-box">
        <label>Monthly Expenses</label>
        <div class="value negative">Rs. {{ summary.total_expense.toLocaleString() }}</div>
      </div>
    </section>

    <div class="finance-grid">
      <!-- EMPLOYEE LIST -->
      <section class="content-card">
        <div class="card-head">
          <h2>Employee Payroll</h2>
          <span class="badge">{{ employees.length }} Staff</span>
        </div>
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
            <tr v-for="emp in employees" :key="emp.id">
              <td><strong>{{ emp.name }}</strong></td>
              <td>{{ emp.role }}</td>
              <td>Rs. {{ emp.salary_amount.toLocaleString() }}</td>
              <td>
                <button @click="processSalary(emp)" class="pay-btn">Pay Salary</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- VENDOR LIST -->
      <section class="content-card">
        <div class="card-head">
          <h2>Vendor Directory</h2>
        </div>
        <div class="vendor-list">
          <div v-for="vendor in vendors" :key="vendor.id" class="vendor-item">
            <div class="v-info">
              <h3>{{ vendor.name }}</h3>
              <span class="p-link">Project: {{ vendor.project?.name || 'Unlinked' }}</span>
            </div>
            <div class="v-amount">Rs. {{ calculateVendorTotal(vendor.materials).toLocaleString() }}</div>
          </div>
        </div>
      </section>
    </div>

    <!-- VENDOR MODAL (With Project Dropdown) -->
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
              <label>Assigned Project (Dropdown)</label>
              <select v-model="formV.project_id" required>
                <option value="" disabled>Select a Project</option>
                <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>
          </div>
          
          <div class="material-builder">
            <label>Materials</label>
            <div v-for="(mat, idx) in formV.materials" :key="idx" class="builder-row">
              <input type="text" v-model="mat.material_name" placeholder="Item" required />
              <input type="number" v-model="mat.unit_price" placeholder="Price" required />
              <input type="number" v-model="mat.quantity" placeholder="Qty" required />
              <button type="button" @click="formV.materials.splice(idx,1)" class="del-row">×</button>
            </div>
            <button type="button" @click="formV.materials.push({material_name:'', unit_price:0, quantity:1})" class="add-row">+ Add Item</button>
          </div>

          <button type="submit" class="btn-save">Register Vendor</button>
        </form>
      </div>
    </div>

    <!-- EMPLOYEE MODAL -->
    <div v-if="showEmployeeModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Add Employee</h3>
          <button @click="showEmployeeModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="saveEmployee">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" v-model="formE.name" required />
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" v-model="formE.role" required />
          </div>
          <div class="form-group">
            <label>Monthly Salary (Rs.)</label>
            <input type="number" v-model="formE.salary_amount" required />
          </div>
          <div class="form-group">
            <label>Join Date</label>
            <input type="date" v-model="formE.join_date" required />
          </div>
          <button type="submit" class="btn-save full-width">Add to Staff</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const summary = ref(null);
const vendors = ref([]);
const employees = ref([]);
const projects = ref([]);
const showVendorModal = ref(false);
const showEmployeeModal = ref(false);
const showTransactionModal = ref(false);

const formV = ref({ name: '', project_id: '', materials: [{ material_name: '', unit_price: 0, quantity: 1 }] });
const formE = ref({ name: '', role: '', salary_amount: 0, join_date: '' });

const loadData = async () => {
  try {
    const [sum, vends, emps, projs] = await Promise.all([
      axios.get('/finance/summary'),
      axios.get('/finance/vendors'),
      axios.get('/finance/employees'),
      axios.get('/projects')
    ]);
    summary.value = sum.data;
    vendors.value = vends.data;
    employees.value = emps.data;
    projects.value = projs.data;
  } catch (e) {
    console.error("Data load failed", e);
  }
};

const saveEmployee = async () => {
  await axios.post('/finance/employees', formE.value);
  showEmployeeModal.value = false;
  formE.value = { name: '', role: '', salary_amount: 0, join_date: '' };
  loadData();
};

const processSalary = async (emp) => {
  if (confirm(`Record salary payment of Rs. ${emp.salary_amount} for ${emp.name}?`)) {
    await axios.post(`/finance/employees/${emp.id}/pay`);
    alert("Salary payment added to expenses!");
    loadData();
  }
};

const saveVendor = async () => {
  await axios.post('/finance/vendors', formV.value);
  showVendorModal.value = false;
  formV.value = { name: '', project_id: '', materials: [{ material_name: '', unit_price: 0, quantity: 1 }] };
  loadData();
};

const calculateVendorTotal = (mats) => mats?.reduce((acc, m) => acc + parseFloat(m.total_price), 0) || 0;

onMounted(loadData);
</script>

<style scoped>
.finance-page { padding: 40px; }
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header-right { display: flex; gap: 10px; }

/* KPI CARDS */
.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
.stat-box { background: white; padding: 25px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.stat-box label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.stat-box .value { font-size: 1.5rem; font-weight: 800; margin-top: 10px; }
.positive { color: #10b981; }
.negative { color: #ef4444; }

/* GRID */
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.content-card { background: white; padding: 30px; border-radius: 24px; border: 1px solid var(--border); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.badge { background: var(--bg-body); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; font-size: 12px; color: var(--text-secondary); padding-bottom: 15px; }
.data-table td { padding: 12px 0; border-top: 1px solid var(--border); font-size: 14px; }
.pay-btn { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }

/* VENDORS */
.vendor-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid var(--border); }
.v-info h3 { margin: 0; font-size: 15px; }
.p-link { font-size: 12px; color: var(--primary); font-weight: 700; }
.v-amount { font-weight: 800; }

/* MODALS */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: white; padding: 35px; border-radius: 24px; width: 450px; }
.wide { width: 700px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
input, select { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); box-sizing: border-box; }

.material-builder { background: #f9fafb; padding: 20px; border-radius: 15px; margin: 20px 0; }
.builder-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; }
.del-row { background: #fee2e2; color: #ef4444; border: none; border-radius: 8px; cursor: pointer; }
.add-row { background: none; border: 1px dashed var(--primary); color: var(--primary); padding: 8px; width: 100%; border-radius: 10px; cursor: pointer; font-weight: 700; }

.btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
.primary { background: var(--primary); color: white; }
.secondary { background: #f1f5f9; color: var(--text-body); border: 1px solid var(--border); }
.btn-save { background: var(--text-main); color: white; padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.full-width { width: 100%; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
</style>