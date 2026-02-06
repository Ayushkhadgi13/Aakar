<template>
  <div class="finance-page">
    <header class="finance-header">
      <div class="header-left">
        <h1>Finance & Payroll</h1>
        <p>Manage project procurement and employee salaries.</p>
      </div>
      <div class="header-right">
        <!-- ONLY ADMIN CAN ADD EMPLOYEES -->
        <button v-if="isAdmin" @click="showEmployeeModal = true" class="btn secondary">Add Employee</button>
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

    <!-- VENDOR MODAL -->
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

    <!-- EMPLOYEE MODAL (Only if Admin) -->
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

    <!-- TRANSACTION MODAL (ADDED MISSING MODAL) -->
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
          <div class="form-group">
            <label>Category</label>
            <input type="text" v-model="formT.category" required placeholder="e.g. Materials, Logistics, Sales" />
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

const summary = ref(null);
const vendors = ref([]);
const employees = ref([]);
const projects = ref([]);
const showVendorModal = ref(false);
const showEmployeeModal = ref(false);
const showTransactionModal = ref(false);
const isAdmin = ref(false);

const formV = ref({ name: '', project_id: '', materials: [{ material_name: '', unit_price: 0, quantity: 1 }] });
const formE = ref({ name: '', role: '', salary_amount: 0, join_date: '' });
const formT = ref({ type: 'expense', amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '' });

const loadData = async () => {
  try {
    const userRes = await axios.get('/user');
    isAdmin.value = userRes.data.role === 'admin';

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
  try {
    await axios.post('/finance/employees', formE.value);
    showEmployeeModal.value = false;
    formE.value = { name: '', role: '', salary_amount: 0, join_date: '' };
    loadData();
  } catch(e) {
    alert("Operation failed. Ensure you are an admin.");
  }
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

const saveTransaction = async () => {
  try {
    await axios.post('/finance/transactions', formT.value);
    showTransactionModal.value = false;
    // Reset form
    formT.value = { type: 'expense', amount: '', category: '', date: new Date().toISOString().split('T')[0], description: '' };
    loadData(); // Refresh summary stats
  } catch (e) {
    alert("Failed to save transaction.");
  }
};

const calculateVendorTotal = (mats) => mats?.reduce((acc, m) => acc + parseFloat(m.total_price), 0) || 0;

onMounted(loadData);
</script>

<style scoped>
.finance-page { padding: 40px; }
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.header-right { display: flex; gap: 10px; }
h1 { color: var(--text-main); font-size: 2rem; font-weight: 800; margin: 0; }
p { color: var(--text-secondary); margin-top: 5px; }

/* KPI CARDS */
.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
.stat-box { background: var(--bg-surface); padding: 25px; border-radius: 20px; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.stat-box label { font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
.stat-box .value { font-size: 1.5rem; font-weight: 800; margin-top: 10px; color: var(--text-main); }
.positive { color: var(--success-text) !important; }
.negative { color: var(--danger-text) !important; }

/* GRID */
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
.content-card { background: var(--bg-surface); padding: 30px; border-radius: 24px; border: 1px solid var(--border); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-head h2 { color: var(--text-main); margin: 0; font-size: 1.25rem; font-weight: 800; }
.badge { background: var(--bg-input); color: var(--text-body); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid var(--border); }

/* TABLE */
.data-table { width: 100%; border-collapse: collapse; color: var(--text-main); }
.data-table th { text-align: left; font-size: 12px; color: var(--text-secondary); padding-bottom: 15px; }
.data-table td { padding: 12px 0; border-top: 1px solid var(--border); font-size: 14px; color: var(--text-body); }
.data-table strong { color: var(--text-main); }
.pay-btn { background: var(--primary); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 12px; }

/* VENDORS */
.vendor-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid var(--border); }
.v-info h3 { margin: 0; font-size: 15px; color: var(--text-main); }
.p-link { font-size: 12px; color: var(--primary); font-weight: 700; }
.v-amount { font-weight: 800; color: var(--text-main); }

/* MODALS */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: var(--bg-surface); padding: 35px; border-radius: 24px; width: 450px; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
.wide { width: 700px; }
.modal-header h3 { color: var(--text-main); margin: 0; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; color: var(--text-secondary); }
input, select, textarea { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid var(--border); box-sizing: border-box; background: var(--bg-input); color: var(--text-main); font-family: inherit; }
input:focus, select:focus { border-color: var(--primary); outline: none; }

.material-builder { background: var(--bg-input); padding: 20px; border-radius: 15px; margin: 20px 0; border: 1px solid var(--border); }
.material-builder label { color: var(--text-main); font-weight: 700; margin-bottom: 10px; display: block; }
.builder-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; }
.del-row { background: var(--danger-bg); color: var(--danger-text); border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
.add-row { background: none; border: 1px dashed var(--primary); color: var(--primary); padding: 8px; width: 100%; border-radius: 10px; cursor: pointer; font-weight: 700; }

.btn { padding: 12px 20px; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; }
.primary { background: var(--primary); color: white; }
.secondary { background: var(--bg-input); color: var(--text-body); border: 1px solid var(--border); }
.secondary:hover { background: var(--bg-body); }
.btn-save { background: var(--text-main); color: var(--bg-surface); padding: 15px; width: 100%; border-radius: 12px; border: none; font-weight: 700; cursor: pointer; margin-top: 10px; }
.full-width { width: 100%; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
</style>