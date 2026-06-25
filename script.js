// Initial Mock Data if LocalStorage is empty
const defaultMembers = [
    {
        id: "M001",
        namaLengkap: "Budi Santoso",
        tanggalLahir: "1985-04-12",
        jenisKelamin: "Pria",
        totalKeluarga: 4,
        alamat: "Jl. Merdeka No. 45, Jakarta",
        noHp: "081234567890",
        peranGbt: "Pengurus",
        komisi: "Kaum Pria",
        status: "Aktif",
        foto: "https://i.pravatar.cc/150?img=11"
    },
    {
        id: "M002",
        namaLengkap: "Siti Rahmawati",
        tanggalLahir: "1990-08-23",
        jenisKelamin: "Wanita",
        totalKeluarga: 2,
        alamat: "Jl. Sudirman Blok B4",
        noHp: "089876543210",
        peranGbt: "Jemaat",
        komisi: "PAW Praise And Worship",
        status: "Aktif",
        foto: "https://i.pravatar.cc/150?img=5"
    }
];

// Initial Finance Mock Data
const defaultFinances = [
    { id: "F001", date: "2026-03-17", category: "Persembahan", desc: "Persembahan Ibadah Raya", type: "Masuk", amount: 4500000 },
    { id: "F002", date: "2026-03-15", category: "Operasional", desc: "Pembayaran Listrik & Air", type: "Keluar", amount: 1200000 },
    { id: "F003", date: "2026-03-14", category: "Perpuluhan", desc: "Transfer Jemaat", type: "Masuk", amount: 8000000 },
    { id: "F004", date: "2026-03-10", category: "Pelayanan", desc: "Biaya Konsumsi Rapat Majelis", type: "Keluar", amount: 500000 }
];

// App State
let members = [];
let finances = [];

let currentUserRole = null;
let currentEditId = null;
let currentFinanceEditId = null;

// Initialize Dashboard
document.addEventListener("DOMContentLoaded", () => {
    if (checkLogin()) {
        initApp();
    } else {
        setupLogin();
    }
});

function checkLogin() {
    currentUserRole = sessionStorage.getItem("gbt_role");
    const appContainer = document.getElementById("appContainer");
    const loginContainer = document.getElementById("login-container");
    
    if (!currentUserRole) {
        if (appContainer) appContainer.style.display = "none";
        if (loginContainer) loginContainer.style.display = "flex";
        return false;
    } else {
        if (appContainer) appContainer.style.display = "flex";
        if (loginContainer) loginContainer.style.display = "none";
        
        applyPermissions();
        return true;
    }
}

function setupLogin() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const role = document.getElementById("loginRole").value;
            const pass = document.getElementById("loginPassword").value;
            
            // Memeriksa password sesuai role
            let isValid = false;
            if (role === 'Admin') {
                if (pass === 'adminGBT') isValid = true;
            } else {
                if (pass.toLowerCase() === role.toLowerCase() || pass === role + "123") isValid = true;
            }

            if (isValid) {
                sessionStorage.setItem("gbt_role", role);
                window.location.reload();
            } else {
                document.getElementById("loginError").style.display = "block";
            }
        });
    }
}

function applyPermissions() {
    const label = document.getElementById("currentUserLabel");
    if (label) label.textContent = currentUserRole + " GBT";
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("gbt_role");
            window.location.reload();
        });
    }

    if (currentUserRole === "Tamu") {
        const regNav = document.querySelector("[data-target='registration']");
        if(regNav) regNav.style.display = "none";
        const finNav = document.querySelector("[data-target='finance']");
        if(finNav) finNav.style.display = "none";
        const addMemberBtn = document.querySelector("#dashboard .btn-primary");
        if(addMemberBtn) addMemberBtn.style.display = "none";
    } else if (currentUserRole === "User") {
        const finNav = document.querySelector("[data-target='finance']");
        if(finNav) finNav.style.display = "none";
    }
}

function initApp() {
    loadData();
    setupNavigation();
    renderTable();
    updateStats();
    populateCardSelect();
    renderFinanceTable();

    // Setup Form submission
    document.getElementById("memberForm").addEventListener("submit", handleRegistration);
    document.getElementById("financeForm").addEventListener("submit", handleFinanceSubmit);
    
    // Set default date for finance form
    document.getElementById("financeDate").valueAsDate = new Date();
}

