document.addEventListener("DOMContentLoaded", function () {
  // Back to Top functionality
  const backToTopButton = document.getElementById("backToTop");
  const floatingLoading = document.getElementById("floatingLoading");
  const loadingProgressBar = document.getElementById("loadingProgressBar");

  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("show");
      } else {
        backToTopButton.classList.remove("show");
      }
    });

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // KODE UTAMA
  const form = document.getElementById("checkForm");
  const resultsContainer = document.getElementById("resultsContainer");
  const resultsBody = document.getElementById("resultsBody");
  const btnText = document.querySelector(".btn-text");
  const btnLoader = document.querySelector(".btn-loader");
  const exportButtons = document.getElementById("exportButtons");
  const exportExcel = document.getElementById("exportExcel");
  const exportTxt = document.getElementById("exportTxt");
  const exportWhatsApp = document.getElementById('exportWhatsApp');

    // Event listeners untuk export
    exportExcel.addEventListener('click', function(e) {
        e.preventDefault();
        exportToExcel();
    });
    
    exportTxt.addEventListener('click', function(e) {
        e.preventDefault();
        exportToTxt();
    });
    
    exportWhatsApp.addEventListener('click', function(e) {
        e.preventDefault();
        exportToWhatsApp();
    });


  let currentType = "postpaid";
  let resultsData = [];
  const CONCURRENT_REQUESTS = 1; //Ganti menjadi  atau 3 untuk proses yang lebih cepat namun dengan konsekuensi nomor urut menjadi tidak tertata

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const idpelList = document.getElementById("idpel_list").value.trim();
    currentType = document.querySelector('input[name="type"]:checked').value;

    if (!idpelList) {
      alert("Masukkan minimal satu ID Pelanggan!");
      return;
    }

    // Show floating loading
    showFloatingLoading();

    // Show loading state pada tombol
    btnText.style.display = "none";
    btnLoader.style.display = "flex";

    // Prepare data
    const idpelArray = idpelList
      .split("\n")
      .map((id) => id.trim())
      .filter((id) => id);

    // Reset results
    resultsBody.innerHTML = "";
    resultsData = [];
    exportButtons.style.display = "none";
    resultsContainer.style.display = "block";

    // Update table header based on type
    updateTableHeader(currentType);

    // Process IDs dengan Parallel Fetch
    processIdsParallel(idpelArray, currentType);
  });

  // Fungsi untuk menampilkan floating loading
  function showFloatingLoading() {
    floatingLoading.classList.add("show");
    loadingProgressBar.style.width = "0%";
  }

  // Fungsi untuk menyembunyikan floating loading
  function hideFloatingLoading() {
    floatingLoading.classList.remove("show");
  }

  // Fungsi untuk update progress loading
  function updateLoadingProgress(processed, total) {
    const progress = (processed / total) * 100;
    loadingProgressBar.style.width = `${progress}%`;

    // Update subtitle dengan progress
    const subtitle = floatingLoading.querySelector(".loading-subtitle");
    subtitle.textContent = `Sedang mengecek ${processed} dari ${total} ID Pelanggan`;
  }

  async function processIdsParallel(ids, type) {
    const totalIds = ids.length;
    let processedCount = 0;

    // Update loading progress awal
    updateLoadingProgress(0, totalIds);

    // Process in batches
    for (let i = 0; i < totalIds; i += CONCURRENT_REQUESTS) {
      const batch = ids.slice(i, i + CONCURRENT_REQUESTS);
      const batchPromises = batch.map((idpel, batchIndex) =>
        fetchSingleId(idpel, type, i + batchIndex + 1)
      );

      // Wait for all requests in current batch to complete
      await Promise.allSettled(batchPromises);

      // Update progress
      processedCount += batch.length;

      // Update floating loading progress
      updateLoadingProgress(processedCount, totalIds);

      // Small delay between batches to prevent API rate limiting
      if (i + CONCURRENT_REQUESTS < totalIds) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // All done - hide floating loading
    setTimeout(() => {
      hideFloatingLoading();
      finishProcessing();
    }, 500);
  }

  async function fetchSingleId(idpel, type, no) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch("check.php", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `idpel=${encodeURIComponent(idpel)}&type=${type}`,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Simpan data untuk export (hanya postpaid)
        if (type === "postpaid") {
          resultsData.push({
            no: no,
            idpel: idpel,
            nama: data.nama,
            tarif: data.tarif,
            periode: data.periode,
            bulan: data.bulan,
            stand: data.stand,
            tagihan: data.tagihan,
            total: data.tagihan + 4000,
          });
        }

        // Add result to table based on type
        if (type === "prepaid") {
          addPrepaidResultToTable(no, data);
        } else {
          addPostpaidResultToTable(no, idpel, data);
        }
      } else {
        // Tampilkan pesan error dari API dengan format yang lebih baik
        let errorMessage = data.error || "Gagal mengambil data";

        // Tambahkan informasi code jika ada
        if (data.code) {
          errorMessage = `[${data.code}] ${errorMessage}`;
        }

        addErrorToTable(no, idpel, errorMessage);
      }
    } catch (error) {
      console.error("Error fetching:", error);
      const errorMsg =
        error.name === "AbortError"
          ? "Timeout - Request terlalu lama"
          : "Gagal terhubung ke server";
      addErrorToTable(no, idpel, errorMsg);
    }
  }

