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
    
    // Setup Search - Enter key triggers search, clearing input resets table
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });
    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim() === "") {
            renderTable();
        }
    });

    // Set default date for finance form
    document.getElementById("financeDate").valueAsDate = new Date();
}

function loadData() {
    const storedMembers = localStorage.getItem("gbt_members");
    if (storedMembers) {
        members = JSON.parse(storedMembers);
        let idSet = new Set();
        let changed = false;
        members.forEach(m => {
            if (idSet.has(m.id)) {
                m.id = "M" + Date.now().toString() + Math.floor(Math.random() * 1000);
                changed = true;
            }
            idSet.add(m.id);
        });
        if (changed) saveData();
    }
    else { members = [...defaultMembers]; saveData(); }

    const storedFinances = localStorage.getItem("gbt_finances");
    if (storedFinances) finances = JSON.parse(storedFinances);
    else { finances = [...defaultFinances]; saveFinanceData(); }
}

function saveData() {
    localStorage.setItem("gbt_members", JSON.stringify(members));
    syncToGitHub();
}

function saveFinanceData() {
    localStorage.setItem("gbt_finances", JSON.stringify(finances));
    syncToGitHub();
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
function renderTable(filteredList) {
    const tbody = document.getElementById("memberTableBody");
    tbody.innerHTML = "";

    const dataToRender = filteredList || members;

    if (dataToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 40px; color: var(--text-muted); font-style: italic;">Tidak ada data anggota yang ditemukan.</td></tr>`;
        return;
    }

    dataToRender.forEach((member, index) => {
        const age = calculateAge(member.tanggalLahir);
        let statusBadge = "badge-success";
        if (member.status === "Pasif") statusBadge = "badge-warning";
        if (member.status === "Meninggal" || member.status === "Pindah") statusBadge = "badge-danger";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${member.foto || 'https://via.placeholder.com/150'}" class="table-photo" alt="foto"></td>
            <td><strong>${member.namaLengkap}</strong></td>
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

// Search / Filter Members
function performSearch() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();

    // If empty, show all members
    if (!query) {
        renderTable();
        return;
    }

    const filtered = members.filter(member => {
        return (
            member.namaLengkap.toLowerCase().includes(query) ||
            member.id.toLowerCase().includes(query) ||
            member.noHp.toLowerCase().includes(query) ||
            member.alamat.toLowerCase().includes(query) ||
            member.peranGbt.toLowerCase().includes(query) ||
            member.jenisKelamin.toLowerCase().includes(query) ||
            member.status.toLowerCase().includes(query) ||
            (member.komisi && member.komisi.toLowerCase().includes(query))
        );
    });

    // Switch to dashboard to show results
    switchPage('dashboard');
    document.querySelectorAll(".sidebar-nav li").forEach(nav => nav.classList.remove("active"));
    const dashNav = document.querySelector("[data-target='dashboard']");
    if (dashNav) dashNav.classList.add("active");

    renderTable(filtered);
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
            id: "M" + Date.now().toString(),
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
                <h2 style="margin: 0; color:var(--text-dark);">${member.namaLengkap}</h2>
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
        opt.textContent = m.namaLengkap;
        select.appendChild(opt);
    });

    select.addEventListener("change", (e) => {
        if (!e.target.value) {
            clearCard();
            return;
        }
        const member = members.find(m => m.id === e.target.value);
        if (member) {
            document.getElementById("cardNama").textContent = member.namaLengkap.toUpperCase();
            document.getElementById("cardFoto").src = member.foto;

            // Format TTL (Dihapus dari tampilan sesuai permintaan)
            // const d = new Date(member.tanggalLahir);
            // const formattedDate = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

            document.getElementById("cardPosisi").textContent = member.peranGbt;
            document.getElementById("cardKomisi").textContent = member.komisi;

            const cardObj = document.getElementById("idCardElement");
            if (member.peranGbt === "Jemaat" || member.peranGbt === "Jemaat Umum") {
                cardObj.style.backgroundColor = "lightgreen";
            } else if (member.peranGbt === "Pengurus") {
                cardObj.style.backgroundColor = "lightblue";
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
    document.getElementById("cardFoto").src = "https://via.placeholder.com/100";
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

// Print Member Table
function printMemberTable() {
    if (members.length === 0) {
        alert("Tidak ada data anggota untuk dicetak!");
        return;
    }

    const totalPria = members.filter(m => m.jenisKelamin === "Pria").length;
    const totalWanita = members.filter(m => m.jenisKelamin === "Wanita").length;

    let tableRows = "";
    members.forEach((member, index) => {
        const age = calculateAge(member.tanggalLahir);
        tableRows += `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td><strong>${member.namaLengkap}</strong></td>
                <td style="text-align:center;">${age} Thn</td>
                <td style="text-align:center;">${member.jenisKelamin}</td>
                <td>${member.noHp}</td>
                <td>${member.alamat}</td>
                <td style="text-align:center;">${member.peranGbt}</td>
                <td>${member.komisi || '-'}</td>
                <td style="text-align:center;">${member.status}</td>
            </tr>
        `;
    });

    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const printWindow = window.open('', '', 'width=1000,height=700');
    printWindow.document.write(`
        <html>
        <head>
            <title>Daftar Anggota Jemaat - GBT Kristus Penolong-Pasuruan</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
                .print-header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3a5f; padding-bottom: 15px; }
                .print-header h1 { font-size: 18px; color: #1e3a5f; margin-bottom: 3px; }
                .print-header h2 { font-size: 14px; color: #555; font-weight: normal; }
                .print-header p.date { font-size: 11px; color: #999; margin-top: 5px; }
                .stats-row { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; }
                .stats-row .stat { background: #f0f4f8; padding: 8px 20px; border-radius: 6px; text-align: center; }
                .stats-row .stat h4 { font-size: 11px; color: #666; text-transform: uppercase; }
                .stats-row .stat p { font-size: 18px; font-weight: 700; color: #1e3a5f; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; }
                thead th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
                tbody td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
                tbody tr:nth-child(even) { background: #f8fafc; }
                .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
                @media print { body { padding: 15px; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>GBT Kristus Penolong-Pasuruan</h1>
                <h2>Daftar Anggota Jemaat</h2>
                <p class="date">Dicetak pada: ${today}</p>
            </div>
            <div class="stats-row">
                <div class="stat"><h4>Total Jemaat</h4><p>${members.length}</p></div>
                <div class="stat"><h4>Pria</h4><p>${totalPria}</p></div>
                <div class="stat"><h4>Wanita</h4><p>${totalWanita}</p></div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Nama Lengkap</th>
                        <th>Usia</th>
                        <th>L/P</th>
                        <th>No HP</th>
                        <th>Alamat</th>
                        <th>Posisi</th>
                        <th>Komisi</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} GBT Kristus Penolong-Pasuruan &mdash; Sistem Data Jemaat</p>
            </div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            <\/script>
        </body>
        </html>
    `);
}

// Print Finance Report
function printFinanceReport() {
    if (finances.length === 0) {
        alert("Tidak ada data keuangan untuk dicetak!");
        return;
    }

    let totalMasuk = 0;
    let totalKeluar = 0;

    const sortedFinances = [...finances].sort((a, b) => new Date(b.date) - new Date(a.date));

    let tableRows = "";
    sortedFinances.forEach((tx, index) => {
        if (tx.type === "Masuk") totalMasuk += tx.amount;
        else totalKeluar += tx.amount;

        const d = new Date(tx.date);
        const formattedDate = `${d.getDate().toString().padStart(2,'0')} ${d.toLocaleString('id-ID', { month: 'short' })} ${d.getFullYear()}`;

        tableRows += `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${formattedDate}</td>
                <td><strong>${tx.category}</strong></td>
                <td>${tx.desc}</td>
                <td style="text-align:center;">
                    <span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600;
                        background: ${tx.type === 'Masuk' ? '#d1fae5' : '#fee2e2'};
                        color: ${tx.type === 'Masuk' ? '#065f46' : '#b91c1c'};">
                        ${tx.type}
                    </span>
                </td>
                <td style="text-align:right; font-weight: 500;">${formatCurrency(tx.amount)}</td>
            </tr>
        `;
    });

    const saldo = totalMasuk - totalKeluar;
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

    const printWindow = window.open('', '', 'width=900,height=700');
    printWindow.document.write(`
        <html>
        <head>
            <title>Laporan Keuangan - GBT Kristus Penolong-Pasuruan</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #333; }
                .print-header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3a5f; padding-bottom: 15px; }
                .print-header h1 { font-size: 18px; color: #1e3a5f; margin-bottom: 3px; }
                .print-header h2 { font-size: 14px; color: #555; font-weight: normal; }
                .print-header p.date { font-size: 11px; color: #999; margin-top: 5px; }
                .finance-summary { display: flex; justify-content: center; gap: 20px; margin-bottom: 25px; }
                .finance-summary .card { padding: 12px 25px; border-radius: 8px; text-align: center; min-width: 180px; }
                .finance-summary .card h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
                .finance-summary .card p { font-size: 16px; font-weight: 700; }
                .card-income { background: #d1fae5; color: #065f46; }
                .card-income p { color: #065f46; }
                .card-expense { background: #fee2e2; color: #b91c1c; }
                .card-expense p { color: #b91c1c; }
                .card-balance { background: #dbeafe; color: #1e40af; }
                .card-balance p { color: #1e40af; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
                thead th { background: #1e3a5f; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
                tbody td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
                tbody tr:nth-child(even) { background: #f8fafc; }
                .footer { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
                @media print { body { padding: 15px; } }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>GBT Kristus Penolong-Pasuruan</h1>
                <h2>Laporan Keuangan Gereja</h2>
                <p class="date">Dicetak pada: ${today}</p>
            </div>
            <div class="finance-summary">
                <div class="card card-income">
                    <h4>Total Pemasukan</h4>
                    <p>${formatCurrency(totalMasuk)}</p>
                </div>
                <div class="card card-expense">
                    <h4>Total Pengeluaran</h4>
                    <p>${formatCurrency(totalKeluar)}</p>
                </div>
                <div class="card card-balance">
                    <h4>Saldo Kas</h4>
                    <p>${formatCurrency(saldo)}</p>
                </div>
            </div>
            <h3 style="font-size: 13px; margin-bottom: 10px; color: #1e3a5f;">Riwayat Transaksi</h3>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Tanggal</th>
                        <th>Kategori</th>
                        <th>Keterangan</th>
                        <th>Tipe</th>
                        <th style="text-align:right;">Jumlah (Rp)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} GBT Kristus Penolong-Pasuruan &mdash; Sistem Data Jemaat</p>
            </div>
            <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
            <\/script>
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
                <button class="btn btn-danger" style="padding: 5px 10px; background: #fee2e2; color: #b91c1c; border:none;" onclick="deleteFinance('${tx.id}')">Hapus</button>
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
    
    const newTx = {
        id: "F" + Date.now().toString().slice(-6),
        date: document.getElementById("financeDate").value,
        type: document.getElementById("financeType").value,
        category: document.getElementById("financeCategory").value,
        amount: parseInt(document.getElementById("financeAmount").value, 10),
        desc: document.getElementById("financeDesc").value
    };

    finances.push(newTx);
    saveFinanceData();
    renderFinanceTable();
    
    // Reset inputs except date and type
    document.getElementById("financeCategory").value = "";
    document.getElementById("financeAmount").value = "";
    document.getElementById("financeDesc").value = "";
    
    alert("Transaksi berhasil ditambahkan!");
}

function deleteFinance(id) {
    if(confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
        finances = finances.filter(f => f.id !== id);
        saveFinanceData();
        renderFinanceTable();
    }
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

// ==========================================
// BACKUP: Simpan & Ambil Data (localStorage)
// ==========================================

function simpanDataBackup() {
    try {
        const backupData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backupData[key] = localStorage.getItem(key);
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "local_storage_backup.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert("✅ Data berhasil disimpan ke file local_storage_backup.json!");
    } catch (err) {
        alert("❌ Gagal menyimpan data: " + err.message);
    }
}

function ambilDataBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
        alert("❌ File harus berformat .json!");
        event.target.value = "";
        return;
    }

    const confirmLoad = confirm(
        "⚠️ Data yang ada saat ini akan ditimpa dengan data dari file backup.\n\nLanjutkan?"
    );
    if (!confirmLoad) {
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const backupData = JSON.parse(e.target.result);

            // Restore all keys to localStorage
            for (const key in backupData) {
                if (backupData.hasOwnProperty(key)) {
                    localStorage.setItem(key, backupData[key]);
                }
            }

            alert("✅ Data berhasil dimuat dari file backup! Halaman akan di-refresh.");
            window.location.reload();
        } catch (err) {
            alert("❌ File tidak valid atau rusak: " + err.message);
        }
    };

    reader.onerror = function () {
        alert("❌ Gagal membaca file.");
    };

    reader.readAsText(file);
    event.target.value = "";
}

// ==========================================
// GITHUB AUTO-SYNC
// ==========================================
async function syncToGitHub() {
    let token = localStorage.getItem("github_pat");
    if (!token || token !== "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") {
        token = "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";
        localStorage.setItem("github_pat", token);
    }

    const repoOwner = "danitjahjno";
    const repoName = "GBTWEB";
    const filePath = "local_storage_backup.json";
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    try {
        // 1. Dapatkan semua data dari localStorage
        const backupData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key !== "github_pat") { // Jangan upload token!
                backupData[key] = localStorage.getItem(key);
            }
        }
        const jsonString = JSON.stringify(backupData, null, 2);
        
        // Convert to Base64 (supporting Unicode)
        const encodedContent = btoa(unescape(encodeURIComponent(jsonString)));

        // 2. Cek apakah file sudah ada di GitHub untuk mendapatkan SHA
        let sha = null;
        const getRes = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (getRes.ok) {
            const getData = await getRes.json();
            sha = getData.sha;
        } else if (getRes.status === 401) {
            alert("Token GitHub tidak valid atau kedaluwarsa. Token akan dihapus dari sistem.");
            localStorage.removeItem("github_pat");
            return;
        } else if (getRes.status !== 404) {
             console.error("Gagal mengambil data dari GitHub:", getRes.statusText);
             return;
        }

        // 3. Update file di GitHub
        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Auto-save backup ${new Date().toISOString()}`,
                content: encodedContent,
                sha: sha // Diperlukan jika file sudah ada
            })
        });

        if (putRes.ok) {
            console.log("✅ Auto-save ke GitHub berhasil!");
        } else {
            const errData = await putRes.json();
            console.error("❌ Auto-save ke GitHub gagal:", errData);
            if (putRes.status === 401 || putRes.status === 403) {
                 alert("Izin GitHub ditolak. Pastikan token memiliki hak akses 'repo'.");
            }
        }

    } catch (err) {
        console.error("Kesalahan jaringan saat sync ke GitHub:", err);
    }
}