function loadData() {
    const storedMembers = localStorage.getItem("gbt_members");
    if (storedMembers) members = JSON.parse(storedMembers);
    else { members = [...defaultMembers]; saveData(); }

    const storedFinances = localStorage.getItem("gbt_finances");
    if (storedFinances) finances = JSON.parse(storedFinances);
    else { finances = [...defaultFinances]; saveFinanceData(); }
}

function saveData() {
    localStorage.setItem("gbt_members", JSON.stringify(members));
}

function saveFinanceData() {
    localStorage.setItem("gbt_finances", JSON.stringify(finances));
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Navigation Logic
function setupNavigation() {
    const navItems = document.querySelectorAll(".sidebar-nav li");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("data-target");
            if (target === 'registration') {
                if (typeof resetRegistrationForm === 'function') resetRegistrationForm();
            }
            // Update active state in sidebar
            document.querySelectorAll(".sidebar-nav li").forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            // Switch page
            switchPage(target);
        });
    });
}

function switchPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");

    // Optional dynamic updates on view change
    if (pageId === 'dashboard') {
        renderTable();
        updateStats();
    } else if (pageId === 'member-card') {
        populateCardSelect();
    }
}

// Table Rendering
function renderTable() {
    const tbody = document.getElementById("memberTableBody");
    tbody.innerHTML = "";

    members.forEach((member, index) => {
        const age = calculateAge(member.tanggalLahir);
        let statusBadge = "badge-success";
        if (member.status === "Pasif") statusBadge = "badge-warning";
        if (member.status === "Meninggal" || member.status === "Pindah") statusBadge = "badge-danger";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${member.foto || 'https://via.placeholder.com/150'}" class="table-photo" alt="foto"></td>
            <td><strong>${member.namaLengkap}</strong><br><small>${member.id}</small></td>
            <td>${age} Thn</td>
            <td>${member.jenisKelamin}</td>
            <td>${member.noHp}</td>
            <td><span class="badge ${statusBadge}">${member.status}</span></td>
            <td>
                <button class="btn btn-secondary" style="padding: 5px 10px" onclick="viewMember('${member.id}')">Detail</button>
                ${currentUserRole === 'Admin' ? `<button class="btn btn-warning" style="padding: 5px 10px; background: #fef08a; color: #854d0e; border:none; margin-left: 5px;" onclick="editMember('${member.id}')">Edit</button>
                <button class="btn btn-danger" style="padding: 5px 10px; background: #fee2e2; color: #b91c1c; border:none; margin-left: 5px;" onclick="deleteMember('${member.id}')">Hapus</button>` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Stats Update
function updateStats() {
    document.getElementById("totalJemaat").textContent = members.length;
    document.getElementById("totalPria").textContent = members.filter(m => m.jenisKelamin === "Pria").length;
    document.getElementById("totalWanita").textContent = members.filter(m => m.jenisKelamin === "Wanita").length;
}

// Form Submission
function handleRegistration(e) {
    e.preventDefault();

    const dataUrl = document.getElementById("fotoDataUrl").value;
    let finalFoto = dataUrl;
    
    if (!finalFoto) {
        if (currentEditId) {
            const m = members.find(x => x.id === currentEditId);
            finalFoto = m ? m.foto : 'https://via.placeholder.com/150';
        } else {
            finalFoto = 'https://via.placeholder.com/150';
        }
    }

    if (currentEditId) {
        const index = members.findIndex(m => m.id === currentEditId);
        if (index > -1) {
            members[index] = {
                ...members[index],
                namaLengkap: document.getElementById("namaLengkap").value,
                tanggalLahir: document.getElementById("tanggalLahir").value,
                jenisKelamin: document.getElementById("jenisKelamin").value,
                totalKeluarga: document.getElementById("totalKeluarga").value,
                alamat: document.getElementById("alamat").value,
                noHp: document.getElementById("noHp").value,
                peranGbt: document.getElementById("peranGbt").value,
                komisi: Array.from(document.getElementById("komisi").selectedOptions).map(opt => opt.value).join(", "),
                status: document.getElementById("status").value,
                foto: finalFoto
            };
        }
        alert("Data anggota berhasil diperbarui!");
    } else {
        const newMember = {
            id: "M" + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
            namaLengkap: document.getElementById("namaLengkap").value,
            tanggalLahir: document.getElementById("tanggalLahir").value,
            jenisKelamin: document.getElementById("jenisKelamin").value,
            totalKeluarga: document.getElementById("totalKeluarga").value,
            alamat: document.getElementById("alamat").value,
            noHp: document.getElementById("noHp").value,
            peranGbt: document.getElementById("peranGbt").value,
            komisi: Array.from(document.getElementById("komisi").selectedOptions).map(opt => opt.value).join(", "),
            status: document.getElementById("status").value,
            foto: finalFoto
        };
        members.push(newMember);
        alert("Data anggota berhasil disimpan!");
    }

    saveData();
    resetRegistrationForm();
    
    switchPage("dashboard");

    // update nav active state
    document.querySelectorAll(".sidebar-nav li").forEach(nav => nav.classList.remove("active"));
    document.querySelector(".sidebar-nav li[data-target='dashboard']").classList.add("active");
}

function resetRegistrationForm() {
    document.getElementById("memberForm").reset();
    document.getElementById("previewImg").src = "https://via.placeholder.com/150";
    document.getElementById("fotoDataUrl").value = "";
    currentEditId = null;
    
    const regTitle = document.getElementById("regPageTitle");
    const regDesc = document.getElementById("regPageDesc");
    const btnSubmit = document.getElementById("btnSubmitMember");
    
    if(regTitle) regTitle.textContent = "Registrasi Anggota Baru";
    if(regDesc) regDesc.textContent = "Masukkan data detail anggota untuk pendaftaran ke sistem.";
    if(btnSubmit) btnSubmit.textContent = "Simpan Data Anggota";
}

function editMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    currentEditId = id;
    
    switchPage('registration');
    
    // update nav active state
    document.querySelectorAll(".sidebar-nav li").forEach(nav => nav.classList.remove("active"));
    document.querySelector(".sidebar-nav li[data-target='registration']").classList.add("active");
    
    const regTitle = document.getElementById("regPageTitle");
    const regDesc = document.getElementById("regPageDesc");
    const btnSubmit = document.getElementById("btnSubmitMember");
    
    if(regTitle) regTitle.textContent = "Edit Data Anggota";
    if(regDesc) regDesc.textContent = "Ubah data anggota yang sudah ada di sistem.";
    if(btnSubmit) btnSubmit.textContent = "Perbarui Data";
    
    document.getElementById("namaLengkap").value = member.namaLengkap;
    document.getElementById("tanggalLahir").value = member.tanggalLahir;
    document.getElementById("jenisKelamin").value = member.jenisKelamin;
    document.getElementById("totalKeluarga").value = member.totalKeluarga;
    document.getElementById("alamat").value = member.alamat;
    document.getElementById("noHp").value = member.noHp;
    document.getElementById("peranGbt").value = member.peranGbt;
    
    const komisiSelect = document.getElementById("komisi");
    Array.from(komisiSelect.options).forEach(opt => opt.selected = false);
    const memberKomisis = member.komisi.split(", ");
    Array.from(komisiSelect.options).forEach(opt => {
        if (memberKomisis.includes(opt.value)) {
            opt.selected = true;
        }
    });

    document.getElementById("status").value = member.status;
    document.getElementById("previewImg").src = member.foto;
    document.getElementById("fotoDataUrl").value = member.foto.startsWith('data:') ? member.foto : '';
}

// Delete Member
function deleteMember(id) {
    if (confirm("Apakah Anda yakin ingin menghapus anggota ini?")) {
        members = members.filter(m => m.id !== id);
        saveData();
        renderTable();
        updateStats();
    }
}

// View Member Modal
function viewMember(id) {
    const member = members.find(m => m.id === id);
    if (!member) return;

    const age = calculateAge(member.tanggalLahir);
    const modalBody = document.getElementById("modalBody");
    modalBody.innerHTML = `
        <div style="display:flex; gap: 20px; align-items: start;">
            <img src="${member.foto}" style="width:120px; border-radius: 8px;">
            <div>
                <h3>${member.namaLengkap}</h3>
                <p style="color:var(--text-muted); margin-bottom: 15px;">ID: ${member.id}</p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                    <p><strong>Total Keluarga:</strong> ${member.totalKeluarga} Orang</p>
                    <p><strong>Usia:</strong> ${age} Tahun</p>
                    <p><strong>J.Kelamin:</strong> ${member.jenisKelamin}</p>
                    <p><strong>No HP:</strong> ${member.noHp}</p>
                    <p><strong>Posisi:</strong> ${member.peranGbt}</p>
                    <p><strong>Komisi:</strong> ${member.komisi}</p>
                    <p><strong>Status:</strong> ${member.status}</p>
                </div>
                <div style="margin-top: 10px; font-size: 14px;">
                    <strong>Alamat:</strong><br>
                    ${member.alamat}
                </div>
            </div>
        </div>
    `;

    document.getElementById("memberModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("memberModal").style.display = "none";
}

// Card Generator
function populateCardSelect() {
    const select = document.getElementById("cardMemberSelect");
    select.innerHTML = '<option value="">-- Pilih Anggota --</option>';

    members.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = `${m.namaLengkap} (${m.id})`;
        select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
        if (!e.target.value) {
            clearCard();
            return;
        }
        const member = members.find(m => m.id === e.target.value);
        if (member) {
            document.getElementById("cardNama").textContent = member.namaLengkap;
            document.getElementById("cardNo").textContent = "No: " + member.id;
            document.getElementById("cardFoto").src = member.foto;

            // Format TTL
            const d = new Date(member.tanggalLahir);
            const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            document.getElementById("cardTtl").textContent = formattedDate;

            document.getElementById("cardPosisi").textContent = member.peranGbt;
            document.getElementById("cardKomisi").textContent = member.komisi;

            const cardObj = document.getElementById("idCardElement");
            if (member.peranGbt === "Jemaat" || member.peranGbt === "Jemaat Umum") {
                cardObj.style.backgroundColor = "lightgreen";
            } else if (member.peranGbt === "Pengurus") {
                cardObj.style.backgroundColor = "yellow";
            } else if (member.peranGbt === "Majelis") {
                cardObj.style.backgroundColor = "silver";
            } else if (member.peranGbt === "Pendeta" || member.peranGbt === "Hamba Tuhan") {
                cardObj.style.backgroundColor = "gold";
            } else {
                cardObj.style.backgroundColor = "white";
            }
        }
    });
}

function clearCard() {
    document.getElementById("cardNama").textContent = "NAMA LENGKAP";
    document.getElementById("cardNo").textContent = "No: -";
    document.getElementById("cardFoto").src = "https://via.placeholder.com/100";
    document.getElementById("cardTtl").textContent = "-";
    document.getElementById("cardPosisi").textContent = "-";
    document.getElementById("cardKomisi").textContent = "-";
    document.getElementById("idCardElement").style.backgroundColor = "white";
}

function printCard() {
    const select = document.getElementById("cardMemberSelect");
    if (!select.value) {
        alert("Pilih anggota terlebih dahulu!");
        return;
    }

    // Open a simple window to print just the card
    const printContent = document.getElementById("idCardElement").outerHTML;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Kartu - GBT Kristus Penolong-Pasuruan - ${document.getElementById('cardNama').textContent}</title>
            <link rel="stylesheet" href="style.css">
            <style>
                body { display: flex; justify-content: center; align-items: center; height: 100vh; background: white;}
                ion-icon { display: none; } /* hide icon if script doesn't load fast enough, or just leave it */
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
}

// Finance Module
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function renderFinanceTable() {
    const tbody = document.getElementById("financeTableBody");
    tbody.innerHTML = "";
    
    let totalMasuk = 0;
    let totalKeluar = 0;

    // Sort by date descending
    const sortedFinances = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date));

    sortedFinances.forEach(tx => {
        if (tx.type === "Masuk") totalMasuk += tx.amount;
        else totalKeluar += tx.amount;

        const badgeClass = tx.type === "Masuk" ? "badge-success" : "badge-danger";
        const d = new Date(tx.date);
        const formattedDate = `${d.getDate().toString().padStart(2,'0')} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${tx.category}</strong></td>
            <td>${tx.desc}</td>
            <td><span class="badge ${badgeClass}">${tx.type}</span></td>
            <td style="font-weight: 500;">${formatCurrency(tx.amount)}</td>
            <td>
                ${currentUserRole === 'Admin' ? `
                <button class="btn btn-warning" style="padding: 5px 10px; background: #fef08a; color: #854d0e; border:none; margin-right: 5px;" onclick="editFinance('${tx.id}')">Edit</button>
                <button class="btn btn-danger" style="padding: 5px 10px; background: #fee2e2; color: #b91c1c; border:none;" onclick="deleteFinance('${tx.id}')">Hapus</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });

    const saldo = totalMasuk - totalKeluar;

    document.getElementById("totalPemasukan").textContent = formatCurrency(totalMasuk);
    document.getElementById("totalPengeluaran").textContent = formatCurrency(totalKeluar);
    document.getElementById("totalSaldo").textContent = formatCurrency(saldo);
}