function finishProcessing() {
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
    
    // Show export buttons hanya untuk postpaid
    if (currentType === 'postpaid' && resultsData.length > 0) {
        exportButtons.style.display = 'block'; // Ganti dari 'flex' ke 'block'
    }
}
  function updateTableHeader(type) {
    const tableHead = document.querySelector("#resultsTable thead tr");
    if (type === "prepaid") {
      tableHead.innerHTML = `
                <th class="tengah">No</th>
                <th class="tengah">ID Pelanggan</th>
                <th class="tengah">Nomor Meter</th>
                <th class="tengah">Nama</th>
                <th class="tengah">Tarif / Daya</th>
            `;
    } else {
      tableHead.innerHTML = `
                <th class="tengah">No</th>
                <th class="tengah">IDPEL</th>
                <th class="tengah">Nama</th>
                <th class="tengah">Tarif / Daya</th>
                <th class="tengah">Periode</th>
                <th class="tengah">Jumlah Bulan</th>
                <th class="tengah">Stand Meter</th>
                <th class="tengah">Tagihan (Rp)</th>
                <th class="tengah">Total Bayar (Rp)</th>
            `;
    }
  }

  function addPostpaidResultToTable(no, idpel, data) {
    const row = document.createElement("tr");
    row.className = "new-row";

    // Format tarif/daya
    let tarif = data.tarif;
    if (tarif && tarif.includes("/")) {
      const parts = tarif.split("/");
      if (parts.length >= 2) {
        const dayaPart = parts[1].replace(/^0+/, "");
        tarif = parts[0] + "/" + dayaPart;
      }
    }

    // Calculate total
    const tagihanValue = data.tagihan || 0;
    const totalValue = tagihanValue + 4000;
    const tagihanFormatted =
      tagihanValue > 0 ? formatCurrency(tagihanValue) : "Data tidak tersedia";
    const totalFormatted =
      totalValue > 4000 ? formatCurrency(totalValue) : "Data tidak tersedia";

    row.innerHTML = `
            <td class="kanan">${no}</td>
            <td class="kanan">${idpel}</td>
            <td>${escapeHtml(data.nama)}</td>
            <td>${escapeHtml(tarif)}</td>
            <td>${escapeHtml(data.periode)}</td>
            <td class="tengah">${escapeHtml(data.bulan)}</td>
            <td class="tengah">${escapeHtml(data.stand)}</td>
            <td class="kanan">${tagihanFormatted}</td>
            <td class="${totalValue > 4000 ? "success" : ""} kanan">${totalFormatted}</td>
        `;

    resultsBody.appendChild(row);
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function addPrepaidResultToTable(no, data) {
    const row = document.createElement("tr");
    row.className = "new-row";

    // Format tarif/daya
    let tarif = data.segment_power;
    if (tarif && tarif.includes("/")) {
      const parts = tarif.split("/");
      if (parts.length >= 2) {
        const dayaPart = parts[1].replace(/^0+/, "");
        tarif = parts[0] + "/" + dayaPart;
      }
    }

    row.innerHTML = `
            <td>${no}</td>
            <td>${data.subscriber_id || "Data tidak tersedia"}</td>
            <td>${data.meter_number || "Data tidak tersedia"}</td>
            <td>${escapeHtml(
              data.subscriber_name || "Data tidak tersedia"
            )}</td>
            <td>${escapeHtml(tarif || "Data tidak tersedia")}</td>
        `;

    resultsBody.appendChild(row);
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function addErrorToTable(no, idpel, message) {
    const row = document.createElement("tr");
    row.className = "new-row error";

    const colspan = currentType === "prepaid" ? "4" : "8";

    // Tambahkan class khusus berdasarkan jenis error
    if (message.includes("Tagihan sudah dibayar")) {
      row.classList.add("warning");
    } else if (message.includes("tidak ditemukan")) {
      row.classList.add("info");
    }

    row.innerHTML = `
            <td>${no}</td>
            <td>${idpel}</td>
            <td colspan="${colspan}" class="error-message">${message}</td>
        `;

    resultsBody.appendChild(row);
    row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
    // Fungsi untuk generate konten WhatsApp (sama dengan format TXT)
    function generateWhatsAppContent() {
        if (resultsData.length === 0) return '';
        
        let whatsappContent = "⚡ HASIL CEK TAGIHAN PLN ⚡\n";
        whatsappContent += "===========================\n\n";
        
        resultsData.forEach(item => {
            // Format tarif/daya
            let tarif = item.tarif;
            if (tarif && tarif.includes('/')) {
                const parts = tarif.split('/');
                if (parts.length >= 2) {
                    const dayaPart = parts[1].replace(/^0+/, '');
                    tarif = parts[0] + '/' + dayaPart;
                }
            }
            
            whatsappContent += `🔹 No: ${item.no}\n`;
            whatsappContent += `🔹 IDPEL: ${item.idpel}\n`;
            whatsappContent += `🔹 Nama: ${item.nama}\n`;
            whatsappContent += `🔹 Tarif/Daya: ${tarif}\n`;
            whatsappContent += `🔹 Periode: ${item.periode}\n`;
            whatsappContent += `🔹 Jumlah Bulan: ${item.bulan}\n`;
            whatsappContent += `🔹 Stand Meter: ${item.stand}\n`;
            whatsappContent += `🔹 Tagihan: Rp ${formatCurrency(item.tagihan)}\n`;
            whatsappContent += `🔹 Total Bayar: Rp ${formatCurrency(item.total)}\n`;
            whatsappContent += "─".repeat(30) + "\n\n";
        });
        
        whatsappContent += `\n📊 Total Data: ${resultsData.length}\n`;
        whatsappContent += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
        whatsappContent += `\n_Digenerate otomatis oleh Live Cek Tagihan PLN_`;
        
        return whatsappContent;
    }

    // Fungsi untuk share ke WhatsApp
    function exportToWhatsApp() {
        if (resultsData.length === 0) {
            alert('Tidak ada data untuk di-share!');
            return;
        }
        
        const whatsappContent = generateWhatsAppContent();
        
        // Encode content untuk URL
        const encodedContent = encodeURIComponent(whatsappContent);
        
        // Buat WhatsApp URL
        const whatsappUrl = `https://wa.me/send?text=${encodedContent}`;
        
        // Buka WhatsApp di tab baru
        window.open(whatsappUrl, '_blank');
    }
    
  function exportToExcel() {
    if (resultsData.length === 0) return;

    // Create CSV content
    let csvContent =
      "No,IDPEL,Nama,Tarif/Daya,Periode,Jumlah Bulan,Stand Meter,Tagihan (Rp),Total Bayar (Rp)\n";

    resultsData.forEach((item) => {
      // Format tarif/daya
      let tarif = item.tarif;
      if (tarif && tarif.includes("/")) {
        const parts = tarif.split("/");
        if (parts.length >= 2) {
          const dayaPart = parts[1].replace(/^0+/, "");
          tarif = parts[0] + "/" + dayaPart;
        }
      }

      const row = [
        item.no,
        `"${item.idpel}"`,
        `"${item.nama}"`,
        `"${tarif}"`,
        `"${item.periode}"`,
        `"${item.bulan}"`,
        `"${item.stand}"`,
        formatCurrency(item.tagihan),
        formatCurrency(item.total),
      ].join(",");

      csvContent += row + "\n";
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tagihan_pln_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportToTxt() {
    if (resultsData.length === 0) return;

    // Create TXT content
    let txtContent = "HASIL CEK TAGIHAN PLN\n";
    txtContent += "=====================\n\n";

    resultsData.forEach((item) => {
      // Format tarif/daya
      let tarif = item.tarif;
      if (tarif && tarif.includes("/")) {
        const parts = tarif.split("/");
        if (parts.length >= 2) {
          const dayaPart = parts[1].replace(/^0+/, "");
          tarif = parts[0] + "/" + dayaPart;
        }
      }

      txtContent += `No: ${item.no}\n`;
      txtContent += `IDPEL: ${item.idpel}\n`;
      txtContent += `Nama: ${item.nama}\n`;
      txtContent += `Tarif/Daya: ${tarif}\n`;
      txtContent += `Periode: ${item.periode}\n`;
      txtContent += `Jumlah Bulan: ${item.bulan}\n`;
      txtContent += `Stand Meter: ${item.stand}\n`;
      txtContent += `Tagihan: Rp ${formatCurrency(item.tagihan)}\n`;
      txtContent += `Total Bayar: Rp ${formatCurrency(item.total)}\n`;
      txtContent += "------------------------\n\n";
    });

    txtContent += `\nTotal Data: ${resultsData.length}\n`;
    txtContent += `Tanggal Export: ${new Date().toLocaleDateString("id-ID")}`;

    // Create and download file
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tagihan_pln_${new Date().toISOString().split("T")[0]}.txt`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("id-ID").format(amount);
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
});
