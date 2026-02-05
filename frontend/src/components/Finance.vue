<template>
  <div class="finance-page">
    <!-- PAGE HEADER -->
    <header class="finance-header">
      <div class="header-left">
        <h1>Financial Insights</h1>
        <p>Procurement, expenses, and vendor management</p>
      </div>
      <div class="header-right">
        <button @click="showVendorModal = true" class="btn secondary">Manage Vendors</button>
        <button @click="showTransactionModal = true" class="btn primary">+ New Transaction</button>
      </div>
    </header>

    <!-- KEY INDICATORS -->
    <section class="stats-container" v-if="summary">
      <div class="stat-box balance">
        <label>Total Balance</label>
        <div class="value">Rs. {{ summary.total_balance.toLocaleString() }}</div>
        <div class="trend positive">Overall project liquidity</div>
      </div>
      <div class="stat-box income">
        <label>Total Revenue</label>
        <div class="value">Rs. {{ summary.total_income.toLocaleString() }}</div>
        <div class="trend positive">↑ Active Inflow</div>
      </div>
      <div class="stat-box prepayment">
        <label>Pre-Payments</label>
        <div class="value">Rs. {{ summary.total_prepayment.toLocaleString() }}</div>
        <div class="trend highlight">Future Outflow Booked</div>
      </div>
    </section>

    <!-- VENDOR & MATERIALS DIRECTORY -->
    <section class="content-section">
      <div class="section-header">
        <h2>Vendor & Material Directory</h2>
        <div class="badge">{{ vendors.length }} Active Vendors</div>
      </div>

      <div v-if="vendors.length === 0" class="empty-state">
        <div class="empty-icon">🏗️</div>
        <p>No vendor records found. Start by adding a supplier.</p>
      </div>

      <div class="vendor-grid">
        <div v-for="vendor in vendors" :key="vendor.id" class="v-card">
          <div class="v-card-head">
            <div class="v-avatar">{{ vendor.name.charAt(0) }}</div>
            <div class="v-info">
              <h3>{{ vendor.name }}</h3>
              <p>{{ vendor.contact_person || 'No Contact' }} • {{ vendor.phone || 'No Phone' }}</p>
            </div>
          </div>
          
          <div class="v-card-body">
            <table class="mat-table">
              <thead>
                <tr>
                  <th>Material Item</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in vendor.materials" :key="m.id">
                  <td>{{ m.material_name }}</td>
                  <td>Rs. {{ m.unit_price }}</td>
                  <td>{{ m.quantity }}</td>
                  <td class="text-right highlight">Rs. {{ m.total_price }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="v-card-footer">
            <span>Procurement Value</span>
            <strong>Rs. {{ calculateVendorTotal(vendor.materials).toLocaleString() }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- VENDOR MODAL -->
    <div v-if="showVendorModal" class="modal-backdrop">
      <div class="modal-card wide">
        <div class="modal-header">
          <h3>Vendor Registration</h3>
          <button class="close-btn" @click="showVendorModal = false">×</button>
        </div>
        <form @submit.prevent="saveVendor">
          <div class="form-grid">
            <div class="form-group">
              <label>Company/Vendor Name</label>
              <input type="text" v-model="formV.name" required placeholder="Birat Steel Industry" />
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="text" v-model="formV.phone" placeholder="98XXXXXXXX" />
            </div>
            <div class="form-group full">
              <label>Contact Person Name</label>
              <input type="text" v-model="formV.contact_person" placeholder="Manager Name" />
            </div>
          </div>

          <div class="material-builder">
            <div class="builder-top">
              <label>Materials & Pricing</label>
              <button type="button" @click="addMaterialField" class="btn-text">+ Add Row</button>
            </div>
            <div v-for="(mat, index) in formV.materials" :key="index" class="builder-row">
              <div class="input-col">
                <input type="text" v-model="mat.material_name" placeholder="Item Name" required />
              </div>
              <div class="input-col small">
                <input type="number" v-model="mat.unit_price" placeholder="Price" min="0" step="0.01" required />
              </div>
              <div class="input-col small">
                <input type="number" v-model="mat.quantity" placeholder="Qty" min="1" required />
              </div>
              <button type="button" @click="removeMaterialField(index)" class="btn-icon-del" :disabled="formV.materials.length === 1">×</button>
            </div>
          </div>

          <div class="modal-footer action-btns">
            <button type="button" @click="showVendorModal = false" class="btn secondary">Cancel</button>
            <button type="submit" class="btn-save">Save Record</button>
          </div>
        </form>
      </div>
    </div>

    <!-- TRANSACTION MODAL -->
    <div v-if="showTransactionModal" class="modal-backdrop">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Record Transaction</h3>
          <button class="close-btn" @click="showTransactionModal = false">×</button>
        </div>
        <form @submit.prevent="saveTransaction">
          <div class="form-group">
            <label>Type</label>
            <select v-model="formT.type" required @change="validateDateOnTypeChange">
              <option value="income">Income (Payment Received)</option>
              <option value="expense">Expense (Payment Sent)</option>
              <option value="pre-payment">Pre-payment (Future/Advance)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Amount (Rs.)</label>
            <input type="number" v-model="formT.amount" min="0" required />
          </div>
          <div class="form-group">
            <label>Category</label>
            <input type="text" v-model="formT.category" placeholder="e.g. Labor, Fuel, Cement" required />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input 
              type="date" 
              v-model="formT.date" 
              :max="formT.type !== 'pre-payment' ? todayDate : null"
              required 
            />
            <small v-if="formT.type !== 'pre-payment'" class="hint">Standard transactions cannot be in the future.</small>
            <small v-else class="hint accent">Future dates allowed for pre-payments.</small>
          </div>
          <div class="modal-footer">
            <button type="submit" class="btn-save full-width">Post Transaction</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const summary = ref(null);
const vendors = ref([]);
const showVendorModal = ref(false);
const showTransactionModal = ref(false);

const todayDate = new Date().toISOString().split('T')[0];

const formT = ref({ 
  type: 'expense', 
  amount: '', 
  category: '', 
  date: todayDate 
});

const formV = ref({ 
  name: '', 
  contact_person: '', 
  phone: '', 
  materials: [{ material_name: '', unit_price: null, quantity: null }] 
});

const loadData = async () => {
  try {
    const [sum, vends] = await Promise.all([axios.get('/finance/summary'), axios.get('/finance/vendors')]);
    summary.value = sum.data;
    vendors.value = vends.data;
  } catch (error) {
    console.error("Failed to load data", error);
  }
};

const validateDateOnTypeChange = () => {
  // If user switches from pre-payment to expense, and the date was in the future, reset it to today
  if (formT.value.type !== 'pre-payment' && formT.value.date > todayDate) {
    formT.value.date = todayDate;
  }
}

const calculateVendorTotal = (mats) => mats.reduce((acc, m) => acc + parseFloat(m.total_price), 0);

const addMaterialField = () => formV.value.materials.push({ material_name: '', unit_price: null, quantity: null });
const removeMaterialField = (index) => formV.value.materials.splice(index, 1);

const saveVendor = async () => {
  try {
    await axios.post('/finance/vendors', formV.value);
    showVendorModal.value = false;
    formV.value = { name: '', contact_person: '', phone: '', materials: [{ material_name: '', unit_price: null, quantity: null }] };
    loadData();
  } catch (error) {
    alert("Check inputs: Price must be >= 0 and Quantity >= 1");
  }
};

const saveTransaction = async () => {
  try {
    await axios.post('/finance/transactions', formT.value);
    showTransactionModal.value = false;
    formT.value = { type: 'expense', amount: '', category: '', date: todayDate };
    loadData();
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to save transaction.";
    alert(msg);
  }
};

onMounted(loadData);
</script>

<style scoped>
.finance-page { padding: 40px; background: #f8fafc; min-height: 100vh; color: #1e293b; }

/* HEADER */
.finance-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.finance-header h1 { font-size: 28px; font-weight: 800; margin: 0; color: #0f172a; }
.finance-header p { color: #64748b; margin: 5px 0 0; }

/* STATS */
.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; margin-bottom: 40px; }
.stat-box { background: white; padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; }
.stat-box label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-box .value { font-size: 26px; font-weight: 800; margin: 10px 0; color: #0f172a; }
.trend { font-size: 12px; font-weight: 600; }
.positive { color: #10b981; }
.negative { color: #ef4444; }
.highlight { color: #A65D43; }

/* VENDOR GRID */
.section-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
.section-header h2 { font-size: 20px; font-weight: 700; margin: 0; }
.badge { background: #e2e8f0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #475569; }

.vendor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(450px, 1fr)); gap: 25px; }
.v-card { background: white; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.04); transition: 0.3s; }
.v-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.08); }

.v-card-head { padding: 20px; display: flex; align-items: center; gap: 15px; background: #fafafa; border-bottom: 1px solid #f1f5f9; }
.v-avatar { width: 45px; height: 45px; background: #1e293b; color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-weight: 800; font-size: 20px; }
.v-info h3 { margin: 0; font-size: 17px; font-weight: 700; }
.v-info p { margin: 3px 0 0; font-size: 13px; color: #64748b; }

.v-card-body { padding: 0 20px; }
.mat-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
.mat-table th { text-align: left; color: #94a3b8; font-weight: 600; padding-bottom: 10px; }
.mat-table td { padding: 10px 0; border-bottom: 1px solid #f8fafc; }
.highlight { font-weight: 700; color: #0f172a; }
.text-right { text-align: right; }

.v-card-footer { padding: 15px 20px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; }
.v-card-footer span { font-size: 12px; font-weight: 600; color: #64748b; }
.v-card-footer strong { font-size: 16px; color: #A65D43; font-weight: 800; }

/* MODALS */
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-card { background: white; width: 450px; border-radius: 28px; padding: 35px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
.wide { width: 700px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group.full { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #475569; }
.hint { display: block; font-size: 11px; margin-top: 5px; color: #94a3b8; }
.hint.accent { color: #A65D43; font-weight: 600; }
input, select { width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 14px; transition: 0.2s; box-sizing: border-box; }
input:focus { border-color: #A65D43; outline: none; }

/* MATERIAL BUILDER */
.material-builder { background: #f8fafc; padding: 20px; border-radius: 20px; margin: 25px 0; border: 1.5px solid #e2e8f0; }
.builder-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.builder-top label { font-size: 13px; font-weight: 800; color: #1e293b; }
.builder-row { display: flex; gap: 12px; margin-bottom: 12px; align-items: center; width: 100%; }
.input-col { flex: 2; }
.input-col.small { flex: 1; }
.btn-icon-del { background: #fee2e2; color: #ef4444; border: none; width: 35px; height: 35px; border-radius: 10px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn-icon-del:hover:not(:disabled) { background: #ef4444; color: white; }
.btn-icon-del:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-text { background: transparent; color: #A65D43; border: none; font-weight: 700; font-size: 13px; cursor: pointer; }

/* FOOTER BUTTONS */
.action-btns { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.btn { padding: 12px 25px; border-radius: 14px; font-weight: 700; cursor: pointer; border: none; transition: 0.2s; font-size: 14px; }
.primary { background: #A65D43; color: white; }
.secondary { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; }
.btn-save { background: #0f172a; color: white; border: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; cursor: pointer; font-size: 14px; }
.btn-save:hover { background: #1e293b; transform: translateY(-1px); }
.full-width { width: 100%; margin-top: 15px; }

.empty-state { text-align: center; padding: 80px 0; background: white; border-radius: 30px; border: 2px dashed #e2e8f0; }
.empty-icon { font-size: 50px; margin-bottom: 15px; }
</style>