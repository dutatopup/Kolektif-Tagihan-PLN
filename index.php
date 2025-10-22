<?php
require_once 'core/config.php';
?>
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>⚡ Live Cek Tagihan PLN </title>
    <link rel="stylesheet" href="assets/style.css?v=<?php echo time(); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>

<body>
    <div class="container">
        <header>
            <h1>⚡ Live Cek Tagihan PLN</h1>
            <p class="subtitle">Cek kolektif tagihan listrik!</p>
        </header>

        <div class="card">
            <form id="checkForm" method="POST">
                <div class="form-group">
                    <label for="idpel_list">Masukkan ID Pelanggan (satu per baris):</label>
                    <textarea id="idpel_list" name="idpel_list" placeholder="525050111000&#10;525052111000"></textarea>
                </div>

                <div class="form-group">
                    <label>Tipe Tagihan:</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="type" value="postpaid" checked>
                            <span class="radio-custom"></span>
                            Pascabayar
                        </label>
                        <label class="radio-option disabled">
                            <input type="radio" name="type" value="prepaid" disabled>
                            <span class="radio-custom"></span>
                            Prabayar
                            <span class="coming-soon">(Coming Soon)</span>
                        </label>
                    </div>
                    <div class="feature-note">
                        ⚠️ Fitur Prabayar sedang dalam pengembangan
                    </div>
                </div>

                <button type="submit" class="btn-primary">
                    <span class="btn-text">🚀 Mulai Cek Tagihan</span>
                    <div class="btn-loader" style="display: none;">
                        <div class="spinner"></div>
                    </div>
                </button>
            </form>
        </div>

        <!-- Results Table -->
        <div id="resultsContainer" class="card" style="display: none;">
            <div class="results-header">
                <h3>📋 Hasil Pengecekan</h3>
                <div class="export-dropdown-container">
                    <div id="exportButtons" class="export-dropdown" style="display: none;">
                        <button class="export-dropdown-btn">
                            📤 Export & Share
                            <span class="dropdown-arrow">▼</span>
                        </button>
                        <div class="export-dropdown-content">
                            <a href="#" id="exportExcel" class="dropdown-item">
                                📊 Export CSV
                            </a>
                            <a href="#" id="exportTxt" class="dropdown-item">
                                📝 Export TXT
                            </a>
                            <a href="#" id="exportWhatsApp" class="dropdown-item">
                                💬 Share WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="table-container">
                <table id="resultsTable">
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>IDPEL</th>
                            <th>Nama</th>
                            <th>Tarif / Daya</th>
                            <th>Periode</th>
                            <th>Jumlah Bulan</th>
                            <th>Stand Meter</th>
                            <th>Tagihan (Rp)</th>
                            <th>Total Bayar (Rp)</th>
                        </tr>
                    </thead>
                    <tbody id="resultsBody">
                        <!-- Results will be inserted here dynamically -->
                    </tbody>
                </table>
            </div>
        </div>
        <!-- Floating Loading Spinner -->
        <div class="floating-loading" id="floatingLoading">
            <div class="modern-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-inner"></div>
                <div class="spinner-dot"></div>
            </div>
            <div class="loading-content">
                <div class="loading-title">🔄 Memproses Data</div>
                <div class="loading-subtitle">Sedang mengecek tagihan PLN</div>
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
            </div>
            <div class="loading-progress">
                <div class="loading-progress-bar" id="loadingProgressBar"></div>
            </div>
        </div>
        <!-- Floating Donation Button -->
        <div class="floating-donation">
            <button class="donation-btn" onclick="openDonation()">
                <span class="donation-icon">❤️</span>
                <span class="donation-text">Support</span>
            </button>
            <div class="donation-tooltip">
                Dukung pengembangan kami
            </div>
        </div>
        <!-- Floating back-to-top -->
        <button class="back-to-top" id="backToTop" aria-label="Kembali ke atas">
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" />
            </svg>
            <span class="back-to-top-text">Back to Top</span>
        </button>

        <script src="assets/script.js?v=<?php echo time(); ?>"></script>
        <script>
            function openDonation() {
                window.open('https://saweria.co/mazagungid', '_blank');
            }

            // Hide tooltip after 5 seconds
            setTimeout(() => {
                const tooltip = document.querySelector('.donation-tooltip');
                if (tooltip) {
                    tooltip.style.opacity = '0';
                }
            }, 5000);
        </script>
</body>

</html>