function handleFinanceSubmit(e) {
    e.preventDefault();
    
    if (currentFinanceEditId) {
        const index = finances.findIndex(f => f.id === currentFinanceEditId);
        if (index > -1) {
            finances[index] = {
                ...finances[index],
                date: document.getElementById("financeDate").value,
                type: document.getElementById("financeType").value,
                category: document.getElementById("financeCategory").value,
                amount: parseInt(document.getElementById("financeAmount").value, 10),
                desc: document.getElementById("financeDesc").value
            };
        }
        alert("Transaksi berhasil diperbarui!");
    } else {
        const newTx = {
            id: "F" + Date.now().toString().slice(-6),
            date: document.getElementById("financeDate").value,
            type: document.getElementById("financeType").value,
            category: document.getElementById("financeCategory").value,
            amount: parseInt(document.getElementById("financeAmount").value, 10),
            desc: document.getElementById("financeDesc").value
        };
        finances.push(newTx);
        alert("Transaksi berhasil ditambahkan!");
    }

    saveFinanceData();
    renderFinanceTable();
    cancelFinanceEdit();
}

function editFinance(id) {
    const tx = finances.find(f => f.id === id);
    if (!tx) return;
    
    currentFinanceEditId = id;
    
    document.getElementById("financeDate").value = tx.date;
    document.getElementById("financeType").value = tx.type;
    document.getElementById("financeCategory").value = tx.category;
    document.getElementById("financeAmount").value = tx.amount;
    document.getElementById("financeDesc").value = tx.desc;
    
    document.getElementById("textSubmitFinance").textContent = "Perbarui Transaksi";
    document.getElementById("btnCancelFinance").style.display = "inline-flex";
    
    // Scroll to form
    document.getElementById("financeForm").scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelFinanceEdit() {
    currentFinanceEditId = null;
    
    document.getElementById("financeForm").reset();
    document.getElementById("financeDate").valueAsDate = new Date();
    
    document.getElementById("textSubmitFinance").textContent = "Tambah Transaksi";
    document.getElementById("btnCancelFinance").style.display = "none";
}

function deleteFinance(id) {
    if(confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        finances = finances.filter(f => f.id !== id);
        saveFinanceData();
        renderFinanceTable();
    }
}

function printFinanceReport() {
    let totalMasuk = 0;
    let totalKeluar = 0;

    const sortedFinances = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date));

    let tableRows = '';
    sortedFinances.forEach((tx, index) => {
        if (tx.type === "Masuk") totalMasuk += tx.amount;
        else totalKeluar += tx.amount;

        const d = new Date(tx.date);
        const formattedDate = `${d.getDate().toString().padStart(2,'0')} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;

        tableRows += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${formattedDate}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${tx.category}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${tx.desc}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${tx.type}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(tx.amount)}</td>
            </tr>
        `;
    });

    const saldo = totalMasuk - totalKeluar;

    const printContent = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2>Laporan Keuangan GBT Kristus Penolong-Pasuruan</h2>
            <p style="color: #666;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; background-color: #f8fff8;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Total Pemasukan</h3>
                <p style="margin: 0; font-size: 18px; color: #16a34a; font-weight: bold;">${formatCurrency(totalMasuk)}</p>
            </div>
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; background-color: #fff8f8;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Total Pengeluaran</h3>
                <p style="margin: 0; font-size: 18px; color: #dc2626; font-weight: bold;">${formatCurrency(totalKeluar)}</p>
            </div>
            <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; background-color: #f8f9ff;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #555;">Saldo Akhir</h3>
                <p style="margin: 0; font-size: 18px; color: #2563eb; font-weight: bold;">${formatCurrency(saldo)}</p>
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
            <thead>
                <tr style="background-color: #f1f5f9;">
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">No</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">Tanggal</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">Kategori</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">Keterangan</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">Tipe</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: right;">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Laporan Keuangan</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
                @media print {
                    @page { margin: 1cm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
}

// --- PHOTO UPLOAD & CAMERA SYSTEM ---

// Handle File Input Selection
const fotoFileInput = document.querySelector("#fotoFile");
if (fotoFileInput) {
    fotoFileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            processImageFile(file);
        }
    });
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Compress image to max 300x300
            const canvas = document.createElement("canvas");
            const MAX_SIZE = 300;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            document.getElementById("previewImg").src = dataUrl;
            document.getElementById("fotoDataUrl").value = dataUrl;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Camera Logic
let videoStream = null;

function openCamera() {
    const modal = document.getElementById("cameraModal");
    const video = document.getElementById("cameraVideo");
    
    modal.style.display = "flex";
    
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoStream = stream;
            video.srcObject = stream;
        })
        .catch(err => {
            alert("Tidak dapat mengakses kamera: " + err.message + "\nPastikan Anda memberikan izin kamera.");
            closeCamera();
        });
}

function closeCamera() {
    document.getElementById("cameraModal").style.display = "none";
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cameraCanvas");
    
    if (!videoStream) return;
    
    // Set canvas dimensions to match video ratio but smaller
    canvas.width = 300;
    canvas.height = 300 * (video.videoHeight / video.videoWidth);
    
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to image
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    
    // Update preview
    document.getElementById("previewImg").src = dataUrl;
    document.getElementById("fotoDataUrl").value = dataUrl;
    
    closeCamera();
}

// Print Jemaat List
function printJemaatList() {
    let tableRows = '';
    
    members.forEach((member, index) => {
        const age = calculateAge(member.tanggalLahir);
        tableRows += `
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${member.namaLengkap}<br><small style="color:#666;">${member.id}</small></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${age} Thn</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${member.jenisKelamin}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${member.noHp}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${member.status}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${member.peranGbt}<br><small style="color:#666;">${member.komisi}</small></td>
            </tr>
        `;
    });

    const printContent = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2>Daftar Anggota Jemaat GBT Kristus Penolong-Pasuruan</h2>
            <p style="color: #666;">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style="display: flex; justify-content: space-around; margin-bottom: 20px; font-size: 14px;">
            <div style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #f8f9ff;">
                <strong>Total Jemaat:</strong> ${members.length} Orang
            </div>
            <div style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #f8fff8;">
                <strong>Pria:</strong> ${members.filter(m => m.jenisKelamin === "Pria").length} Orang
            </div>
            <div style="padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #fff8f8;">
                <strong>Wanita:</strong> ${members.filter(m => m.jenisKelamin === "Wanita").length} Orang
            </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px;">
            <thead>
                <tr style="background-color: #f1f5f9;">
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">No</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">Nama & ID</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">Usia</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">L/P</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">No HP</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">Status</th>
                    <th style="padding: 10px 8px; border: 1px solid #ddd; text-align: left;">Peran & Komisi</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Daftar Jemaat</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
                @media print {
                    @page { margin: 1cm; size: landscape; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                setTimeout(() => {
                    window.print();
                    window.close();
                }, 500);
            </script>
        </body>
        </html>
    `);
}
